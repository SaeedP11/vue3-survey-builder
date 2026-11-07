<script setup lang="ts">
import { useId } from "vue";
import type { ResultAppearance } from "../types/index.ts";
import { safeColor } from "../utils/statusTiers.ts";
import { resolveAppearance } from "../utils/resultLayout.ts";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { useIconPicker } from "../provider/iconPickerKey.ts";
import IconPickerField from "./IconPickerField.vue";

const appearance = defineModel<ResultAppearance | undefined>({ default: undefined });

const { t } = useLocalI18n(surveyResultEditor);
const uid = useId();
const { picker } = useIconPicker();

const inputClass =
  "rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent";

const SIZES = [
  { key: "maxWidth", min: 320, max: 960 },
  { key: "radius", min: 0, max: 48 },
  { key: "gap", min: 0, max: 64 },
  { key: "metricsMinWidth", min: 96, max: 320 },
  { key: "cardBorderWidth", min: 0, max: 8 },
] as const;
const COLORS = ["chipBackground", "chipColor", "heroIconColor", "cardBackground", "cardBorderColor"] as const;
const TOGGLES = ["showHeader", "showHeroIcon"] as const;
const SHAPES = ["rounded", "pill", "square"] as const;
const SHADOW_OPTIONS = ["none", "sm", "md", "lg"] as const;
const HERO_ALIGNS = ["start", "center", "end"] as const;

interface AppearancePreset {
  id: "clean" | "ocean" | "emerald" | "sunset" | "slate";
  appearance: Partial<ResultAppearance>;
}

const PRESETS: AppearancePreset[] = [
  {
    id: "clean",
    appearance: {
      chipBackground: "#f1f5f9",
      chipColor: "#334155",
      cardBackground: "#ffffff",
      cardBorderColor: "#e2e8f0",
      buttonShape: "rounded",
      cardShadow: "sm",
    },
  },
  {
    id: "ocean",
    appearance: {
      chipBackground: "#e0f2fe",
      chipColor: "#0284c7",
      cardBackground: "#ffffff",
      cardBorderColor: "#bae6fd",
      buttonShape: "pill",
      cardShadow: "md",
    },
  },
  {
    id: "emerald",
    appearance: {
      chipBackground: "#d1fae5",
      chipColor: "#059669",
      cardBackground: "#ffffff",
      cardBorderColor: "#a7f3d0",
      buttonShape: "rounded",
      cardShadow: "sm",
    },
  },
  {
    id: "sunset",
    appearance: {
      chipBackground: "#fef3c7",
      chipColor: "#d97706",
      cardBackground: "#ffffff",
      cardBorderColor: "#fde68a",
      buttonShape: "pill",
      cardShadow: "md",
    },
  },
  {
    id: "slate",
    appearance: {
      chipBackground: "#334155",
      chipColor: "#f8fafc",
      cardBackground: "#0f172a",
      cardBorderColor: "#1e293b",
      buttonShape: "rounded",
      cardShadow: "lg",
    },
  },
];

function applyPreset(preset: AppearancePreset) {
  const next: Record<string, unknown> = {
    ...appearance.value,
    ...preset.appearance,
  };
  appearance.value = resolveAppearance(next);
}

const pickerValue = (c: string | undefined) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : "#000000");

/** Stores `patch` over the current look; an unset field or an empty look leaves nothing stored. */
function set<K extends keyof ResultAppearance>(key: K, value: ResultAppearance[K] | undefined) {
  const next: Record<string, unknown> = { ...appearance.value };
  if (value === undefined) delete next[key];
  else next[key] = value;
  appearance.value = resolveAppearance(next);
}

function numberOf(event: Event): number | undefined {
  const raw = (event.target as HTMLInputElement).value.trim();
  const n = Number(raw);
  return raw === "" || !Number.isFinite(n) ? undefined : n;
}

function colorOf(event: Event, current: string | undefined): string | undefined {
  const raw = (event.target as HTMLInputElement).value.trim();
  if (raw === "") return undefined;
  return safeColor(raw) ?? current;
}
</script>

