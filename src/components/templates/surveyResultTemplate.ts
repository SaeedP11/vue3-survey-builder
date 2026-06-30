import SurveyResult from "./SurveyResult.vue";
import type { PropsSchema } from "../TemplateEditor.vue";

const propsSchema: PropsSchema = {
  fields: [
    {
      key: "score",
      label: "Score",
      type: "number",
      group: "Score",
      min: 0,
      dependsOn: "showScoreCard",
    },
    {
      key: "max",
      label: "Max",
      type: "number",
      group: "Score",
      min: 1,
      dependsOn: "showScoreCard",
    },
    {
      key: "level",
      label: "Risk level",
      type: "select",
      group: "Score",
      options: [
        { label: "Low", value: "low" },
        { label: "Moderate", value: "moderate" },
        { label: "High", value: "high" },
      ],
      dependsOn: "showScoreCard",
    },
    {
      key: "levelLabel",
      label: "Level badge label",
      type: "text",
      group: "Score",
      dependsOn: "showScoreCard",
    },
    {
      key: "scoreDisplay",
      label: "Score display",
      type: "select",
      group: "Score",
      options: [
        { label: "Default (segmented bar)", value: "default" },
        { label: "Linear health gauge", value: "linear" },
        { label: "Radial gauge", value: "radial" },
        { label: "Temperature gauge", value: "temperature" },
        { label: "Donut", value: "donut" },
        { label: "Bullet chart", value: "bullet" },
        { label: "Vertical thermometer", value: "thermometer" },
        { label: "Segmented pills", value: "pills" },
      ],
      dependsOn: { showScoreCard: true, showScoreChart: true },
    },

    {
      key: "logoSrc",
      label: "Logo URL",
      type: "text",
      group: "Brand",
      placeholder: "https://…",
    },
    { key: "brandName", label: "Brand name", type: "text", group: "Brand" },
    { key: "brandTagline", label: "Tagline", type: "text", group: "Brand" },
    {
      key: "categoryChip",
      label: "Category chip",
      type: "text",
      group: "Brand",
    },

    {
      key: "title",
      label: "Title",
      type: "text",
      group: "Copy",
      dependsOn: "showHero",
    },
    {
      key: "subtitle",
      label: "Subtitle",
      type: "text",
      group: "Copy",
      dependsOn: "showHero",
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      group: "Copy",
      dependsOn: ["showHero", "showDescription"],
    },
    {
      key: "scoreLabel",
      label: "Score label",
      type: "text",
      group: "Copy",
      dependsOn: "showScoreCard",
    },
    {
      key: "noteText",
      label: "Note text",
      type: "textarea",
      group: "Copy",
      dependsOn: "showNote",
    },
    {
      key: "primaryLabel",
      label: "Primary button",
      type: "text",
      group: "Copy",
      dependsOn: "showActions",
    },
    {
      key: "secondaryLabel",
      label: "Secondary button",
      type: "text",
      group: "Copy",
      dependsOn: "showActions",
    },
    {
      key: "closeLabel",
      label: "Close button",
      type: "text",
      group: "Copy",
      dependsOn: "showActions",
    },

    {
      key: "segmentLabels[0]",
      label: "Low segment label",
      type: "text",
      group: "Segments & locale",
      dependsOn: {
        showScoreCard: true,
        showScoreChart: true,
        scoreDisplay: "default",
      },
    },
    {
      key: "segmentLabels[1]",
      label: "Moderate segment label",
      type: "text",
      group: "Segments & locale",
      dependsOn: {
        showScoreCard: true,
        showScoreChart: true,
        scoreDisplay: "default",
      },
    },
    {
      key: "segmentLabels[2]",
      label: "High segment label",
      type: "text",
      group: "Segments & locale",
      dependsOn: {
        showScoreCard: true,
        showScoreChart: true,
        scoreDisplay: "default",
      },
    },
    {
      key: "locale",
      label: "Locale (digit style)",
      type: "select",
      group: "Segments & locale",
      options: [
        { label: "Persian (fa-IR)", value: "fa-IR" },
        { label: "Arabic (ar-EG)", value: "ar-EG" },
        { label: "English (en)", value: "en" },
      ],
    },
  ],
};

