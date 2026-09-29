<script setup lang="ts">
import { computed, ref } from "vue";

defineOptions({ inheritAttrs: false });
import LinearHealthGauge from "../widgets/LinearHealthGauge.vue";
import RadialGauge from "../widgets/RadialGauge.vue";
import TemperatureGauge from "../widgets/TemperatureGauge.vue";
import DonutGauge from "../widgets/DonutGauge.vue";
import BulletChart from "../widgets/BulletChart.vue";
import VerticalThermometer from "../widgets/VerticalThermometer.vue";
import SegmentedPills from "../widgets/SegmentedPills.vue";
import Table from "../widgets/Table.vue";
import type { SurveyResultProps, TableRow } from "../../types/index.ts";
import DefaultScoreCard from "../widgets/DefaultScoreCard.vue";
import HideableSection from "./HideableSection.vue";
import { useSurveyCreator } from "../../provider/surveyCreator.ts";
import useLocalI18n from "../../composables/useLocalI18n.ts";
import { surveyResult } from "../../locales/index.ts";

// A template without scoreDisplay (hand-written or older JSON) still shows its score
const props = withDefaults(defineProps<SurveyResultProps>(), {
  scoreDisplay: "default",
});

const emit = defineEmits<{
  primary: [];
  secondary: [];
  close: [];
}>();

const { t, tm, rt } = useLocalI18n(surveyResult);

const ui = computed(() => {
  const or = (v: string | undefined, fallback: string) =>
    v && v.trim().length > 0 ? v : fallback;

  return {
    brandName: or(props.brandName, t("brandName")),
    brandTagline: or(props.brandTagline, t("brandTagline")),
    categoryChip: or(props.categoryChip, t("categoryChip")),
    title: or(props.title, t("title")),
    subtitle: or(props.subtitle, t("subtitle")),
    description: or(props.description, t("description")),
    noteText: or(props.noteText, t("noteText")),
    primaryLabel: or(props.primaryLabel, t("primaryLabel")),
    secondaryLabel: or(props.secondaryLabel, t("secondaryLabel")),
    closeLabel: or(props.closeLabel, t("close")),
  };
});

const hasText = (v: string | undefined) => !!v && v.trim().length > 0;

const chartValue = computed(() =>
  typeof props.score === "number" ? props.score : 0,
);

const statusLabels = computed<string[]>(() => {
  if (Array.isArray(props.statusLabels) && props.statusLabels.length) {
    return props.statusLabels;
  }
  // t() returns the key for an array message; tm() gives the array. It is
  // cast because its generic key typing recurses too deep for vue-tsc here.
  const i18nLabels = (tm as (key: string) => unknown)("statusLabels");
  if (Array.isArray(i18nLabels) && i18nLabels.length) {
    return i18nLabels.map((m) => rt(m));
  }
  return ["Mild", "Moderate", "Severe", "Critical"];
});

const resolvedTableRows = computed<TableRow[]>(() => {
  const raw = props.tableRows;
  return Array.isArray(raw) ? (raw as TableRow[]) : [];
});

const creator = useSurveyCreator();
const themeVars = computed<Record<string, string>>(
  () => ({ ...(creator.theme?.cssVariables ?? {}) }) as Record<string, string>,
);

const heroVisible = ref(true);
const scoreVisible = ref(true);
const noteVisible = ref(true);
const actionsVisible = ref(true);

const allVisible = computed(
  () =>
    heroVisible.value &&
    scoreVisible.value &&
    noteVisible.value &&
    actionsVisible.value,
);

const restoreSections = () => {
  heroVisible.value = true;
  scoreVisible.value = true;
  noteVisible.value = true;
  actionsVisible.value = true;
};
</script>

