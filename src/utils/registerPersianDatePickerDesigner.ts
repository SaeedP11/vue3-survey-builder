import { editorLocalization } from "survey-creator-core";
import type { SurveyCreatorModel } from "survey-creator-core";

const LOCALES = {
  en: {
    pe: {
      text: {
        dateFormat: "Date storage format",
      },
    },
    pv: {
      dateFormat: {
        jalali: "Jalali (Persian)",
        gregorian: "Gregorian (ISO)",
      },
    },
    qt: {
      "persian-date": "Persian Date",
      "persian-datetime": "Persian Date & Time",
      "persian-time": "Time",
    },
  },
  fa: {
    pe: {
      text: {
        dateFormat: "قالب ذخیره تاریخ",
      },
    },
    pv: {
      dateFormat: {
        jalali: "شمسی (جلالی)",
        gregorian: "میلادی (ISO)",
      },
    },
    qt: {
      "persian-date": "تاریخ شمسی",
      "persian-datetime": "تاریخ و زمان شمسی",
      "persian-time": "زمان",
    },
  },
};

let designerRegistered = false;

/**
 * Registers designer property descriptions and toolbox titles in editorLocalization.
 */
export function registerPersianDatePickerDesigner(): void {
  if (designerRegistered) return;
  designerRegistered = true;

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

/**
 * Adds dedicated Date, Date & Time, and Time items to the Survey Creator toolbox.
 */
export function addPersianDateTimeToolboxItems(
  creator: SurveyCreatorModel,
): void {
  if (!creator?.toolbox) return;

  const items = [
    {
      name: "persian-date",
      iconName: "icon-persian-date",
      title: "Persian Date",
      category: "general",
      json: {
        type: "text",
        inputType: "date",
        dateFormat: "jalali",
      },
    },
    {
      name: "persian-datetime",
      iconName: "icon-persian-datetime",
      title: "Persian Date & Time",
      category: "general",
      json: {
        type: "text",
        inputType: "datetime-local",
        dateFormat: "jalali",
      },
    },
    {
      name: "persian-time",
      iconName: "icon-persian-time",
      title: "Time",
      category: "general",
      json: {
        type: "text",
        inputType: "time",
      },
    },
  ];

  for (const item of items) {
    if (!creator.toolbox.getItemByName(item.name)) {
      creator.toolbox.addItem(item);
    }
  }
}

export default registerPersianDatePickerDesigner;