const baseProps = {
  score: 42,
  max: 100,
  level: "moderate",
  levelLabel: "متوسط",
  scoreDisplay: "default",
  logoSrc: "",
  brandName: "BehAyand",
  brandTagline: "مراقبت از سلامت قلب",
  categoryChip: "سلامت قلب",
  title: "ارزیابی تکمیل شد",
  subtitle: "ارزیابی خطر بیماری‌های قلبی و عروقی",
  description:
    "بر اساس پاسخ‌های شما، امتیاز خطر سلامت محاسبه شد. این نتیجه احتمال ابتلا به بیماری‌های قلبی و عروقی را در ۱۰ سال آینده نشان می‌دهد.",
  scoreLabel: "امتیاز خطر سلامت",
  noteText:
    "نتیجه شما در محدوده خطر متوسط قرار دارد. توصیه می‌شود برای کاهش سطح خطر، به‌صورت منظم وضعیت سلامت خود را پیگیری کرده و تغییرات ساده‌ای در سبک زندگی ایجاد کنید.",
  primaryLabel: "رزرو مشاوره",
  secondaryLabel: "دانلود نتایج (PDF)",
  closeLabel: "بستن",
  segmentLabels: ["کم", "متوسط", "زیاد"],
  locale: "fa-IR",
  showHero: true,
  showDescription: true,
  showScoreCard: true,
  showScoreChart: true,
  showNote: true,
  showActions: true,
};

export const surveyResultTemplate = {
  id: "survey-result",
  name: "Assessment Result — Full",
  category: "Result",
  description:
    "Complete card: hero, score card with chart, info note, and actions.",
  bestFor: "Default post-questionnaire screen",
  dataShape: "1 score · 1 level",
  thumbnail: "/thumbnails/full.png",
  component: SurveyResult,
  props: { ...baseProps },
  propsSchema,
};

export const surveyResultNoChartTemplate = {
  id: "survey-result-no-chart",
  name: "Assessment Result — No Chart",
  category: "Result",
  description:
    "Score number and level badge are visible, but the gauge/bar is hidden.",
  bestFor: "Dense layouts or print-style summaries",
  dataShape: "1 score · 1 level",
  thumbnail: "/thumbnails/no-chart.png",
  component: SurveyResult,
  props: { ...baseProps, showScoreChart: false },
  propsSchema,
};

export const surveyResultNoDescriptionTemplate = {
  id: "survey-result-no-description",
  name: "Assessment Result — No Description",
  category: "Result",
  description:
    "Drops the description paragraph; keeps the title, subtitle, and score card.",
  bestFor: "Compact hero, score still in focus",
  dataShape: "1 score · 1 level",
  thumbnail: "/thumbnails/no-description.png",
  component: SurveyResult,
  props: { ...baseProps, showDescription: false },
  propsSchema,
};

export const surveyResultAnnouncementTemplate = {
  id: "survey-result-announcement",
  name: "Assessment Result — Announcement",
  category: "Result",
  description:
    "Hero + actions only. No score card, no chart, no info note — purely a completion announcement.",
  bestFor: "Pass/fail or thank-you screens",
  dataShape: "0 score required",
  thumbnail: "/thumbnails/announcment.png",
  component: SurveyResult,
  props: {
    ...baseProps,
    showScoreCard: false,
    showNote: false,
  },
  propsSchema,
};

export const surveyResultTemplates = [
  surveyResultTemplate,
  surveyResultNoChartTemplate,
  surveyResultNoDescriptionTemplate,
  surveyResultAnnouncementTemplate,
];
