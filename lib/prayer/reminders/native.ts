import type { PrayerReminderSettings, RamadanPreferences, UserLocation, UserSettings } from '@/types';
import { getDailyPrayerTimes } from '@/lib/prayer/api';
import { buildRamadanTiming } from '@/lib/ramadan/timing';
import { getRamadanStatus } from '@/lib/ramadan/calendar';
import { getPrayerReminderSettings, getRamadanPreferences, getSavedLocation, getSavedSettings } from '@/lib/storage/preferences';
import { formatDateInTimeZone } from '@/lib/time/timezone';
import { isNativeRuntime } from '@/lib/platform/runtime';
import {
  addNativeNotificationActionListener,
  cancelNativeNotifications,
  ensureReminderNotificationChannel,
  getNativePendingNotifications,
  getNotificationPermissionState,
  getNativeReminderChannelId,
  isNativeReminderNotification,
  scheduleNativeNotifications,
  type NativeNotificationPending,
  type NativeNotificationRequest,
  type NormalizedNotificationPermissionState,
} from '@/lib/platform/notifications';

import { buildReminderNotificationCopy, buildReminderNotificationExtra, isApprovedReminderRoute, REMINDER_NOTIFICATION_SOURCE } from './copy';
import { filterFutureReminderEvents, buildPrayerReminderEvents, buildRamadanReminderEvents, parsePrayerDateTime } from './schedule';
import type { ReminderEvent, ReminderRoute } from './types';
import { toAndroidNotificationId } from './id';

export const NATIVE_REMINDER_HORIZON_HOURS = 48;
export const NATIVE_REMINDER_HORIZON_MS = NATIVE_REMINDER_HORIZON_HOURS * 60 * 60 * 1000;
export const NATIVE_REMINDER_TEST_DELAY_MS = 15_000;

export interface NativeReminderSyncSnapshot {
  location: UserLocation;
  settings: UserSettings;
  reminderSettings: PrayerReminderSettings;
  ramadanPreferences: RamadanPreferences;
}

export interface NativeReminderPendingSummary {
  id: number;
  title: string;
  body: string;
  route: ReminderRoute;
  logicalId: string | null;
  scheduleAt: Date | null;
}

export interface NativeReminderDiagnostics {
  runtime: 'android' | 'web';
  permission: NormalizedNotificationPermissionState;
  enabled: boolean;
  channelId: string;
  horizonHours: number;
  pendingCount: number;
  nextPending: NativeReminderPendingSummary | null;
}

