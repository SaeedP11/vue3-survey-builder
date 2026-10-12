/**
 * The result page's layout: the blocks it shows, top to bottom. A template
 * without one keeps the page's standard order; a stored one is read leniently,
 * since it comes from saved JSON or the AI.
 */
import type {
  ResultBlock,
  ResultBlockType,
  ResultImagePlacement,
} from "../types/index.ts";
import { newId } from "./resultContent.ts";

/** Blocks a layout may hold; beyond it, new blocks are refused. */
export const MAX_BLOCKS = 24;
/** An HTML block's markup is cut to this many characters. */
export const MAX_HTML_LENGTH = 20_000;

const PLACEMENTS: ResultImagePlacement[] = ["banner", "afterScore", "beforeActions"];
const TYPES: ResultBlockType[] = [
  "hero",
  "score",
  "note",
  "images",
  "actions",
  "html",
  "divider",
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
    if (entry.hidden === true) block.hidden = true;
    if (isTier(entry.tier)) block.tier = entry.tier;
    out.push(block);
  });
  return out;
}

/** The built-in blocks a layout has left out, in the standard order: what the author can put back. */
export function missingBlocks(layout: ResultBlock[]): ResultBlock[] {
  const ids = new Set(layout.map((b) => b.id));
  return defaultLayout().filter((b) => !ids.has(b.id));
}

/** A new block of `type`: a built-in one by its id, or a fresh html or divider block. */
export function createBlock(
  type: ResultBlockType,
  options: { placement?: ResultImagePlacement; html?: string } = {},
): ResultBlock {
  if (SINGLE.includes(type)) {
    const block: ResultBlock = { id: builtInId(type, options.placement), type };
    if (type === "images") block.placement = options.placement ?? "afterScore";
    return block;
  }
  const block: ResultBlock = { id: newId(type), type };
  if (type === "html") block.html = options.html ?? "";
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
