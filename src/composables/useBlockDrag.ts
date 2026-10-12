import { computed, shallowRef } from "vue";
import type { BlockDrag } from "../utils/resultLayout.ts";

/** The type the drag data goes under; other drags (files, text) are not ours. */
export const BLOCK_DRAG_TYPE = "application/x-fb-result-block";

// One drag at a time across the page, so a block dragged from the editor's
// list can drop on the preview and back. Held here rather than read from
// dataTransfer, which browsers only reveal on drop.
let active: BlockDrag | null = null;
// What the page shows of the drag (drop zones), a tick after it starts:
// Chromium cancels a drag whose page changes during dragstart
const shown = shallowRef<BlockDrag | null>(null);

/** Runs `fn` once the browser has started the drag. */
export const afterDragStart = (fn: () => void) => setTimeout(fn, 0);

/** Where a drop over an element lands: before it in its top half, else after. */
export function dropSide(event: DragEvent, el: Element): "before" | "after" {
  const rect = el.getBoundingClientRect();
  // jsdom and some synthetic events have no geometry: treat as the top half
  if (!rect.height) return "before";
  return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
}

function clear() {
  active = null;
  shown.value = null;
}

export default function useBlockDrag() {
  function start(event: DragEvent, drag: BlockDrag) {
    active = drag;
    afterDragStart(() => {
      if (active === drag) shown.value = drag;
    });
    const transfer = event.dataTransfer;
    if (!transfer) return;
    // Firefox starts a drag only once it carries data
    transfer.setData(BLOCK_DRAG_TYPE, drag.kind === "move" ? drag.id : drag.block.id);
    transfer.effectAllowed = drag.kind === "move" ? "move" : "copy";
  }

  /** Accepts the drag over a target (only our own), and returns it. */
  function over(event: DragEvent): BlockDrag | null {
    if (!active) return null;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = active.kind === "move" ? "move" : "copy";
    }
    return active;
  }

  /** Takes the drag on drop; null when it is not ours. */
  function take(event: DragEvent): BlockDrag | null {
    const drag = active;
    if (!drag) return null;
    event.preventDefault();
    clear();
    return drag;
  }

  return {
    /** The drag in progress, as the page shows it. */
    dragging: computed(() => shown.value),
    start,
    end: clear,
    over,
    take,
  };
}