export interface NativeReminderSyncResult extends NativeReminderDiagnostics {
  scheduledCount: number;
  canceledCount: number;
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function getTomorrowDate(now: Date): Date {
  const tomorrow = cloneDate(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

function createNativeNotificationId(logicalId: string): number {
  return toAndroidNotificationId(`sholatku:${logicalId}`);
}

function isReminderRouteValue(value: unknown): value is ReminderRoute {
  return typeof value === 'string' && isApprovedReminderRoute(value);
}

function mapPendingSummary(notification: NativeNotificationPending): NativeReminderPendingSummary {
  const extra = notification.extra as Record<string, unknown> | undefined;
  const route = isReminderRouteValue(extra?.route) ? extra.route : '/';
  const logicalId = typeof extra?.logicalId === 'string' ? extra.logicalId : null;
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    route,
    logicalId,
    scheduleAt: notification.schedule?.at ? new Date(notification.schedule.at) : null,
  };
}

function buildNativeNotificationRequest(event: ReminderEvent): NativeNotificationRequest {
  const copy = buildReminderNotificationCopy(event);
  return {
    id: createNativeNotificationId(event.id),
    title: copy.title,
    body: copy.body,
    at: event.reminderAt,
    extra: buildReminderNotificationExtra(event),
  };
}

function dedupeReminderEvents(events: ReminderEvent[]): ReminderEvent[] {
  const unique = new Map<string, ReminderEvent>();
  for (const event of events) unique.set(event.id, event);
  return [...unique.values()].sort((a, b) => a.reminderAt.getTime() - b.reminderAt.getTime());
}

async function buildNativeReminderEvents(
  snapshot: NativeReminderSyncSnapshot,
  now: Date
): Promise<ReminderEvent[]> {
  const tomorrow = getTomorrowDate(now);
  const [todaySchedule, tomorrowSchedule] = await Promise.all([
    getDailyPrayerTimes(snapshot.location, snapshot.settings, now),
    getDailyPrayerTimes(snapshot.location, snapshot.settings, tomorrow),
  ]);

  const events: ReminderEvent[] = [
    ...buildPrayerReminderEvents(todaySchedule, snapshot.reminderSettings, now, tomorrowSchedule),
    ...buildPrayerReminderEvents(tomorrowSchedule, snapshot.reminderSettings, now),
  ];

  for (const schedule of [todaySchedule, tomorrowSchedule]) {
    const ramadanAnchor = parsePrayerDateTime(schedule.date, '12:00', schedule.timezone);
    const ramadanStatus = getRamadanStatus(ramadanAnchor, snapshot.ramadanPreferences, schedule.timezone);
    if (!ramadanStatus.isRamadan) continue;

    events.push(
      ...buildRamadanReminderEvents(
        buildRamadanTiming(schedule, snapshot.ramadanPreferences.imsakOffsetMinutes),
        snapshot.ramadanPreferences.reminders
      )
    );
  }

  return filterFutureReminderEvents(dedupeReminderEvents(events), now, NATIVE_REMINDER_HORIZON_MS);
}

export function loadNativeReminderSyncSnapshot(): NativeReminderSyncSnapshot {
  return {
    location: getSavedLocation(),
    settings: getSavedSettings(),
    reminderSettings: getPrayerReminderSettings(),
    ramadanPreferences: getRamadanPreferences(),
  };
}

export async function getNativeReminderDiagnostics(
  snapshot: NativeReminderSyncSnapshot = loadNativeReminderSyncSnapshot()
): Promise<NativeReminderDiagnostics> {
  const permission = await getNotificationPermissionState();
  const pending = await getNativePendingNotifications();
  const ours = pending.filter(isNativeReminderNotification);
  const summaries = ours.map(mapPendingSummary).sort((a, b) => {
    const aTime = a.scheduleAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = b.scheduleAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  return {
    runtime: isNativeRuntime() ? 'android' : 'web',
    permission,
    enabled: snapshot.settings.enableNotifications,
    channelId: getNativeReminderChannelId(),
    horizonHours: NATIVE_REMINDER_HORIZON_HOURS,
    pendingCount: summaries.length,
    nextPending: summaries[0] ?? null,
  };
}

export async function reconcileNativeReminderSchedule(
  snapshot: NativeReminderSyncSnapshot = loadNativeReminderSyncSnapshot()
): Promise<NativeReminderSyncResult> {
  const diagnostics = await getNativeReminderDiagnostics(snapshot);

  await ensureReminderNotificationChannel();

  const pending = await getNativePendingNotifications();
  const ours = pending.filter(isNativeReminderNotification);
  const pendingIds = ours.map((notification) => notification.id);

  if (!snapshot.settings.enableNotifications || diagnostics.permission !== 'granted') {
    await cancelNativeNotifications(pendingIds);
    const refreshed = await getNativeReminderDiagnostics(snapshot);
    return {
      ...refreshed,
      scheduledCount: 0,
      canceledCount: pendingIds.length,
    };
  }

  const events = await buildNativeReminderEvents(snapshot, new Date());
  const requests = events.map(buildNativeNotificationRequest);

  await cancelNativeNotifications(pendingIds);
  await scheduleNativeNotifications(requests);

  const refreshed = await getNativeReminderDiagnostics(snapshot);
  return {
    ...refreshed,
    scheduledCount: requests.length,
    canceledCount: pendingIds.length,
  };
}

export async function scheduleNativeReminderTestNotification(): Promise<boolean> {
  if (!isNativeRuntime()) return false;

  const permission = await getNotificationPermissionState();
  if (permission !== 'granted') return false;

  const scheduledAt = new Date(Date.now() + NATIVE_REMINDER_TEST_DELAY_MS);
  await scheduleNativeNotifications([
    {
      id: createNativeNotificationId(`dev-test:${scheduledAt.toISOString()}`),
      title: 'Sholatku',
      body: 'Tes pengingat native berhasil dijadwalkan.',
      at: scheduledAt,
      extra: {
        source: REMINDER_NOTIFICATION_SOURCE,
        kind: 'dev-test',
        logicalId: `dev-test:${scheduledAt.toISOString()}`,
        date: formatDateInTimeZone(scheduledAt, 'UTC'),
        prayer: 'fajr',
        route: '/',
        timezone: 'UTC',
        offsetMinutes: 0,
      },
    },
  ]);

  return true;
}

export async function addNativeReminderActionListener(
  navigate: (route: ReminderRoute) => void
): Promise<() => Promise<void>> {
  if (!isNativeRuntime()) return async () => undefined;

  return addNativeNotificationActionListener((action) => {
    const extra = action.notification.extra as Record<string, unknown> | undefined;
    const route = extra?.route;
    if (!isReminderRouteValue(route)) return;
    if (extra?.source !== REMINDER_NOTIFICATION_SOURCE) return;
    navigate(route);
  });
}
