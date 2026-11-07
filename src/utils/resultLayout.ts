/**
 * The result page's layout: the blocks it shows, top to bottom. A template
 * without one keeps the page's standard order; a stored one is read leniently,
 * since it comes from saved JSON or the AI.
 */
import type {
  ResultAppearance,
  ResultBlock,
  ResultBlockStyle,
  ResultBlockType,
  ResultCallout,
  ResultCalloutType,
  ResultChecklist,
  ResultChecklistItem,
  ResultImagePlacement,
  ResultMetric,
  ResultShadow,
} from "../types/index.ts";
import { newId } from "./resultContent.ts";
import { safeColor } from "./statusTiers.ts";

/** Blocks a layout may hold; beyond it, new blocks are refused. */
export const MAX_BLOCKS = 24;
/** An HTML block's markup is cut to this many characters. */
export const MAX_HTML_LENGTH = 20_000;
/** Cards a metrics block holds; beyond it, new cards are refused. */
export const MAX_METRICS = 12;
/** Items a checklist block holds; beyond it, new items are refused. */
export const MAX_CHECKLIST_ITEMS = 20;

const PLACEMENTS: ResultImagePlacement[] = ["banner", "afterScore", "beforeActions"];
const TYPES: ResultBlockType[] = [
  "hero",
  "score",
  "note",
  "images",
  "actions",
  "html",
  "divider",
  "metrics",
  "callout",
  "checklist",
];
/** The blocks a layout holds once at most; the author's own blocks repeat. */
const SINGLE: ResultBlockType[] = ["hero", "score", "note", "images", "actions"];

/** The id of a built-in block: its type, and an images block's placement. */
export function builtInId(type: ResultBlockType, placement?: ResultImagePlacement) {
  return type === "images" ? `images-${placement}` : type;
}

/** Whether the block is one of the page's own parts, rather than one the author added. */
export const isBuiltIn = (block: Pick<ResultBlock, "type">) =>
  SINGLE.includes(block.type);

/** The page's standard order, as the template showed it before layouts. */
export function defaultLayout(): ResultBlock[] {
  return [
    { id: builtInId("images", "banner"), type: "images", placement: "banner" },
    { id: "hero", type: "hero" },
    { id: "score", type: "score" },
    { id: builtInId("images", "afterScore"), type: "images", placement: "afterScore" },
    { id: "note", type: "note" },
    { id: builtInId("images", "beforeActions"), type: "images", placement: "beforeActions" },
    { id: "actions", type: "actions" },
  ];
}

/** The built-in blocks' ids, which an author's block never takes. */
const RESERVED = new Set(defaultLayout().map((b) => b.id));

const isTier = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0;

/** A metrics block's cards, read leniently. A card without a value stays, for the editor; the page skips it. */
export function resolveMetrics(raw: unknown): ResultMetric[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: ResultMetric[] = [];
  raw.forEach((item, index) => {
    if (out.length >= MAX_METRICS || !item || typeof item !== "object") return;
    const entry = item as Partial<ResultMetric>;
    let id = typeof entry.id === "string" && entry.id ? entry.id : `metric-${index}`;
    while (seen.has(id)) id += "_";
    seen.add(id);
    const metric: ResultMetric = {
      id,
      label: typeof entry.label === "string" ? entry.label : "",
      value: typeof entry.value === "string" ? entry.value.trim() : "",
    };
    if (typeof entry.unit === "string" && entry.unit) metric.unit = entry.unit;
    if (typeof entry.text === "string") metric.text = entry.text;
    out.push(metric);
  });
  return out;
}

export const CALLOUT_TYPES: ResultCalloutType[] = ["info", "success", "warning", "danger"];

/** A callout block's contents, read leniently. */
export function resolveCallout(raw: unknown): ResultCallout | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const e = raw as Partial<ResultCallout>;
  const type = CALLOUT_TYPES.includes(e.type as never) ? e.type : "info";
  const title = typeof e.title === "string" ? e.title.slice(0, 200) : "";
  const message = typeof e.message === "string" ? e.message.slice(0, 2000) : "";
  return { type, title, message };
}

/** A checklist block's items, read leniently. */
export function resolveChecklist(raw: unknown): ResultChecklist | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const e = raw as Partial<ResultChecklist>;
  const title = typeof e.title === "string" ? e.title.slice(0, 200) : "";
  const items: ResultChecklistItem[] = [];
  if (Array.isArray(e.items)) {
    const seen = new Set<string>();
    e.items.forEach((item, index) => {
      if (items.length >= MAX_CHECKLIST_ITEMS || !item || typeof item !== "object") return;
      const it = item as Partial<ResultChecklistItem>;
      let id = typeof it.id === "string" && it.id ? it.id : `item-${index}`;
      while (seen.has(id)) id += "_";
      seen.add(id);
      items.push({
        id,
        text: typeof it.text === "string" ? it.text.slice(0, 500) : "",
        checked: it.checked === true,
      });
    });
  }
  return { title, items };
}

const ALIGNS: NonNullable<ResultBlockStyle["align"]>[] = ["start", "center", "end"];
const SHADOW_OPTIONS: ResultShadow[] = ["none", "sm", "md", "lg"];

