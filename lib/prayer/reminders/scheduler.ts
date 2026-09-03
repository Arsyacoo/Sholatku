import type { ReminderEvent } from './types';
import { sendPrayerReminderNotification } from './notification';
import { getDueReminderEvents, getNextReminderEvent } from './schedule';

export const REMINDER_LATE_TOLERANCE_MS = 3 * 60 * 1000;
export const REMINDER_CHANNEL_NAME = 'sholatku-prayer-reminders';
export const REMINDER_LEDGER_KEY = 'sholatku_prayer_reminder_ledger_v1';
export const REMINDER_CLAIM_EXPIRY_MS = 15 * 1000;
export const REMINDER_RETRY_COOLDOWN_MS = 60 * 1000;
export const REMINDER_LEDGER_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

const MAX_TIMER_DELAY_MS = 60 * 1000;
const LEGACY_FIRED_REMINDERS_KEY = 'sholatku_fired_prayer_reminders_v1';
const memoryLedger = new Map<string, ReminderLedgerRecord>();

export type ReminderDeliveryStatus = 'DUE' | 'CLAIMED-ATTEMPT' | 'DELIVERED' | 'FAILED-RELEASED';

export interface ReminderLedgerRecord {
  id: string;
  status: ReminderDeliveryStatus;
  ownerId?: string;
  updatedAt: number;
}

function getStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // Continue with session storage or an in-memory coordinator.
  }
  try {
    if (typeof sessionStorage !== 'undefined') return sessionStorage;
  } catch {
    // Private browsing can deny both storage APIs.
  }
  return null;
}

function readLedger(now = Date.now()): ReminderLedgerRecord[] {
  const storage = getStorage();
  if (!storage) {
    return [...memoryLedger.values()].filter((record) => now - record.updatedAt <= REMINDER_LEDGER_RETENTION_MS);
  }
  try {
    const raw = storage.getItem(REMINDER_LEDGER_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((record): record is ReminderLedgerRecord => {
      if (!record || typeof record !== 'object') return false;
      const candidate = record as ReminderLedgerRecord;
      return typeof candidate.id === 'string'
        && typeof candidate.status === 'string'
        && ['DUE', 'CLAIMED-ATTEMPT', 'DELIVERED', 'FAILED-RELEASED'].includes(candidate.status)
        && typeof candidate.updatedAt === 'number'
        && Number.isFinite(candidate.updatedAt)
        && now - candidate.updatedAt <= REMINDER_LEDGER_RETENTION_MS;
    });
  } catch {
    return [];
  }
}

function writeLedger(records: ReminderLedgerRecord[]): void {
  const storage = getStorage();
  if (!storage) {
    memoryLedger.clear();
    for (const record of records) memoryLedger.set(record.id, record);
    return;
  }
  try {
    storage.setItem(REMINDER_LEDGER_KEY, JSON.stringify(records));
  } catch {
    // Delivery must remain best effort when storage is unavailable or full.
  }
}

function createOwnerId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    // Fall through to a non-cryptographic tab identifier.
  }
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function postDeliveryEvent(channel: BroadcastChannel | null, record: ReminderLedgerRecord): void {
  try {
    channel?.postMessage(record);
  } catch {
    // BroadcastChannel is an enhancement; localStorage remains the source of truth.
  }
}

/** Coordinates reminder claims between tabs and records delivery only after success. */
export class PrayerReminderDeliveryCoordinator {
  readonly ownerId: string;
  private readonly storage: Storage | null;
  private readonly channel: BroadcastChannel | null;
  private readonly onStorage = () => undefined;
  private readonly onMessage = () => undefined;

