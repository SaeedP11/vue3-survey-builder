import { describe, expect, test } from "vitest";
import {
  getDefaultProps,
  surveyResultTemplate,
} from "../../src/schemas/templates.ts";
import { surveyResult } from "../../src/locales/index.ts";
import SurveyResult from "../../src/components/templates/SurveyResult.vue";
import SurveyResultEditor from "../../src/components/SurveyResultEditor.vue";

describe("getDefaultProps", () => {
  test("takes the copy from the locale", () => {
    const en = getDefaultProps("en");
    const fa = getDefaultProps("fa");
    expect(en.title).toBe(surveyResult.en.title);
    expect(fa.title).toBe(surveyResult.fa.title);
    expect(en.closeLabel).toBe(surveyResult.en.close);
    expect(fa.statusLabels).toEqual(surveyResult.fa.statusLabels);
  });

  test("uses the language of a regional locale", () => {
    expect(getDefaultProps("fa-IR").title).toBe(surveyResult.fa.title);
  });

  test("falls back to English for an unknown locale", () => {
    expect(getDefaultProps("de").title).toBe(surveyResult.en.title);
  });

  test("sets every prop, with a neutral score setup", () => {
    const props = getDefaultProps("en");
    expect(props).toMatchObject({
      score: "",
      min: 0,
      max: 100,
      scoreDisplay: "default",
      tableRows: [],
      logoSrc: "",
    });
    for (const [key, value] of Object.entries(props)) {
      expect(value, key).not.toBeUndefined();
    }
  });

  test("returns fresh arrays, so editing one template leaves the locale alone", () => {
    const props = getDefaultProps("en");
    props.statusLabels.push("Extra");
    props.tableRows.push({ metric: "m", value: 1, min: 0, max: 1 });
    expect(surveyResult.en.statusLabels).not.toContain("Extra");
    expect(getDefaultProps("en").tableRows).toEqual([]);
  });
});

test("the default template pairs SurveyResult with its editor", () => {
  expect(surveyResultTemplate.component).toBe(SurveyResult);
  expect(surveyResultTemplate.editor).toBe(SurveyResultEditor);
});
