<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from "vue";
import type { ResultBlock, ResultBlockType, ResultImagePlacement } from "../types/index.ts";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import useBlockDrag, { dropSide } from "../composables/useBlockDrag.ts";
import {
  MAX_BLOCKS,
  MAX_HTML_LENGTH,
  createBlock,
  dropBlock,
  htmlBlockName,
  insertBlock,
  missingBlocks,
  moveBlock,
  type BlockDrag,
} from "../utils/resultLayout.ts";

const layout = defineModel<ResultBlock[]>({ required: true });
const selected = defineModel<string | null>("selected", { default: null });
const props = defineProps<{
  statusLabels: string[];
  /** Names an HTML block can put in braces: the survey's questions and calculated values. */
  variables: string[];
  /** Blocks with nothing to show yet (an empty note, an image slot without images). */
  emptyIds?: string[];
  /** Where a block's content is edited, named for its link; none, no link. */
  editLabel?: (block: ResultBlock) => string | undefined;
}>();
const emit = defineEmits<{ edit: [block: ResultBlock] }>();

const { t } = useLocalI18n(surveyResultEditor);
const uid = useId();
const drag = useBlockDrag();

const inputClass =
  "rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent";
const iconButton =
  "grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-fb-fg-muted hover:bg-fb-border hover:text-fb-fg disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fb-accent";

function labelOf(block: Pick<ResultBlock, "type" | "placement" | "html">) {
  if (block.type === "images") return t(`blocks.images.${block.placement}`);
  if (block.type === "html") {
    const name = htmlBlockName(block.html);
    if (name) return name;
  }
  return t(`blocks.${block.type}`);
}

const tierLabel = (tier: number | undefined) =>
  tier === undefined ? "" : props.statusLabels[tier] || `${tier + 1}`;

const full = computed(() => layout.value.length >= MAX_BLOCKS);

// ---- changes ----

function setLayout(next: ResultBlock[]) {
  if (next !== layout.value) layout.value = next;
}

function update(id: string, patch: Partial<ResultBlock>) {
  setLayout(
    layout.value.map((b) => {
      if (b.id !== id) return b;
      const next: ResultBlock = { ...b, ...patch };
      // Unset, rather than stored as false or undefined
      if (!next.hidden) delete next.hidden;
      if (next.tier === undefined) delete next.tier;
      return next;
    }),
  );
}

function move(index: number, by: -1 | 1) {
  setLayout(moveBlock(layout.value, index, by === -1 ? index - 1 : index + 2));
}

function remove(id: string) {
  setLayout(layout.value.filter((b) => b.id !== id));
  if (selected.value === id) selected.value = null;
}

function toggle(id: string) {
  selected.value = selected.value === id ? null : id;
}

function starterHtml() {
  return `<h3 style="margin:0 0 6px">${t("layout.html.starterTitle")}</h3>\n<p style="margin:0">${t("layout.html.starterText")}</p>`;
}

function newBlock(type: ResultBlockType, placement?: ResultImagePlacement) {
  return createBlock(type, {
    placement,
    html: type === "html" ? starterHtml() : undefined,
  });
}

/** Adds a block after the selected one, or last. */
function add(type: ResultBlockType, placement?: ResultImagePlacement) {
  const block = newBlock(type, placement);
  const after = layout.value.findIndex((b) => b.id === selected.value);
  setLayout(insertBlock(layout.value, block, after === -1 ? layout.value.length : after + 1));
  selected.value = block.id;
}

// ---- palette ----

interface PaletteItem {
  key: string;
  type: ResultBlockType;
  placement?: ResultImagePlacement;
  label: string;
}

const palette = computed<PaletteItem[]>(() => [
  { key: "html", type: "html", label: t("blocks.html") },
  { key: "divider", type: "divider", label: t("blocks.divider") },
  ...missingBlocks(layout.value).map((b) => ({
    key: b.id,
    type: b.type,
    placement: b.placement,
    label: labelOf(b),
  })),
]);

// ---- drag and drop ----

const dropTarget = ref<{ index: number; side: "before" | "after" } | null>(null);

