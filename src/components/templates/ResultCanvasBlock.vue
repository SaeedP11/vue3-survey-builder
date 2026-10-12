<script setup lang="ts">
import { ref } from "vue";
import useBlockDrag, { afterDragStart, dropSide } from "../../composables/useBlockDrag.ts";
import type { BlockDrag } from "../../utils/resultLayout.ts";
import useLocalI18n from "../../composables/useLocalI18n.ts";
import { surveyResult } from "../../locales/index.ts";

/**
 * A block of the result page in the editor's preview: it can be selected,
 * dragged, dropped on, moved with Alt+↑/↓, and hidden.
 */
const props = defineProps<{
  id: string;
  label: string;
  index: number;
  count: number;
  selected?: boolean;
  hidden?: boolean;
  /** The status tier the block is limited to, by its label. */
  tierLabel?: string;
}>();

const emit = defineEmits<{
  select: [];
  move: [by: -1 | 1];
  toggleHidden: [];
  /** Something was dropped on the block, before or after it. */
  drop: [side: "before" | "after", drag: BlockDrag];
}>();

const { t } = useLocalI18n(surveyResult);
const drag = useBlockDrag();
const el = ref<HTMLElement>();
const dropAt = ref<"before" | "after" | null>(null);

function onDragStart(event: DragEvent) {
  drag.start(event, { kind: "move", id: props.id });
  // Not now: Chromium cancels a drag whose page changes during dragstart
  afterDragStart(() => emit("select"));
}

function onDragEnd() {
  drag.end();
  dropAt.value = null;
}

function onDragOver(event: DragEvent) {
  if (!drag.over(event) || !el.value) return;
  dropAt.value = dropSide(event, el.value);
}

function onDragLeave(event: DragEvent) {
  // Moving onto a child still counts as over the block
  if (el.value?.contains(event.relatedTarget as Node | null)) return;
  dropAt.value = null;
}

function onDrop(event: DragEvent) {
  const taken = drag.take(event);
  if (!taken || !el.value) return;
  const side = dropAt.value ?? dropSide(event, el.value);
  dropAt.value = null;
  emit("drop", side, taken);
}

function onKeydown(event: KeyboardEvent) {
  if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
    event.preventDefault();
    const by = event.key === "ArrowUp" ? -1 : 1;
    if ((by === -1 && props.index > 0) || (by === 1 && props.index < props.count - 1)) {
      emit("move", by);
    }
    return;
  }
  if (event.target === el.value && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    emit("select");
  }
}

const tool =
  "grid h-6 w-6 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[var(--sjs-general-forecolor-light)] hover:bg-[var(--sjs-general-backcolor-dim)] hover:text-[var(--sjs-general-forecolor)] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-[var(--sjs-primary-backcolor)]";
</script>

<template>
  <div
    ref="el"
    class="fb-canvas-block group/block relative cursor-grab rounded-lg outline-2 outline-offset-4 transition-[outline-color] active:cursor-grabbing focus-visible:outline-[var(--sjs-primary-backcolor)]"
    :class="
      selected
        ? 'outline-solid outline-[var(--sjs-primary-backcolor)]'
        : 'outline-dashed outline-transparent hover:outline-[color-mix(in_srgb,var(--sjs-primary-backcolor)_55%,transparent)]'
    "
    :data-block-id="id"
    :aria-label="label"
    :aria-current="selected ? 'true' : undefined"
    tabindex="0"
    draggable="true"
    @click="emit('select')"
    @keydown="onKeydown"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div
      v-if="dropAt"
      class="pointer-events-none absolute inset-x-0 z-20 h-1 rounded-full bg-[var(--sjs-primary-backcolor)]"
      :class="dropAt === 'before' ? '-top-4' : '-bottom-4'"
      data-drop-indicator
      aria-hidden="true"
    />

    <!-- The content takes no pointer events, so the block drags from anywhere on
         it (a browser starts no drag on a button, link or image) and a click
         selects it -->
    <div
      class="pointer-events-none select-none"
      :class="hidden ? 'opacity-35 saturate-0' : ''"
    >
      <slot />
    </div>

    <div
      class="absolute -top-3.5 end-2 z-10 flex items-center gap-0.5 rounded-full border border-[var(--sjs-border-default)] bg-[var(--sjs-general-backcolor)] py-0.5 ps-2 pe-0.5 text-[11px] font-semibold text-[var(--sjs-general-forecolor)] shadow-sm transition-opacity"
      :class="
        selected
          ? 'opacity-100'
          : 'opacity-0 group-hover/block:opacity-100 group-focus-within/block:opacity-100'
      "
      @click.stop
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="me-1 text-[var(--sjs-general-forecolor-light)]"
        aria-hidden="true"
      >
        <title>{{ t("canvas.drag") }}</title>
        <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
      </svg>
      <span class="max-w-40 truncate pe-1">{{ label }}</span>
      <span
        v-if="hidden"
        class="rounded-full bg-[var(--sjs-general-backcolor-dim)] px-1.5 py-px text-[10px] text-[var(--sjs-general-forecolor-light)]"
        >{{ t("canvas.hidden") }}</span
      >
      <span
        v-if="tierLabel"
        class="max-w-28 truncate rounded-full bg-[var(--sjs-general-backcolor-dim)] px-1.5 py-px text-[10px] text-[var(--sjs-general-forecolor-light)]"
        >{{ t("images.onlyFor", { tier: tierLabel }) }}</span
      >
      <button
        type="button"
        :class="tool"
        :disabled="index === 0"
        :title="t('canvas.moveUp')"
        :aria-label="`${t('canvas.moveUp')}: ${label}`"
        @click="emit('move', -1)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 19V5m0 0l-6 6m6-6l6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        :class="tool"
        :disabled="index === count - 1"
        :title="t('canvas.moveDown')"
        :aria-label="`${t('canvas.moveDown')}: ${label}`"
        @click="emit('move', 1)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14m0 0l6-6m-6 6l-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        :class="tool"
        :title="hidden ? t('canvas.show') : t('canvas.hide')"
        :aria-label="`${hidden ? t('canvas.show') : t('canvas.hide')}: ${label}`"
        :aria-pressed="hidden ? 'true' : 'false'"
        @click="emit('toggleHidden')"
      >
        <svg v-if="hidden" width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.6 6.6C4.4 8 2.8 10.2 2 12c1 2.5 5 7 10 7 1.7 0 3.2-.5 4.6-1.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="2" />
        </svg>
      </button>
    </div>
  </div>
</template>
