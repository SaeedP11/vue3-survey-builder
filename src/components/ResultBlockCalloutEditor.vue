<script setup lang="ts">
import { computed, ref } from "vue";
import type { ResultCallout, ResultCalloutType } from "../types/index.ts";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { CALLOUT_TYPES } from "../utils/resultLayout.ts";

const modelValue = defineModel<ResultCallout | undefined>();
const props = defineProps<{
  variables: string[];
  uid: string;
  index: number;
}>();

const { t } = useLocalI18n(surveyResultEditor);

const inputClass =
  "rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent";
const chipClass =
  "inline-flex cursor-pointer items-center rounded-md border border-fb-border bg-fb-surface-muted px-2 py-1 text-xs font-mono font-medium text-fb-fg-muted hover:border-fb-accent hover:text-fb-fg focus-visible:outline-2 focus-visible:outline-fb-accent";

const activeField = ref<"title" | "message">("message");
const titleInput = ref<HTMLInputElement | null>(null);
const messageTextarea = ref<HTMLTextAreaElement | null>(null);

const currentType = computed(() => modelValue.value?.type ?? "info");
const currentTitle = computed(() => modelValue.value?.title ?? "");
const currentMessage = computed(() => modelValue.value?.message ?? "");

const availableTokens = computed(() => [
  "{$score}",
  "{$status}",
  ...props.variables.map((v) => `{${v}}`),
]);

function updateField<K extends keyof ResultCallout>(key: K, value: ResultCallout[K]) {
  const current: ResultCallout = {
    type: modelValue.value?.type ?? "info",
    title: modelValue.value?.title ?? "",
    message: modelValue.value?.message ?? "",
    ...modelValue.value,
    [key]: value,
  };
  modelValue.value = current;
}

function insertToken(token: string) {
  if (activeField.value === "title" && titleInput.value) {
    const el = titleInput.value;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + token + el.value.slice(end);
    updateField("title", next);
    el.focus();
    setTimeout(() => {
      el.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  } else if (messageTextarea.value) {
    const el = messageTextarea.value;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + token + el.value.slice(end);
    updateField("message", next);
    el.focus();
    setTimeout(() => {
      el.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  }
}
</script>

<template>
  <fieldset class="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0" data-callout-editor>
    <legend class="mb-1 p-0 text-[11.5px] font-semibold text-fb-fg-secondary">
      {{ t("layout.callout.label") }}
    </legend>

    <div class="flex flex-col gap-1">
      <label :for="`${uid}-callout-type-${index}`" class="text-[11.5px] text-fb-fg-muted">
        {{ t("layout.callout.type") }}
      </label>
      <select
        :id="`${uid}-callout-type-${index}`"
        :value="currentType"
        :class="inputClass"
        data-callout-type
        @change="updateField('type', ($event.target as HTMLSelectElement).value as ResultCalloutType)"
      >
        <option v-for="kind in CALLOUT_TYPES" :key="kind" :value="kind">
          {{ t(`layout.callout.types.${kind}`) }}
        </option>
      </select>
    </div>

    <div class="flex flex-col gap-1">
      <label :for="`${uid}-callout-title-${index}`" class="text-[11.5px] text-fb-fg-muted">
        {{ t("layout.callout.title") }}
      </label>
      <input
        :id="`${uid}-callout-title-${index}`"
        ref="titleInput"
        type="text"
        :value="currentTitle"
        :placeholder="t('layout.callout.titlePlaceholder')"
        :class="inputClass"
        data-callout-title
        @focus="activeField = 'title'"
        @input="updateField('title', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="flex flex-col gap-1">
      <label :for="`${uid}-callout-message-${index}`" class="text-[11.5px] text-fb-fg-muted">
        {{ t("layout.callout.message") }}
      </label>
      <textarea
        :id="`${uid}-callout-message-${index}`"
        ref="messageTextarea"
        rows="3"
        :value="currentMessage"
        :placeholder="t('layout.callout.messagePlaceholder')"
        :class="inputClass"
        data-callout-message
        @focus="activeField = 'message'"
        @input="updateField('message', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div v-if="availableTokens.length" class="flex flex-col gap-1.5 pt-1">
      <span class="text-[11.5px] text-fb-fg-muted">
        {{ t("layout.html.variables") }}
      </span>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tok in availableTokens"
          :key="tok"
          type="button"
          :class="chipClass"
          @click="insertToken(tok)"
        >
          {{ tok }}
        </button>
      </div>
    </div>
  </fieldset>
</template>
