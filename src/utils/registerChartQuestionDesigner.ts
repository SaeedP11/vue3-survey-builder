import { editorLocalization } from "survey-creator-core";
import "survey-creator-core/i18n/persian";
import { CHART_QUESTION_TYPE } from "./registerChartQuestion";

// The designer's strings. pe.<class> holds property names for that class only
// (SurveyJS walks the class chain), so a shared pe.items stays untouched.
const LOCALES = {
  en: {
    qt: { [CHART_QUESTION_TYPE]: "Chart" },
    pe: {
      [CHART_QUESTION_TYPE]: {
        chartType: "Chart type",
        items: "Data",
        unit: "Unit",
        maxValue: "Axis maximum",
      },
      chartitem: { expression: "Expression", color: "Color" },
    },
    pehelp: {
      [CHART_QUESTION_TYPE]: {
        items:
          "Each row is one bar, point or slice: a label and an expression over the answers, such as {weight} or {a} + {b}.",
        maxValue: "Leave empty to fit the largest value.",
      },
    },
    pv: {
      chartType: {
        bar: "Bar",
        horizontalBar: "Horizontal bar",
        line: "Line",
        donut: "Donut",
      },
    },
  },
  fa: {
    qt: { [CHART_QUESTION_TYPE]: "نمودار" },
    pe: {
      [CHART_QUESTION_TYPE]: {
        chartType: "نوع نمودار",
        items: "داده‌ها",
        unit: "واحد",
        maxValue: "بیشینه محور",
      },
      chartitem: { expression: "عبارت", color: "رنگ" },
    },
    pehelp: {
      [CHART_QUESTION_TYPE]: {
        items:
          "هر ردیف یک ستون، نقطه یا برش است: یک برچسب و یک عبارت روی پاسخ‌ها، مانند {weight} یا {a} + {b}.",
        maxValue: "برای هم‌اندازه شدن با بزرگ‌ترین مقدار خالی بگذارید.",
      },
    },
    pv: {
      chartType: {
        bar: "ستونی",
        horizontalBar: "میله‌ای افقی",
        line: "خطی",
        donut: "دونات",
      },
    },
  },
};

/**
 * Adds the chart question's strings to the designer. The full entry calls it
 * on import, after registerChartQuestion.
 */
export default function registerChartQuestionDesigner() {
  for (const [code, strings] of Object.entries(LOCALES)) {
    const locale = editorLocalization.getLocale(code);
    if (!locale) continue;
    for (const [section, entries] of Object.entries(strings)) {
      const target = (locale[section] ??= {});
      for (const [key, value] of Object.entries(entries)) {
        target[key] =
          typeof value === "object" ? { ...target[key], ...value } : value;
      }
    }
  }
}
