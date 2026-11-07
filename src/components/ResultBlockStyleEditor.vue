<script setup lang="ts">
import type { ResultBlockStyle } from "../types/index.ts";
import { safeColor } from "../utils/statusTiers.ts";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";

const modelValue = defineModel<ResultBlockStyle | undefined>();
defineProps<{
  uid: string;
  index: number;
}>();

const { t } = useLocalI18n(surveyResultEditor);

const inputClass =
  "rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent";

const STYLE_COLORS = ["background", "color"] as const;
const STYLE_SIZES = [
  { key: "radius", max: 48 },
  { key: "padding", max: 64 },
  { key: "spaceBefore", max: 96 },
  { key: "borderWidth", max: 8 },
] as const;
const ALIGN_OPTIONS = ["start", "center", "end"] as const;
const SHADOW_OPTIONS = ["none", "sm", "md", "lg"] as const;

const pickerValue = (c: string | undefined) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : "#000000");

function pxOf(event: Event): number | undefined {
  const raw = (event.target as HTMLInputElement).value.trim();
  const n = Number(raw);
  return raw === "" || !Number.isFinite(n) ? undefined : n;
}

function colorOf(event: Event, current: string | undefined): string | undefined {
  const raw = (event.target as HTMLInputElement).value.trim();
  if (raw === "") return undefined;
  return safeColor(raw) ?? current;
}

function setStyleField<K extends keyof ResultBlockStyle>(
  key: K,
  value: ResultBlockStyle[K] | undefined,
) {
  const next: ResultBlockStyle = { ...modelValue.value };
  if (value === undefined) delete next[key];
  else next[key] = value;
  if (!Object.keys(next).length) {
    modelValue.value = undefined;
  } else {
    modelValue.value = next;
  }
}

function resetStyle() {
  modelValue.value = undefined;
}
</script>

<template>
  <fieldset
    class="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
    data-style
  >
    <legend class="mb-1 p-0 text-[11.5px] font-semibold text-fb-fg-secondary">
      {{ t("layout.style.label") }}
    </legend>

    <div class="flex flex-col gap-1">
      <label
        :for="`${uid}-align-${index}`"
        class="text-[11.5px] text-fb-fg-muted"
        >{{ t("layout.style.align") }}</label
      >
      <select
        :id="`${uid}-align-${index}`"
        :value="modelValue?.align ?? ''"
        :class="inputClass"
        @change="
          setStyleField(
            'align',
            (($event.target as HTMLSelectElement).value || undefined) as ResultBlockStyle['align'],
          )
        "
      >
        <option value="">{{ t("layout.style.default") }}</option>
        <option v-for="a in ALIGN_OPTIONS" :key="a" :value="a">
          {{ t(`layout.style.alignOptions.${a}`) }}
        </option>
      </select>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div v-for="key in STYLE_COLORS" :key="key" class="flex min-w-0 flex-col gap-1">
        <label
          :for="`${uid}-${key}-${index}`"
          class="text-[11.5px] text-fb-fg-muted"
          >{{ t(`layout.style.${key}`) }}</label
        >
        <div class="flex items-center gap-1.5">
          <input
            type="color"
            :value="pickerValue(modelValue?.[key])"
            :aria-label="t(`layout.style.${key}`)"
            class="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-fb-border bg-fb-surface p-0.5"
            @input="setStyleField(key, ($event.target as HTMLInputElement).value)"
          />
          <input
            :id="`${uid}-${key}-${index}`"
            type="text"
            dir="ltr"
            spellcheck="false"
            :value="modelValue?.[key] ?? ''"
            :placeholder="t('layout.style.colorPlaceholder')"
            class="min-w-0 flex-1"
            :class="inputClass"
            @change="setStyleField(key, colorOf($event, modelValue?.[key]))"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div class="flex min-w-0 flex-col gap-1">
        <label
          :for="`${uid}-shadow-${index}`"
          class="text-[11.5px] text-fb-fg-muted"
          >{{ t("layout.style.shadow") }}</label
        >
        <select
          :id="`${uid}-shadow-${index}`"
          :value="modelValue?.shadow ?? ''"
          :class="inputClass"
          @change="
            setStyleField(
              'shadow',
              (($event.target as HTMLSelectElement).value || undefined) as ResultBlockStyle['shadow'],
            )
          "
        >
          <option value="">{{ t("layout.style.default") }}</option>
          <option v-for="sh in SHADOW_OPTIONS" :key="sh" :value="sh">
            {{ t(`layout.style.shadowOptions.${sh}`) }}
          </option>
        </select>
      </div>

      <div class="flex min-w-0 flex-col gap-1">
        <label
          :for="`${uid}-borderColor-${index}`"
          class="text-[11.5px] text-fb-fg-muted"
          >{{ t("layout.style.borderColor") }}</label
        >
        <div class="flex items-center gap-1.5">
          <input
            type="color"
            :value="pickerValue(modelValue?.borderColor)"
            :aria-label="t('layout.style.borderColor')"
            class="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-fb-border bg-fb-surface p-0.5"
            @input="setStyleField('borderColor', ($event.target as HTMLInputElement).value)"
          />
          <input
            :id="`${uid}-borderColor-${index}`"
            type="text"
            dir="ltr"
            spellcheck="false"
            :value="modelValue?.borderColor ?? ''"
            :placeholder="t('layout.style.colorPlaceholder')"
            class="min-w-0 flex-1"
            :class="inputClass"
            @change="setStyleField('borderColor', colorOf($event, modelValue?.borderColor))"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div v-for="size in STYLE_SIZES" :key="size.key" class="flex min-w-0 flex-col gap-1">
        <label
          :for="`${uid}-${size.key}-${index}`"
          class="text-[11.5px] text-fb-fg-muted"
          >{{ t(`layout.style.${size.key}`) }}</label
        >
        <input
          :id="`${uid}-${size.key}-${index}`"
          type="number"
          inputmode="numeric"
          min="0"
          :max="size.max"
          :value="modelValue?.[size.key] ?? ''"
          :placeholder="t('layout.style.auto')"
          :class="inputClass"
          @change="setStyleField(size.key, pxOf($event))"
        />
      </div>
    </div>

    <button
      v-if="modelValue"
      type="button"
      class="cursor-pointer self-start rounded-md border-0 bg-transparent px-1 py-0.5 text-[11.5px] font-semibold text-fb-accent hover:underline focus-visible:outline-2 focus-visible:outline-fb-accent"
      data-style-reset
      @click="resetStyle"
    >
      {{ t("layout.style.reset") }}
    </button>
  </fieldset>
</template>
