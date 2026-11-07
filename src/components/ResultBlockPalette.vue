<script setup lang="ts">
import type { ResultBlockType, ResultImagePlacement } from "../types/index.ts";
import { MAX_BLOCKS } from "../utils/resultLayout.ts";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";

export interface PaletteItem {
  key: string;
  type: ResultBlockType;
  placement?: ResultImagePlacement;
  label: string;
}

const props = defineProps<{
  palette: PaletteItem[];
  full: boolean;
}>();

const emit = defineEmits<{
  add: [type: ResultBlockType, placement?: ResultImagePlacement];
  dragstart: [event: DragEvent, item: PaletteItem];
  dragend: [event: DragEvent];
}>();

const { t } = useLocalI18n(surveyResultEditor);

function onAdd(item: PaletteItem) {
  if (!props.full) {
    emit("add", item.type, item.placement);
  }
}
</script>

<template>
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
        @click="onAdd(item)"
        @keydown.enter.prevent="onAdd(item)"
        @keydown.space.prevent="onAdd(item)"
        @dragstart="emit('dragstart', $event, item)"
        @dragend="emit('dragend', $event)"
      >
        <span aria-hidden="true" class="text-fb-fg-muted">+</span>
        {{ item.label }}
      </div>
    </div>
  </div>
</template>
