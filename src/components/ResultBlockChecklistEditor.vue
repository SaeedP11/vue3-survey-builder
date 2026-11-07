<script setup lang="ts">
import { computed } from "vue";
import type { ResultChecklist, ResultChecklistItem } from "../types/index.ts";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { MAX_CHECKLIST_ITEMS } from "../utils/resultLayout.ts";
import { newId } from "../utils/resultContent.ts";

const modelValue = defineModel<ResultChecklist | undefined>();
defineProps<{
  variables: string[];
  uid: string;
  index: number;
}>();

const { t } = useLocalI18n(surveyResultEditor);

const inputClass =
  "rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent";
const iconButton =
  "grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-fb-fg-muted hover:bg-fb-border hover:text-fb-fg disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fb-accent";
const addButton =
  "flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-fb-border-strong bg-fb-surface-muted/40 px-3 py-2 text-xs font-semibold text-fb-fg hover:bg-fb-surface-muted focus-visible:outline-2 focus-visible:outline-fb-accent";

const title = computed(() => modelValue.value?.title ?? "");
const items = computed(() => modelValue.value?.items ?? []);
const full = computed(() => items.value.length >= MAX_CHECKLIST_ITEMS);

function setTitle(nextTitle: string) {
  modelValue.value = {
    title: nextTitle,
    items: items.value,
  };
}

function addItem() {
  if (full.value) return;
  const newItem: ResultChecklistItem = {
    id: newId("check"),
    text: "",
    checked: false,
  };
  modelValue.value = {
    title: title.value,
    items: [...items.value, newItem],
  };
}

function updateItem(index: number, patch: Partial<ResultChecklistItem>) {
  const updated = items.value.map((it, i) => (i === index ? { ...it, ...patch } : it));
  modelValue.value = {
    title: title.value,
    items: updated,
  };
}

function removeItem(index: number) {
  const updated = items.value.filter((_, i) => i !== index);
  modelValue.value = {
    title: title.value,
    items: updated,
  };
}
</script>

<template>
  <fieldset class="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0" data-checklist-editor>
    <legend class="mb-1 p-0 text-[11.5px] font-semibold text-fb-fg-secondary">
      {{ t("layout.checklist.label") }}
    </legend>

    <div class="flex flex-col gap-1">
      <label :for="`${uid}-checklist-title-${index}`" class="text-[11.5px] text-fb-fg-muted">
        {{ t("layout.checklist.title") }}
      </label>
      <input
        :id="`${uid}-checklist-title-${index}`"
        type="text"
        :value="title"
        :placeholder="t('layout.checklist.titlePlaceholder')"
        :class="inputClass"
        data-checklist-title
        @input="setTitle(($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="flex flex-col gap-1.5 pt-1">
      <div
        v-for="(item, itemIndex) in items"
        :key="item.id"
        class="flex items-center gap-2 rounded-lg border border-fb-border bg-fb-surface p-1.5"
        data-checklist-item
      >
        <input
          type="checkbox"
          :checked="item.checked"
          :title="t('layout.checklist.checked')"
          class="h-4 w-4 shrink-0 cursor-pointer accent-fb-accent"
          @change="updateItem(itemIndex, { checked: ($event.target as HTMLInputElement).checked })"
        />
        <input
          type="text"
          :value="item.text"
          :placeholder="t('layout.checklist.itemPlaceholder')"
          class="min-w-0 flex-1 border-0 bg-transparent px-1 py-0.5 text-xs text-fb-fg outline-none focus:ring-0"
          @input="updateItem(itemIndex, { text: ($event.target as HTMLInputElement).value })"
        />
        <button
          type="button"
          :class="iconButton"
          :title="t('layout.remove')"
          data-remove-item
          @click="removeItem(itemIndex)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <p v-if="items.length === 0" class="m-0 py-1 text-center text-xs text-fb-fg-muted">
        {{ t("layout.checklist.empty") }}
      </p>

      <button
        v-if="!full"
        type="button"
        :class="addButton"
        data-add-item
        @click="addItem"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        {{ t("layout.checklist.add") }}
      </button>
    </div>
  </fieldset>
</template>