  constructor(ownerId = createOwnerId()) {
    this.ownerId = ownerId;
    this.storage = getStorage();
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(REMINDER_CHANNEL_NAME);
    } catch {
      channel = null;
    }
    this.channel = channel;
    this.channel?.addEventListener('message', this.onMessage);
    if (typeof window !== 'undefined') window.addEventListener('storage', this.onStorage);
  }

  claim(id: string, now = Date.now()): boolean {
    const records = readLedger(now);
    const existing = records.find((record) => record.id === id);
    if (existing?.status === 'DELIVERED') return false;
    if (existing?.status === 'CLAIMED-ATTEMPT' && now - existing.updatedAt < REMINDER_CLAIM_EXPIRY_MS) return false;
    if (existing?.status === 'FAILED-RELEASED' && now - existing.updatedAt < REMINDER_RETRY_COOLDOWN_MS) return false;

    const claimed: ReminderLedgerRecord = { id, status: 'CLAIMED-ATTEMPT', ownerId: this.ownerId, updatedAt: now };
    writeLedger([...records.filter((record) => record.id !== id), claimed]);
    // A read-after-write check makes simultaneous localStorage writers converge
    // on the tab whose claim is visible in the shared ledger.
    const persisted = readLedger(now).find((record) => record.id === id);
    if (persisted?.ownerId !== this.ownerId || persisted.status !== 'CLAIMED-ATTEMPT') return false;
    postDeliveryEvent(this.channel, claimed);
    return true;
  }

  markDelivered(id: string, now = Date.now()): void {
    const records = readLedger(now);
    const delivered: ReminderLedgerRecord = { id, status: 'DELIVERED', ownerId: this.ownerId, updatedAt: now };
    writeLedger([...records.filter((record) => record.id !== id), delivered]);
    postDeliveryEvent(this.channel, delivered);
  }

  release(id: string, now = Date.now()): void {
    const records = readLedger(now);
    const failed: ReminderLedgerRecord = { id, status: 'FAILED-RELEASED', ownerId: this.ownerId, updatedAt: now };
    writeLedger([...records.filter((record) => record.id !== id), failed]);
    postDeliveryEvent(this.channel, failed);
  }

  isDelivered(id: string, now = Date.now()): boolean {
    return readLedger(now).some((record) => record.id === id && record.status === 'DELIVERED');
  }

  prune(now = Date.now()): void {
    writeLedger(readLedger(now));
  }

  close(): void {
    this.channel?.removeEventListener('message', this.onMessage);
    try {
      this.channel?.close();
    } catch {
      // Ignore an already closed channel.
    }
    if (typeof window !== 'undefined') window.removeEventListener('storage', this.onStorage);
  }
}

export function hasFiredReminder(id: string): boolean {
  return readLedger().some((record) => record.id === id && record.status === 'DELIVERED');
}

/** Compatibility helper for older callers; new delivery goes through the coordinator. */
export function markReminderFired(id: string, firedAt = Date.now()): void {
  const records = readLedger(firedAt);
  writeLedger([...records.filter((record) => record.id !== id), {
    id,
    status: 'DELIVERED',
    updatedAt: firedAt,
  }]);
}

export function clearFiredReminderEvents(): void {
  memoryLedger.clear();
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(REMINDER_LEDGER_KEY);
    storage.removeItem(LEGACY_FIRED_REMINDERS_KEY);
  } catch {
    // Ignore unavailable storage in private browsing contexts.
  }
}

export type ReminderNotificationSink = (event: ReminderEvent) => boolean | void | Promise<boolean | void>;

export class PrayerReminderScheduler {
  private events: ReminderEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly notify: ReminderNotificationSink;
  private readonly delivery: PrayerReminderDeliveryCoordinator;

  constructor(
    notify: ReminderNotificationSink = sendPrayerReminderNotification,
    delivery = new PrayerReminderDeliveryCoordinator(),
  ) {
    this.notify = notify;
    this.delivery = delivery;
  }

  start(events: ReminderEvent[]): void {
    this.events = [...events];
    this.recalculate();
  }

  update(events: ReminderEvent[], now: Date = new Date()): void {
    this.events = [...events];
    this.recalculate(undefined, now);
  }

  recalculate(events?: ReminderEvent[], now: Date = new Date()): void {
    if (events) this.events = [...events];
    this.clearTimer();
    const nowMs = now.getTime();

    for (const event of getDueReminderEvents(this.events, now, REMINDER_LATE_TOLERANCE_MS)) {
      if (!this.delivery.claim(event.id, nowMs)) continue;
      void this.deliver(event, nowMs);
    }

    const next = getNextReminderEvent(this.events, now);
    if (!next) return;
    const delay = Math.min(Math.max(0, next.reminderAt.getTime() - nowMs), MAX_TIMER_DELAY_MS);
    this.timer = setTimeout(() => this.recalculate(), delay);
  }

  stop(): void {
    this.clearTimer();
    this.events = [];
  }

  dispose(): void {
    this.stop();
    this.delivery.close();
  }

  private async deliver(event: ReminderEvent, nowMs: number): Promise<void> {
    try {
      const result = await this.notify(event);
      if (result === false) this.delivery.release(event.id, nowMs);
      else this.delivery.markDelivered(event.id, Date.now());
    } catch {
      this.delivery.release(event.id, Date.now());
    }
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