function onDragOver(event: DragEvent, index: number) {
  if (!drag.over(event)) return;
  dropTarget.value = {
    index,
    side: dropSide(event, event.currentTarget as Element),
  };
}

function onDrop(event: DragEvent, index: number) {
  const dragged = drag.take(event);
  if (!dragged) return;
  const side = dropTarget.value?.index === index
    ? dropTarget.value.side
    : dropSide(event, event.currentTarget as Element);
  dropTarget.value = null;
  apply(dragged, side === "before" ? index : index + 1);
}

function onDropEnd(event: DragEvent) {
  const dragged = drag.take(event);
  dropTarget.value = null;
  if (dragged) apply(dragged, layout.value.length);
}

function apply(dragged: BlockDrag, at: number) {
  setLayout(dropBlock(layout.value, dragged, at));
  selected.value = dragged.kind === "add" ? dragged.block.id : dragged.id;
}

function onDragEnd() {
  drag.end();
  dropTarget.value = null;
}

const showIndicator = (index: number, side: "before" | "after") =>
  dropTarget.value?.index === index && dropTarget.value.side === side;

// ---- HTML editing ----

const htmlInput = ref<HTMLTextAreaElement>();

const htmlVariables = computed(() => [
  "$score",
  "$status",
  ...props.variables.filter((name) => !name.startsWith("$")),
]);

/** `name` as a placeholder: `{name}`. */
const tokenOf = (name: string) => `{${name}}`;

async function insertVariable(block: ResultBlock, name: string) {
  const input = htmlInput.value;
  const html = block.html ?? "";
  const token = tokenOf(name);
  const start = input?.selectionStart ?? html.length;
  const end = input?.selectionEnd ?? html.length;
  const next = (html.slice(0, start) + token + html.slice(end)).slice(0, MAX_HTML_LENGTH);
  update(block.id, { html: next });
  await nextTick();
  if (input) {
    input.focus();
    input.setSelectionRange(start + token.length, start + token.length);
  }
}

// A block selected on the preview comes into view in the list
const rows = ref<Record<string, HTMLElement>>({});
watch(selected, async (id) => {
  if (!id) return;
  await nextTick();
  rows.value[id]?.scrollIntoView?.({ block: "nearest" });
});
</script>

