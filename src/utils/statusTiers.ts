/**
 * Shared helpers for widgets that display a tiered status label.
 *
 * Widgets keep their own color palettes; only the label text is driven by the
 * `statusLabels` prop so all widgets share a single configurable vocabulary.
 */

export function tierIndex(
  value: number,
  min: number,
  max: number,
  count: number,
): number {
  if (count <= 1) return 0;
  const range = max - min;
  if (range <= 0) return 0;
  const clamped = Math.max(min, Math.min(max, value));
  const pct = (clamped - min) / range;
  return Math.min(count - 1, Math.floor(pct * count));
}

export function pickLabel(
  labels: unknown,
  index: number,
  fallback: string,
): string {
  if (!Array.isArray(labels) || labels.length === 0) return fallback;
  if (index < labels.length) {
    const v = labels[index];
    return typeof v === "string" && v.length > 0 ? v : fallback;
  }
  const last = labels[labels.length - 1];
  return typeof last === "string" && last.length > 0 ? last : fallback;
}

export function pickColor(palette: string[], index: number): string {
  if (palette.length === 0) return "";
  if (index < palette.length) return palette[index];
  return palette[palette.length - 1];
}

export function labelCount(labels: unknown): number {
  return Array.isArray(labels) ? labels.length : 0;
}