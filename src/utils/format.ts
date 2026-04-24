// Shared formatting helpers — keeps the entire lab-landing app on one unit
// system (GB for storage) so the user never sees the same number rendered as
// MB in one card and GB in another.
//
// These mirror the helpers in labbox-fe/src/@core/utils/formatters.ts.
// Keep them in sync when the business rules change.

export const STORAGE_UNIT = 'GB';
export const BYTES_PER_GB = 1024 ** 3; // 1,073,741,824

/**
 * Convert a raw byte count to a fixed-unit GB string, e.g. "1.25 GB".
 * Returns "0 GB" for null / 0 / negative inputs. The number of decimals
 * defaults to 2; trailing zeros are dropped so integer GB looks clean.
 */
export const formatBytesAsGB = (
  bytes: number | null | undefined,
  decimals = 2
): string => {
  const n = Number(bytes ?? 0);
  if (!Number.isFinite(n) || n <= 0) return `0 ${STORAGE_UNIT}`;
  const gb = n / BYTES_PER_GB;
  const str = gb.toFixed(decimals).replace(/\.?0+$/, '');
  return `${str} ${STORAGE_UNIT}`;
};

/**
 * Format a value that's already in GB (e.g. plan.max_storage_gb) using the
 * same output shape as formatBytesAsGB. Integers stay integers ("50 GB"),
 * fractional values keep up to `decimals` places with trailing zeros dropped.
 */
export const formatGB = (
  gb: number | null | undefined,
  decimals = 2
): string => {
  const n = Number(gb ?? 0);
  if (!Number.isFinite(n) || n < 0) return `0 ${STORAGE_UNIT}`;
  if (Number.isInteger(n)) return `${n} ${STORAGE_UNIT}`;
  return `${n.toFixed(decimals).replace(/\.?0+$/, '')} ${STORAGE_UNIT}`;
};

/**
 * Returns used/quota as a 0..100 percentage. Guards against divide-by-zero
 * (returns 0 when quota is missing or 0) and caps at 100 so an over-quota
 * user renders a full — not clipping — progress bar.
 */
export const storageUsagePercent = (
  usedBytes: number | null | undefined,
  quotaGB: number | null | undefined
): number => {
  const used = Number(usedBytes ?? 0);
  const quota = Number(quotaGB ?? 0);
  if (!Number.isFinite(used) || !Number.isFinite(quota) || quota <= 0) return 0;
  const pct = (used / (quota * BYTES_PER_GB)) * 100;
  if (!Number.isFinite(pct) || pct < 0) return 0;
  return Math.min(100, pct);
};

/**
 * Shallow date formatter used by several CMS tables. Kept here so the three
 * copies scattered through App.tsx / VideoManagement.tsx / Profile.tsx can
 * converge on a single implementation over time.
 */
export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN');
};