<template>
  <div class="space-y-4">
    <p class="text-xs leading-snug text-fb-fg-muted">{{ t("layout.help") }}</p>

    <p
      v-if="layout.length === 0"
      class="rounded-lg border border-dashed border-fb-border px-3 py-4 text-center text-xs text-fb-fg-muted"
    >
      {{ t("layout.empty") }}
    </p>

    <ol class="m-0 flex list-none flex-col gap-1.5 p-0" :aria-label="t('groups.layout')">
      <li
        v-for="(block, index) in layout"
        :key="block.id"
        :ref="(el) => { if (el) rows[block.id] = el as HTMLElement; else delete rows[block.id]; }"
        class="relative"
        :data-block-id="block.id"
        @dragover="onDragOver($event, index)"
        @dragleave="dropTarget = null"
        @drop="onDrop($event, index)"
      >
        <div
          v-if="showIndicator(index, 'before')"
          class="pointer-events-none absolute inset-x-0 -top-1 h-0.5 rounded-full bg-fb-accent"
          data-drop-indicator
          aria-hidden="true"
        />

        <div
          class="rounded-lg border bg-fb-surface"
          :class="selected === block.id ? 'border-fb-accent shadow-sm' : 'border-fb-border'"
        >
          <div
            class="flex items-center gap-1 py-1 ps-1 pe-1.5"
            draggable="true"
            @dragstart="drag.start($event, { kind: 'move', id: block.id })"
            @dragend="onDragEnd"
          >
            <span
              class="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-fb-fg-muted active:cursor-grabbing"
              :title="t('layout.drag', { block: labelOf(block) })"
              aria-hidden="true"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
                <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
                <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
              </svg>
            </span>

            <button
              type="button"
              class="flex min-h-7 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-1.5 text-start text-[13px] font-semibold text-fb-fg hover:bg-fb-surface-muted focus-visible:outline-2 focus-visible:outline-fb-accent"
              :class="block.hidden ? 'text-fb-fg-muted line-through decoration-fb-fg-muted/60' : ''"
              :aria-expanded="selected === block.id ? 'true' : 'false'"
              :aria-controls="`${uid}-settings-${index}`"
              @click="toggle(block.id)"
            >
              <span class="min-w-0 truncate">{{ labelOf(block) }}</span>
              <span
                v-if="block.hidden"
                class="shrink-0 rounded-full bg-fb-surface-muted px-1.5 py-px text-[10px] font-semibold text-fb-fg-muted no-underline"
                >{{ t("layout.hidden") }}</span
              >
              <span
                v-else-if="emptyIds?.includes(block.id)"
                class="shrink-0 rounded-full bg-fb-surface-muted px-1.5 py-px text-[10px] font-medium text-fb-fg-muted"
                >{{ t("layout.nothingToShow") }}</span
              >
              <span
                v-if="block.tier !== undefined"
                class="max-w-24 shrink-0 truncate rounded-full bg-fb-accent-soft px-1.5 py-px text-[10px] font-semibold text-fb-fg"
                >{{ tierLabel(block.tier) }}</span
              >
            </button>

            <button
              type="button"
              :class="iconButton"
              :disabled="index === 0"
              :title="t('moveUp')"
              :aria-label="`${t('moveUp')}: ${labelOf(block)}`"
              @click="move(index, -1)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 19V5m0 0l-6 6m6-6l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              :class="iconButton"
              :disabled="index === layout.length - 1"
              :title="t('moveDown')"
              :aria-label="`${t('moveDown')}: ${labelOf(block)}`"
              @click="move(index, 1)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14m0 0l6-6m-6 6l-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              :class="iconButton"
              :title="block.hidden ? t('layout.show') : t('layout.hide')"
              :aria-label="`${block.hidden ? t('layout.show') : t('layout.hide')}: ${labelOf(block)}`"
              :aria-pressed="block.hidden ? 'true' : 'false'"
              @click="update(block.id, { hidden: !block.hidden })"
            >
              <svg v-if="block.hidden" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.6 6.6C4.4 8 2.8 10.2 2 12c1 2.5 5 7 10 7 1.7 0 3.2-.5 4.6-1.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="2" />
              </svg>
            </button>
            <button
              type="button"
              :class="iconButton"
              :title="t('layout.remove')"
              :aria-label="`${t('layout.remove')}: ${labelOf(block)}`"
              @click="remove(block.id)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <div
            v-if="selected === block.id"
            :id="`${uid}-settings-${index}`"
            class="space-y-3 border-t border-fb-border px-3 pt-2.5 pb-3"
          >
            <button
              v-if="editLabel?.(block)"
              type="button"
              class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-fb-border bg-fb-surface-muted/50 px-3 py-2 text-start text-[12.5px] font-semibold text-fb-fg hover:border-fb-accent hover:bg-fb-accent-soft focus-visible:outline-2 focus-visible:outline-fb-accent"
              :data-edit="block.id"
              @click="emit('edit', block)"
            >
              {{ t("layout.editIn", { tab: editLabel(block) }) }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="shrink-0 rtl:-scale-x-100" aria-hidden="true">
                <path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <div class="flex flex-col gap-1">
              <label
                :for="`${uid}-tier-${index}`"
                class="text-[11.5px] font-semibold text-fb-fg-secondary"
                >{{ t("layout.tier") }}</label
              >
              <select
                :id="`${uid}-tier-${index}`"
                :value="block.tier ?? ''"
                :class="inputClass"
                @change="
                  update(block.id, {
                    tier:
                      ($event.target as HTMLSelectElement).value === ''
                        ? undefined
                        : Number(($event.target as HTMLSelectElement).value),
                  })
                "
              >
                <option value="">{{ t("layout.everyResult") }}</option>
                <option v-for="(label, tier) in statusLabels" :key="tier" :value="tier">
                  {{ label || tier + 1 }}
                </option>
              </select>
            </div>

            <div v-if="block.type === 'html'" class="flex flex-col gap-1.5">
              <label
                :for="`${uid}-html-${index}`"
                class="text-[11.5px] font-semibold text-fb-fg-secondary"
                >{{ t("layout.html.label") }}</label
              >
              <textarea
                :id="`${uid}-html-${index}`"
                :ref="(el) => (htmlInput = (el as HTMLTextAreaElement) ?? undefined)"
                :value="block.html ?? ''"
                rows="9"
                dir="ltr"
                spellcheck="false"
                :maxlength="MAX_HTML_LENGTH"
                :aria-describedby="`${uid}-html-help-${index}`"
                class="resize-y font-['JetBrains_Mono',ui-monospace,monospace] text-[12px] leading-relaxed"
                :class="inputClass"
                @input="update(block.id, { html: ($event.target as HTMLTextAreaElement).value })"
              />
              <div class="flex items-start justify-between gap-3">
                <p
                  :id="`${uid}-html-help-${index}`"
                  class="m-0 text-[11px] leading-snug text-fb-fg-muted"
                >
                  {{ t("layout.html.help") }}
                </p>
                <span class="shrink-0 text-[11px] tabular-nums text-fb-fg-muted">{{
                  t("layout.html.count", { n: (block.html ?? "").length, max: MAX_HTML_LENGTH })
                }}</span>
              </div>

              <div class="mt-1 flex flex-col gap-1.5">
                <span class="text-[11.5px] font-semibold text-fb-fg-secondary">{{
                  t("layout.html.variables")
                }}</span>
                <div class="flex flex-wrap gap-1.5" dir="ltr">
                  <button
                    v-for="name in htmlVariables"
                    :key="name"
                    type="button"
                    class="cursor-pointer rounded-md border border-fb-border bg-fb-surface-muted px-2 py-1 font-['JetBrains_Mono',ui-monospace,monospace] text-[11px] text-fb-fg hover:border-fb-accent hover:bg-fb-accent-soft focus-visible:outline-2 focus-visible:outline-fb-accent"
                    @click="insertVariable(block, name)"
                  >
                    {{ tokenOf(name) }}
                  </button>
                </div>
                <p class="m-0 text-[11px] leading-snug text-fb-fg-muted">
                  {{ t("layout.html.variablesHelp") }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showIndicator(index, 'after')"
          class="pointer-events-none absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-fb-accent"
          data-drop-indicator
          aria-hidden="true"
        />
      </li>
    </ol>

    <div
      v-if="drag.dragging.value"
      class="grid min-h-11 place-items-center rounded-lg border-2 border-dashed border-fb-border-strong px-3 text-xs font-semibold text-fb-fg-muted"
      data-drop-end
      @dragover="drag.over($event)"
      @drop="onDropEnd"
    >
      {{ t("layout.dropHere") }}
    </div>

    <div class="space-y-2 rounded-lg bg-fb-surface-muted/50 p-3">
      <span class="block text-[12px] font-semibold text-fb-fg-secondary">{{ t("layout.add") }}</span>
      <p class="m-0 text-[11px] leading-snug text-fb-fg-muted">
        {{ full ? t("layout.full", { max: MAX_BLOCKS }) : t("layout.addHelp") }}
      </p>
      <div class="flex flex-wrap gap-1.5">
        <!-- Not a <button>: browsers do not drag those (Firefox never does) -->
        <div
          v-for="item in palette"
          :key="item.key"
          role="button"
          :tabindex="full ? -1 : 0"
          :draggable="full ? 'false' : 'true'"
          :aria-disabled="full ? 'true' : undefined"
          class="flex select-none items-center gap-1.5 rounded-lg border border-fb-border bg-fb-surface px-2.5 py-1.5 text-xs font-semibold text-fb-fg focus-visible:outline-2 focus-visible:outline-fb-accent"
          :class="
            full
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-grab hover:border-fb-accent active:cursor-grabbing'
          "
          :data-palette="item.key"
          @click="!full && add(item.type, item.placement)"
          @keydown.enter.prevent="!full && add(item.type, item.placement)"
          @keydown.space.prevent="!full && add(item.type, item.placement)"
          @dragstart="drag.start($event, { kind: 'add', block: newBlock(item.type, item.placement) })"
          @dragend="onDragEnd"
        >
          <span aria-hidden="true" class="text-fb-fg-muted">+</span>
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>
