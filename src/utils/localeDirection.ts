import { surveyLocalization } from "survey-core";

export type TextDirection = "ltr" | "rtl";

// For locales whose SurveyJS pack is not loaded, so it has not registered a direction.
const RTL_LANGUAGES = new Set(["ar", "ckb", "dv", "fa", "he", "ku", "ps", "sd", "ug", "ur", "yi"]);

/** The text direction of a locale such as `fa`, `en` or `fa-IR`. */
export default function localeDirection(locale: string): TextDirection {
  const registered = surveyLocalization.localeDirections[locale];
  if (registered === "rtl" || registered === "ltr") return registered;
  const language = locale.split(/[-_]/)[0].toLowerCase();
  return RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
}