<template>
  <fieldset class="m-0 flex min-w-0 flex-col gap-3 border-0 p-0" data-appearance>
    <legend class="mb-1 p-0 text-sm font-semibold text-fb-fg">
      {{ t("layout.appearance.label") }}
    </legend>
    <p class="m-0 text-xs text-fb-fg-muted">{{ t("layout.appearance.help") }}</p>

    <div class="flex flex-col gap-1.5 pt-1">
      <span class="text-[11.5px] font-semibold text-fb-fg-muted">
        {{ t("layout.appearance.presets.label") }}
      </span>
      <div
        class="flex flex-wrap items-center gap-1.5"
        role="group"
        :aria-label="t('layout.appearance.presets.label')"
      >
        <button
          v-for="p in PRESETS"
          :key="p.id"
          type="button"
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-fb-border bg-fb-surface px-2.5 py-1 text-xs text-fb-fg transition-all hover:border-fb-border-strong hover:bg-fb-surface-muted focus-visible:outline-2 focus-visible:outline-fb-accent"
          @click="applyPreset(p)"
        >
          <span
            class="h-3 w-3 shrink-0 rounded-full border border-black/10"
            :style="{ backgroundColor: p.appearance.chipColor }"
            aria-hidden="true"
          />
          <span>{{ t(`layout.appearance.presets.${p.id}`) }}</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div v-for="size in SIZES" :key="size.key" class="flex min-w-0 flex-col gap-1">
        <label :for="`${uid}-${size.key}`" class="text-[11.5px] text-fb-fg-muted">{{
          t(`layout.appearance.${size.key}`)
        }}</label>
        <input
          :id="`${uid}-${size.key}`"
          type="number"
          inputmode="numeric"
          :min="size.min"
          :max="size.max"
          :value="appearance?.[size.key] ?? ''"
          :placeholder="t('layout.style.auto')"
          :class="inputClass"
          :data-appearance-field="size.key"
          @change="set(size.key, numberOf($event))"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <div class="flex flex-col gap-1">
        <label :for="`${uid}-buttonShape`" class="text-[11.5px] text-fb-fg-muted">{{
          t("layout.appearance.buttonShape")
        }}</label>
        <select
          :id="`${uid}-buttonShape`"
          :value="appearance?.buttonShape ?? ''"
          :class="inputClass"
          data-appearance-field="buttonShape"
          @change="
            set(
              'buttonShape',
              (($event.target as HTMLSelectElement).value || undefined) as ResultAppearance['buttonShape'],
            )
          "
        >
          <option value="">{{ t("layout.style.default") }}</option>
          <option v-for="shape in SHAPES" :key="shape" :value="shape">
            {{ t(`layout.appearance.shapes.${shape}`) }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label :for="`${uid}-cardShadow`" class="text-[11.5px] text-fb-fg-muted">{{
          t("layout.appearance.cardShadow")
        }}</label>
        <select
          :id="`${uid}-cardShadow`"
          :value="appearance?.cardShadow ?? ''"
          :class="inputClass"
          data-appearance-field="cardShadow"
          @change="
            set(
              'cardShadow',
              (($event.target as HTMLSelectElement).value || undefined) as ResultAppearance['cardShadow'],
            )
          "
        >
          <option value="">{{ t("layout.style.default") }}</option>
          <option v-for="sh in SHADOW_OPTIONS" :key="sh" :value="sh">
            {{ t(`layout.style.shadowOptions.${sh}`) }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label :for="`${uid}-heroAlign`" class="text-[11.5px] text-fb-fg-muted">{{
          t("layout.appearance.heroAlign")
        }}</label>
        <select
          :id="`${uid}-heroAlign`"
          :value="appearance?.heroAlign ?? ''"
          :class="inputClass"
          data-appearance-field="heroAlign"
          @change="
            set(
              'heroAlign',
              (($event.target as HTMLSelectElement).value || undefined) as ResultAppearance['heroAlign'],
            )
          "
        >
          <option value="">{{ t("layout.style.default") }}</option>
          <option v-for="align in HERO_ALIGNS" :key="align" :value="align">
            {{ t(`layout.style.alignOptions.${align}`) }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="picker" class="flex flex-col gap-1">
      <label :for="`${uid}-heroIcon`" class="text-[11.5px] text-fb-fg-muted">{{
        t("layout.appearance.heroIcon")
      }}</label>
      <IconPickerField
        :id="`${uid}-heroIcon`"
        :model-value="appearance?.heroIcon"
        :label="t('layout.appearance.heroIcon')"
        :input-class="inputClass"
        data-appearance-field="heroIcon"
        @update:model-value="set('heroIcon', $event && $event !== 'none' ? $event : undefined)"
      />
    </div>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div v-for="key in COLORS" :key="key" class="flex min-w-0 flex-col gap-1">
        <label :for="`${uid}-${key}`" class="text-[11.5px] text-fb-fg-muted">{{
          t(`layout.appearance.${key}`)
        }}</label>
        <div class="flex items-center gap-1.5">
          <input
            type="color"
            :value="pickerValue(appearance?.[key])"
            :aria-label="t(`layout.appearance.${key}`)"
            class="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-fb-border bg-fb-surface p-0.5"
            @input="set(key, ($event.target as HTMLInputElement).value)"
          />
          <input
            :id="`${uid}-${key}`"
            type="text"
            dir="ltr"
            spellcheck="false"
            :value="appearance?.[key] ?? ''"
            :placeholder="t('layout.style.colorPlaceholder')"
            class="min-w-0 flex-1"
            :class="inputClass"
            :data-appearance-field="key"
            @change="set(key, colorOf($event, appearance?.[key]))"
          />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label
        v-for="key in TOGGLES"
        :key="key"
        class="flex cursor-pointer items-center gap-2 text-sm text-fb-fg"
      >
        <input
          type="checkbox"
          class="h-4 w-4 cursor-pointer accent-fb-accent"
          :checked="appearance?.[key] !== false"
          :data-appearance-field="key"
          @change="set(key, ($event.target as HTMLInputElement).checked ? undefined : false)"
        />
        {{ t(`layout.appearance.${key}`) }}
      </label>
    </div>

    <button
      v-if="appearance"
      type="button"
      class="cursor-pointer self-start rounded-md border-0 bg-transparent px-1 py-0.5 text-[11.5px] font-semibold text-fb-accent hover:underline focus-visible:outline-2 focus-visible:outline-fb-accent"
      data-appearance-reset
      @click="appearance = undefined"
    >
      {{ t("layout.appearance.reset") }}
    </button>
  </fieldset>
</template>
