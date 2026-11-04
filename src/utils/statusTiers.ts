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

/** Green to red; the default colour of a tier, spread over as many tiers as there are. */
const DEFAULT_TIER_COLORS = ["#22c55e", "#eab308", "#f97316", "#ef4444", "#b91c1c"];

/** Colours that are safe to put in a style: hex, rgb(a), hsl(a) or a var(--name). */
const SAFE_COLOR =
  /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([\d\s.,%/-]+\)|var\(--[\w-]+\))$/i;

/** `value` trimmed, when it is a colour that is safe to put in a style. */
export function safeColor(value: unknown): string | undefined {
  return typeof value === "string" && SAFE_COLOR.test(value.trim()) ? value.trim() : undefined;
}

/**
 * One colour per tier: the template's `tierColors` where it names a valid one,
 * the green-to-red default elsewhere.
 */
export function resolveTierColors(custom: unknown, count: number): string[] {
  const n = Math.max(count, 1);
  const given = Array.isArray(custom) ? custom : [];
  return Array.from({ length: n }, (_, i) => {
    const c = given[i];
    if (typeof c === "string" && SAFE_COLOR.test(c.trim())) return c.trim();
    return DEFAULT_TIER_COLORS[
      n <= 1 ? 0 : Math.round((i / (n - 1)) * (DEFAULT_TIER_COLORS.length - 1))
    ];
  });
}
