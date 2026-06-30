<script setup lang="ts">
import { ref } from "vue";
import FormBuilder from "./components/FormBuilder.vue";
import { provideSurveyConfig } from "./provider/surveyConfig";
import { ThemeModes, Locales } from "./types/index.ts";

// registerHtmlEditorModal({
//   iconName: "icon-edit",
//   title: "Choose template",
//   views: [
//     {
//       id: "score-linear",
//       name: "Progress Bar",
//       category: "Score",
//       description: "Horizontal bar that fills to the score, coloured by status threshold.",
//       bestFor: "At-a-glance progress",
//       dataShape: "1 value · 0–100",
//       component: ScoreWidget,
//       props: { variant: "linear-bar", score: 72 },
//     },
//     {
//       id: "score-segmented",
//       name: "Threshold Bar",
//       category: "Score",
//       description: "Bar split into red/yellow/green zones with a marker at the score.",
//       bestFor: "Score within bands",
//       dataShape: "1 value · 0–100",
//       component: ScoreWidget,
//       props: { variant: "segmented", score: 72 },
//     },
//     {
//       id: "score-gauge",
//       name: "Half Gauge",
//       category: "Score",
//       description: "Semicircular dial that arcs from empty to the current score.",
//       bestFor: "Dashboard headline",
//       dataShape: "1 value · 0–100",
//       component: ScoreWidget,
//       props: { variant: "radial-gauge", score: 72 },
//     },
//     {
//       id: "score-donut",
//       name: "Donut",
//       category: "Score",
//       description: "Circular ring with the percentage rendered in the centre.",
//       bestFor: "Compact percentage display",
//       dataShape: "1 value · 0–100",
//       component: ScoreWidget,
//       props: { variant: "donut-score", score: 72 },
//     },
//     {
//       id: "score-card",
//       name: "Score Card",
//       category: "Score",
//       description: "Bold number with a coloured status pill — no bar chrome.",
//       bestFor: "Dense layouts",
//       dataShape: "1 value · 0–100",
//       component: ScoreWidget,
//       props: { variant: "score-card", score: 72 },
//     },
//     {
//       id: "answers-list",
//       name: "Q&A List",
//       category: "Answers",
//       description: "Clean two-column list of every question and the user's answer.",
//       bestFor: "Reviewing all responses",
//       dataShape: "n questions · 1 answer",
//       component: AnswersWidget,
//       props: { variant: "qa-list" },
//     },
//     {
//       id: "answers-status",
//       name: "Status Table",
//       category: "Answers",
//       description: "Each answer tagged with a healthy / moderate / critical pill.",
//       bestFor: "Triage-style summary",
//       dataShape: "n questions · 1 answer · 1 status",
//       component: AnswersWidget,
//       props: { variant: "status-table" },
//     },
//     {
//       id: "answers-breakdown",
//       name: "Score Breakdown",
//       category: "Answers",
//       description: "Per-question numeric score with a mini bar in each row.",
//       bestFor: "Scored questionnaires",
//       dataShape: "n questions · 1 score",
//       component: AnswersWidget,
//       props: { variant: "score-breakdown" },
//     },
//   ],
// });

provideSurveyConfig({
  colorMode: ref(ThemeModes.dark),
  locale: ref(Locales.fa),
});

const json = ref<object>({});
</script>

<template>
  <FormBuilder v-model:json="json" />
</template>