/** `n` as a whole number of px inside 0 to `max`, or undefined. */
function px(n: unknown, max: number): number | undefined {
  return typeof n === "number" && Number.isFinite(n)
    ? Math.min(Math.max(Math.round(n), 0), max)
    : undefined;
}

/** A stored block style read leniently: only valid fields stay; none left, no style. */
export function resolveBlockStyle(raw: unknown): ResultBlockStyle | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const e = raw as Record<string, unknown>;
  const style: ResultBlockStyle = {};
  if (ALIGNS.includes(e.align as never)) style.align = e.align as ResultBlockStyle["align"];
  const background = safeColor(e.background);
  if (background) style.background = background;
  const color = safeColor(e.color);
  if (color) style.color = color;
  const radius = px(e.radius, 48);
  if (radius !== undefined) style.radius = radius;
  const padding = px(e.padding, 64);
  if (padding !== undefined) style.padding = padding;
  const spaceBefore = px(e.spaceBefore, 96);
  if (spaceBefore !== undefined) style.spaceBefore = spaceBefore;
  const borderWidth = px(e.borderWidth, 8);
  if (borderWidth !== undefined) style.borderWidth = borderWidth;
  const borderColor = safeColor(e.borderColor);
  if (borderColor) style.borderColor = borderColor;
  if (SHADOW_OPTIONS.includes(e.shadow as never)) style.shadow = e.shadow as ResultShadow;
  return Object.keys(style).length ? style : undefined;
}

const BUTTON_SHAPES: NonNullable<ResultAppearance["buttonShape"]>[] = ["rounded", "pill", "square"];

/** `n` rounded and clamped to `min`..`max`, or undefined when it is no number. */
function between(n: unknown, min: number, max: number): number | undefined {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** A stored appearance read leniently: only valid fields stay; none left, no appearance. */
export function resolveAppearance(raw: unknown): ResultAppearance | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const e = raw as Record<string, unknown>;
  const a: ResultAppearance = {};
  const maxWidth = between(e.maxWidth, 320, 960);
  if (maxWidth !== undefined) a.maxWidth = maxWidth;
  const radius = px(e.radius, 48);
  if (radius !== undefined) a.radius = radius;
  const gap = px(e.gap, 64);
  if (gap !== undefined) a.gap = gap;
  if (e.showHeader === false) a.showHeader = false;
  const chipBackground = safeColor(e.chipBackground);
  if (chipBackground) a.chipBackground = chipBackground;
  const chipColor = safeColor(e.chipColor);
  if (chipColor) a.chipColor = chipColor;
  if (e.showHeroIcon === false) a.showHeroIcon = false;
  if (typeof e.heroIcon === "string" && /^[\w:.-]{1,80}$/.test(e.heroIcon)) a.heroIcon = e.heroIcon;
  const heroIconColor = safeColor(e.heroIconColor);
  if (heroIconColor) a.heroIconColor = heroIconColor;
  if (ALIGNS.includes(e.heroAlign as never)) a.heroAlign = e.heroAlign as NonNullable<ResultAppearance["heroAlign"]>;
  const metricsMinWidth = between(e.metricsMinWidth, 96, 320);
  if (metricsMinWidth !== undefined) a.metricsMinWidth = metricsMinWidth;
  if (BUTTON_SHAPES.includes(e.buttonShape as never)) a.buttonShape = e.buttonShape as ResultAppearance["buttonShape"];
  if (SHADOW_OPTIONS.includes(e.cardShadow as never)) a.cardShadow = e.cardShadow as ResultShadow;
  const cardBackground = safeColor(e.cardBackground);
  if (cardBackground) a.cardBackground = cardBackground;
  const cardBorderColor = safeColor(e.cardBorderColor);
  if (cardBorderColor) a.cardBorderColor = cardBorderColor;
  const cardBorderWidth = px(e.cardBorderWidth, 8);
  if (cardBorderWidth !== undefined) a.cardBorderWidth = cardBorderWidth;
  return Object.keys(a).length ? a : undefined;
}

export const SHADOW_CSS: Record<ResultShadow, string> = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
};

/** The inline CSS of a block style. */
export function blockStyleCss(style: ResultBlockStyle | undefined): Record<string, string> {
  if (!style) return {};
  const css: Record<string, string> = {};
  if (style.background) css.backgroundColor = style.background;
  if (style.color) css.color = style.color;
  if (style.radius !== undefined) css.borderRadius = `${style.radius}px`;
  if (style.padding !== undefined) css.padding = `${style.padding}px`;
  if (style.spaceBefore !== undefined) css.marginTop = `${style.spaceBefore}px`;
  if (style.align) css.textAlign = style.align === "center" ? "center" : style.align;
  if (style.borderWidth !== undefined || style.borderColor) {
    css.border = `${style.borderWidth ?? 1}px solid ${style.borderColor ?? "var(--sjs-border-light)"}`;
  }
  if (style.shadow && style.shadow !== "none") {
    css.boxShadow = SHADOW_CSS[style.shadow];
  }
  return css;
}

