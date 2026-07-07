import type { SurveyResultProps, TemplateDefinition } from "../types/index.ts";
import SurveyResultEditor from "../components/SurveyResultEditor.vue";
import SurveyResult from "../components/templates/SurveyResult.vue";

export const defaultProps: Required<SurveyResultProps> = {
  score: "",
  min: 0,
  max: 100,
  scoreDisplay: "default",
  tableRows: [],
  logoSrc: "",
  brandName: "BehAyand",
  brandTagline: "مراقبت از سلامت قلب",
  categoryChip: "سلامت قلب",
  title: "ارزیابی تکمیل شد",
  subtitle: "ارزیابی خطر بیماری‌های قلبی و عروقی",
  description:
    "بر اساس پاسخ‌های شما، امتیاز خطر سلامت محاسبه شد. این نتیجه احتمال ابتلا به بیماری‌های قلبی و عروقی در ۱۰ سال آینده نشان می‌دهد.",
  noteText:
    "نتیجه شما در محدوده خطر متوسط قرار دارد. توصیه می‌شود برای کاهش سطح خطر، به‌صورت منظم وضعیت سلامت خود را پیگیری کرده و تغییرات ساده‌ای در سبک زندگی ایجاد کنید.",
  primaryLabel: "رزرو مشاوره",
  secondaryLabel: "دانلود نتایج (PDF)",
  closeLabel: "بستن",
  statusLabels: ["خفیف", "متوسط", "شدید", "بحرانی"],
};

export const surveyResultTemplate: TemplateDefinition<SurveyResultProps> = {
  id: "survey-result",
  name: "Assessment Result",
  component: SurveyResult,
  editor: SurveyResultEditor,
};
