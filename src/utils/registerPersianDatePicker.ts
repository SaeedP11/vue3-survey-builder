import { Serializer, SvgRegistry } from "survey-core";
import { ComponentFactory } from "survey-vue3-ui";
import PersianDateTimePicker from "../components/PersianDateTimePicker.vue";
import SurveyTextInputWrapper from "../components/SurveyTextInputWrapper.vue";

let originalTextInput: any = null;
let registered = false;

export function getOriginalTextInputComponent(): any {
  return originalTextInput;
}

const ICON_DATE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const ICON_DATETIME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="16" cy="16" r="4"/><polyline points="16 14 16 16 18 17"/></svg>`;
const ICON_TIME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

/**
 * Registers the Persian DateTime Picker for all SurveyJS text questions with
 * inputType "date", "datetime-local", "datetime", or "time".
 *
 * Safe to call multiple times (idempotent). Does not depend on survey-creator-core,
 * so it can safely be included in the runtime bundle.
 */
export function registerPersianDatePicker(): void {
  if (registered) return;
  registered = true;

  // Add dateFormat property to text question
  Serializer.addProperty("text", {
    name: "dateFormat",
    displayName: "Date storage format",
    category: "general",
    default: "jalali",
    choices: [
      { value: "jalali", text: "Jalali (Persian)" },
      { value: "gregorian", text: "Gregorian (ISO)" },
    ],
    visibleIndex: 12,
    dependsOn: ["inputType"],
    visibleIf: (obj: any) =>
      ["date", "datetime-local", "datetime"].includes(obj?.inputType),
  });

  // Capture original text input before hooking
  if (!originalTextInput) {
    originalTextInput =
      ComponentFactory.Instance.getComponent("survey-text-input");
  }

  // Register our wrapper component
  ComponentFactory.Instance.registerComponent(
    "survey-text-input",
    SurveyTextInputWrapper,
  );

  // Also register direct component name
  ComponentFactory.Instance.registerComponent(
    "survey-persian-datetime-picker",
    PersianDateTimePicker,
  );

  // Register icons in SurveyJS SvgRegistry
  SvgRegistry.registerIcon("icon-persian-date", ICON_DATE);
  SvgRegistry.registerIcon("icon-persian-datetime", ICON_DATETIME);
  SvgRegistry.registerIcon("icon-persian-time", ICON_TIME);
}

export default registerPersianDatePicker;