<template>
  <div
    class="min-h-screen w-full flex items-center justify-center px-5 py-12 bg-[var(--sjs-general-backcolor-dim)] font-[Cairo,sans-serif] box-border"
    :style="themeVars"
  >
    <div
      class="w-4/5 max-w-155 bg-[var(--sjs-general-backcolor)] text-[var(--sjs-general-forecolor)]"
    >
      <header
        class="flex items-center justify-between px-7.5 py-5 border-b border-[var(--sjs-border-light)]"
      >
        <div class="flex items-center gap-3">
          <img
            v-if="logoSrc"
            :src="logoSrc"
            :alt="ui.brandName"
            class="block w-10.5 h-10.5 rounded-[11px] object-cover"
          />
          <div
            v-else
            class="block w-10.5 h-10.5 rounded-[11px] bg-[var(--sjs-primary-backcolor)]"
            aria-hidden="true"
          />
          <div class="flex flex-col gap-px">
            <span
              class="text-base font-extrabold tracking-[0.01em] text-[var(--sjs-general-forecolor)]"
              >{{ ui.brandName }}</span
            >
            <span
              class="text-[11.5px] font-medium text-[var(--sjs-general-forecolor-light)]"
              >{{ ui.brandTagline }}</span
            >
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="text-[11px] font-bold text-[var(--sjs-special-green)] bg-[var(--sjs-special-green-light)] border border-[var(--sjs-special-green-light)] px-3 py-1.5 rounded-full"
            >{{ ui.categoryChip }}</span
          >
          <button
            v-if="!allVisible"
            type="button"
            class="text-[11px] font-semibold text-[var(--sjs-general-forecolor-light)] bg-transparent border border-dashed border-[var(--sjs-border-default)] px-3 py-1.5 rounded-full cursor-pointer hover:text-[var(--sjs-primary-backcolor)] hover:border-[var(--sjs-primary-backcolor)]"
            @click="restoreSections"
          >
            {{ t("restoreHidden") }}
          </button>
        </div>
      </header>

      <div class="px-9.5 pt-9.5 pb-8.5">
        <HideableSection v-if="heroVisible" @hide="heroVisible = false">
          <div class="flex flex-col items-center text-center gap-3.25">
            <div
              class="w-15 h-15 rounded-full bg-(--sjs-special-green-light) border border-[var(--sjs-special-green-light)] flex items-center justify-center"
            >
              <svg width="29" height="29" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12.5l4 4L19 7"
                  stroke="var(--sjs-special-green)"
                  stroke-width="2.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <h1
              class="mt-0.5 text-[28px] font-extrabold text-[var(--sjs-general-forecolor)] tracking-[-0.01em]"
              v-if="hasText(ui.title)"
            >
              {{ ui.title }}
            </h1>
            <div
              class="text-[12.5px] font-bold text-[var(--sjs-primary-backcolor)] tracking-[0.04em]"
              v-if="hasText(ui.subtitle)"
            >
              {{ ui.subtitle }}
            </div>
            <p
              v-if="hasText(props.description)"
              class="mt-1 text-[15px] leading-[1.85] text-[var(--sjs-general-forecolor)] max-w-107.5"
            >
              {{ ui.description }}
            </p>
          </div>
        </HideableSection>

        <HideableSection
          v-if="scoreVisible"
          class="mt-7"
          @hide="scoreVisible = false"
        >
          <DefaultScoreCard
            v-if="scoreDisplay === 'default'"
            :value="chartValue"
            :min="min"
            :max="max"
            :status-labels="statusLabels"
          />
          <div v-else class="flex justify-center" dir="ltr">
            <LinearHealthGauge
              v-if="scoreDisplay === 'linear'"
              :model-value="chartValue"
              :min="min"
              :max="max"
              :status-labels="statusLabels"
            />
            <RadialGauge
              v-else-if="scoreDisplay === 'radial'"
              :value="chartValue"
              :min="min"
              :max="max"
              :status-labels="statusLabels"
            />
            <TemperatureGauge
              v-else-if="scoreDisplay === 'temperature'"
              :model-value="chartValue"
              :min="min"
              :max="max"
              :status-labels="statusLabels"
            />
            <DonutGauge
              v-else-if="scoreDisplay === 'donut'"
              :value="chartValue"
              :min="min"
              :max="max"
              :status-labels="statusLabels"
            />
            <BulletChart
              v-else-if="scoreDisplay === 'bullet'"
              :value="chartValue"
              :min="min"
              :max="max"
              :status-labels="statusLabels"
            />
            <VerticalThermometer
              v-else-if="scoreDisplay === 'thermometer'"
              :value="chartValue"
              :min="min"
              :max="max"
              :status-labels="statusLabels"
            />
            <SegmentedPills
              v-else-if="scoreDisplay === 'pills'"
              :value="chartValue"
              :min="min"
              :max="max"
              :status-labels="statusLabels"
            />
            <Table
              v-else-if="scoreDisplay === 'table'"
              :rows="resolvedTableRows"
              :status-labels="statusLabels"
            />
          </div>
        </HideableSection>

        <HideableSection
          v-if="noteVisible && hasText(props.noteText)"
          class="mt-4.5"
          @hide="noteVisible = false"
        >
          <div class="flex items-start gap-2.5 px-0.5">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              class="flex-none mt-px"
            >
              <circle
                cx="12"
                cy="12"
                r="9.5"
                stroke="var(--sjs-general-forecolor-light)"
                stroke-width="1.6"
              />
              <path
                d="M12 11v5M12 7.6v.4"
                stroke="var(--sjs-general-forecolor-light)"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
            <p
              class="m-0 text-[13.5px] leading-[1.75] text-[var(--sjs-general-forecolor-light)]"
            >
              {{ ui.noteText }}
            </p>
          </div>
        </HideableSection>

        <HideableSection
          v-if="actionsVisible"
          class="mt-7"
          @hide="actionsVisible = false"
        >
          <div>
            <div class="flex gap-3">
              <button
                class="flex-1 bg-[var(--sjs-primary-backcolor)] text-[var(--sjs-primary-forecolor)] border-0 rounded-xl py-3.75 text-[15px] font-bold cursor-pointer font-[Cairo,sans-serif]"
                @click="emit('primary')"
              >
                {{ ui.primaryLabel }}
              </button>
              <button
                class="flex-1 bg-[var(--sjs-general-backcolor)] text-[var(--sjs-general-forecolor)] border-[1.5px] border-[var(--sjs-border-default)] rounded-xl py-3.5 text-sm font-bold cursor-pointer flex items-center justify-center gap-2 font-[Cairo,sans-serif]"
                @click="emit('secondary')"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3v11m0 0l-4-4m4 4l4-4M5 19h14"
                    stroke="var(--sjs-general-forecolor)"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ ui.secondaryLabel }}
              </button>
            </div>
            <button
              class="w-full bg-transparent text-[var(--sjs-general-forecolor-light)] border-0 py-1.75 mt-3 text-sm font-semibold cursor-pointer font-[Cairo,sans-serif]"
              @click="emit('close')"
            >
              {{ ui.closeLabel }}
            </button>
          </div>
        </HideableSection>
      </div>
    </div>
  </div>
</template>
