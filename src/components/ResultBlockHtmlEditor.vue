<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { MAX_HTML_LENGTH } from "../utils/resultLayout.ts";

const modelValue = defineModel<string>({ default: "" });
const props = defineProps<{
  variables: string[];
  uid: string;
  index: number;
}>();

const { t } = useLocalI18n(surveyResultEditor);

const htmlInput = ref<HTMLTextAreaElement>();
const inputClass =
  "rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent";

const htmlVariables = computed(() => [
  "$score",
  "$status",
  ...props.variables.filter((name) => !name.startsWith("$")),
]);

/** `name` as a placeholder: `{name}`. */
const tokenOf = (name: string) => `{${name}}`;

async function insertVariable(name: string) {
  const input = htmlInput.value;
  const html = modelValue.value ?? "";
  const token = tokenOf(name);
  const start = input?.selectionStart ?? html.length;
  const end = input?.selectionEnd ?? html.length;
  const next = (html.slice(0, start) + token + html.slice(end)).slice(0, MAX_HTML_LENGTH);
  modelValue.value = next;
  await nextTick();
  if (input) {
    input.focus();
    input.setSelectionRange(start + token.length, start + token.length);
  }
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      :for="`${uid}-html-${index}`"
      class="text-[11.5px] font-semibold text-fb-fg-secondary"
      >{{ t("layout.html.label") }}</label
    >
    <textarea
      :id="`${uid}-html-${index}`"
      ref="htmlInput"
      :value="modelValue ?? ''"
      rows="9"
      dir="ltr"
      spellcheck="false"
      :maxlength="MAX_HTML_LENGTH"
      :aria-describedby="`${uid}-html-help-${index}`"
      class="resize-y font-['JetBrains_Mono',ui-monospace,monospace] text-[12px] leading-relaxed"
      :class="inputClass"
      @input="modelValue = ($event.target as HTMLTextAreaElement).value"
    />
    <div class="flex items-start justify-between gap-3">
      <p
        :id="`${uid}-html-help-${index}`"
        class="m-0 text-[11px] leading-snug text-fb-fg-muted"
      >
        {{ t("layout.html.help") }}
      </p>
      <span class="shrink-0 text-[11px] tabular-nums text-fb-fg-muted">{{
        t("layout.html.count", { n: (modelValue ?? "").length, max: MAX_HTML_LENGTH })
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
          @click="insertVariable(name)"
        >
          {{ tokenOf(name) }}
        </button>
      </div>
      <p class="m-0 text-[11px] leading-snug text-fb-fg-muted">
        {{ t("layout.html.variablesHelp") }}
      </p>
    </div>
  </div>
</template>
