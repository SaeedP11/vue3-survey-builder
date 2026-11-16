<script setup lang="ts">
import { computed } from "vue";
import type { Question } from "survey-core";
import ChartQuestion from "../../ChartQuestion.vue";
import VerticalThermometer from "../../widgets/VerticalThermometer.vue";
import RadialGauge from "../../widgets/RadialGauge.vue";
import BulletChart from "../../widgets/BulletChart.vue";
import DonutGauge from "../../widgets/DonutGauge.vue";
import LinearHealthGauge from "../../widgets/LinearHealthGauge.vue";
import TemperatureGauge from "../../widgets/TemperatureGauge.vue";
import SegmentedPills from "../../widgets/SegmentedPills.vue";
import DefaultScoreCard from "../../widgets/DefaultScoreCard.vue";
import useLocalI18n from "../../../composables/useLocalI18n";
import { chat } from "../../../locales/index";

const props = defineProps<{
  question: Question;
}>();

const emit = defineEmits<{
  submit: [value: unknown];
}>();

const { t } = useLocalI18n(chat);

const qType = computed(() => props.question.getType().toLowerCase());

const isChart = computed(() => qType.value === "chart" || qType.value === "chartquestion");

const numVal = computed(() => {
  const v = Number(props.question.value);
  return isNaN(v) ? 0 : v;
});

function confirm() {
  emit("submit", props.question.value ?? true);
}
</script>

<template>
  <div class="flex flex-col gap-3 pt-2 max-w-md w-full">
    <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <!-- Chart Question -->
      <ChartQuestion
        v-if="isChart"
        :question="question as any"
      />

      <!-- Gauge & Widget Types -->
      <VerticalThermometer
        v-else-if="qType === 'verticalthermometer' || qType === 'thermometer'"
        :value="numVal"
        :title="question.title"
      />

      <RadialGauge
        v-else-if="qType === 'radialgauge' || qType === 'radial'"
        :value="numVal"
        :title="question.title"
      />

      <BulletChart
        v-else-if="qType === 'bulletchart' || qType === 'bullet'"
        :value="numVal"
        :title="question.title"
      />

      <DonutGauge
        v-else-if="qType === 'donutgauge' || qType === 'donut'"
        :value="numVal"
        :title="question.title"
      />

      <LinearHealthGauge
        v-else-if="qType === 'linearhealthgauge' || qType === 'linear'"
        :value="numVal"
        :title="question.title"
      />

      <TemperatureGauge
        v-else-if="qType === 'temperaturegauge' || qType === 'temperature'"
        :value="numVal"
        :title="question.title"
      />

      <SegmentedPills
        v-else-if="qType === 'segmentedpills' || qType === 'pills'"
        :value="numVal"
        :title="question.title"
      />

      <DefaultScoreCard
        v-else-if="qType === 'scorecard' || qType === 'score'"
        :value="numVal"
        :title="question.title"
      />

      <div v-else class="text-xs text-slate-500 py-2">
        {{ question.title || question.name }}
      </div>
    </div>

    <button
      type="button"
      class="self-start px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-all"
      @click="confirm"
    >
      {{ t("done") }}
    </button>
  </div>
</template>
