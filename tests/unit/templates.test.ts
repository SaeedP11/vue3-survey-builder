import { describe, expect, test } from "vitest";
import {
  editableProps,
  getDefaultProps,
  surveyResultTemplate,
} from "../../src/schemas/templates.ts";
import { defaultLayout } from "../../src/utils/resultLayout.ts";
import { surveyResult } from "../../src/locales/index.ts";
import SurveyResult from "../../src/components/templates/SurveyResult.vue";
import SurveyResultEditor from "../../src/components/SurveyResultEditor.vue";

describe("getDefaultProps", () => {
  test("takes the copy from the locale", () => {
    const en = getDefaultProps("en");
    const fa = getDefaultProps("fa");
    expect(en.title).toBe(surveyResult.en.title);
    expect(fa.title).toBe(surveyResult.fa.title);
    expect(en.actions.map((a) => a.label)).toEqual([
      surveyResult.en.primaryLabel,
      surveyResult.en.secondaryLabel,
      surveyResult.en.close,
    ]);
    expect(fa.actions.map((a) => a.label)).toEqual([
      surveyResult.fa.primaryLabel,
      surveyResult.fa.secondaryLabel,
      surveyResult.fa.close,
    ]);
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
      images: [],
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

describe("layout", () => {
  test("a new template starts from the standard order", () => {
    expect(getDefaultProps("en").layout).toEqual(defaultLayout());
    // A fresh copy each time
    getDefaultProps("en").layout.pop();
    expect(getDefaultProps("en").layout).toHaveLength(defaultLayout().length);
  });

  test("a stored template without one is edited from the standard order", () => {
    expect(editableProps({ title: "T" }, "en").layout).toEqual(defaultLayout());
    expect(editableProps(undefined, "en").layout).toEqual(defaultLayout());
  });

  test("a stored layout is edited cleaned up, keeping an empty one empty", () => {
    expect(
      editableProps({ layout: [{ id: "score", type: "score" }, { id: "x", type: "nope" as "score" }] }, "en").layout,
    ).toEqual([{ id: "score", type: "score" }]);
    expect(editableProps({ layout: [] }, "en").layout).toEqual([]);
  });
});