/**
 * The layout to show: `layout` cleaned up, or the standard order when there is
 * none. Unknown blocks go, a built-in block shows once, an images block needs
 * a known placement, and every block gets a unique id.
 */
export function resolveLayout(layout: unknown): ResultBlock[] {
  if (!Array.isArray(layout)) return defaultLayout();
  const seen = new Set<string>();
  const out: ResultBlock[] = [];
  layout.forEach((raw, index) => {
    if (out.length >= MAX_BLOCKS) return;
    if (!raw || typeof raw !== "object") return;
    const entry = raw as Partial<ResultBlock>;
    const type = entry.type as ResultBlockType;
    if (!TYPES.includes(type)) return;
    if (type === "images" && !PLACEMENTS.includes(entry.placement!)) return;

    let id: string;
    if (SINGLE.includes(type)) {
      id = builtInId(type, entry.placement);
      if (seen.has(id)) return;
    } else {
      // The index keeps a missing id stable from one render to the next
      id = typeof entry.id === "string" && entry.id ? entry.id : `${type}-${index}`;
      while (seen.has(id) || RESERVED.has(id)) id += "_";
    }
    seen.add(id);

    const block: ResultBlock = { id, type };
    if (type === "images") block.placement = entry.placement;
    if (type === "html") {
      block.html = typeof entry.html === "string" ? entry.html.slice(0, MAX_HTML_LENGTH) : "";
    }
    if (type === "metrics") block.metrics = resolveMetrics(entry.metrics);
    if (type === "callout") block.callout = resolveCallout(entry.callout);
    if (type === "checklist") block.checklist = resolveChecklist(entry.checklist);
    if (entry.hidden === true) block.hidden = true;
    if (isTier(entry.tier)) block.tier = entry.tier;
    const style = resolveBlockStyle(entry.style);
    if (style) block.style = style;
    out.push(block);
  });
  return out;
}

/** The built-in blocks a layout has left out, in the standard order: what the author can put back. */
export function missingBlocks(layout: ResultBlock[]): ResultBlock[] {
  const ids = new Set(layout.map((b) => b.id));
  return defaultLayout().filter((b) => !ids.has(b.id));
}

/** A new block of `type`: a built-in one by its id, or a fresh custom block. */
export function createBlock(
  type: ResultBlockType,
  options: {
    placement?: ResultImagePlacement;
    html?: string;
    callout?: ResultCallout;
    checklist?: ResultChecklist;
  } = {},
): ResultBlock {
  if (SINGLE.includes(type)) {
    const block: ResultBlock = { id: builtInId(type, options.placement), type };
    if (type === "images") block.placement = options.placement ?? "afterScore";
    return block;
  }
  const block: ResultBlock = { id: newId(type), type };
  if (type === "html") block.html = options.html ?? "";
  if (type === "metrics") block.metrics = [];
  if (type === "callout") {
    block.callout = options.callout ?? {
      type: "info",
      title: "",
      message: "",
    };
  }
  if (type === "checklist") {
    block.checklist = options.checklist ?? {
      title: "",
      items: [],
    };
  }
  return block;
}

/**
 * `layout` with the block at `from` moved so it lands before the block now at
 * `to` (`layout.length` puts it last). Out-of-range indexes change nothing.
 */
export function moveBlock(layout: ResultBlock[], from: number, to: number): ResultBlock[] {
  if (from < 0 || from >= layout.length || to < 0 || to > layout.length) return layout;
  // Dropped onto its own place: before itself or before the next block
  if (to === from || to === from + 1) return layout;
  const next = [...layout];
  const [block] = next.splice(from, 1);
  next.splice(to > from ? to - 1 : to, 0, block);
  return next;
}

/**
 * `layout` with `block` put before the block at `at` (the end when `at` is
 * past it). A built-in block already there, or a full layout, changes nothing.
 */
export function insertBlock(layout: ResultBlock[], block: ResultBlock, at = layout.length) {
  if (layout.length >= MAX_BLOCKS) return layout;
  if (layout.some((b) => b.id === block.id)) return layout;
  const index = Math.max(0, Math.min(at, layout.length));
  return [...layout.slice(0, index), block, ...layout.slice(index)];
}

/** Whether a respondent whose score is in `tier` sees the block (`undefined`: no score). */
export function blockShownFor(block: ResultBlock, tier: number | undefined) {
  if (block.hidden) return false;
  return block.tier === undefined || block.tier === tier;
}

/** What is being dragged: a block of the layout, or a new one from the palette. */
export type BlockDrag =
  | { kind: "move"; id: string }
  | { kind: "add"; block: ResultBlock };

/** `layout` after dropping `drag` before the block at `at` (`layout.length`: last). */
export function dropBlock(layout: ResultBlock[], drag: BlockDrag, at: number): ResultBlock[] {
  if (drag.kind === "add") return insertBlock(layout, drag.block, at);
  return moveBlock(layout, layout.findIndex((b) => b.id === drag.id), at);
}

/** An HTML block's name: the start of its text, or empty when it has none. */
export function htmlBlockName(html: string | undefined, max = 40): string {
  const text = (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
