function normalizeSignedInt32(value: number): number {
  const normalized = value | 0;
  return normalized === 0 ? 1 : normalized;
}

/**
 * Maps a logical reminder key to a deterministic Android notification id.
 *
 * The result stays inside the signed 32-bit range required by the plugin.
 */
export function toAndroidNotificationId(logicalId: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < logicalId.length; index += 1) {
    hash ^= logicalId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return normalizeSignedInt32(hash);
}
