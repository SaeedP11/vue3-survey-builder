import * as surveyCore from "survey-core";
import { expect, test } from "vitest";
import * as runtime from "../../src/runtime.ts";
import { RUNTIME_EXPORTS } from "../publicApi.ts";

test("the runtime entry exports its public API", () => {
  const own = Object.keys(runtime).filter((name) => !(name in surveyCore));
  expect(own.sort()).toEqual(RUNTIME_EXPORTS);
});

test("the runtime entry re-exports survey-core, as the same objects", () => {
  expect(runtime.Model).toBe(surveyCore.Model);
  expect(runtime.Serializer).toBe(surveyCore.Serializer);
});

test("a survey loaded through the runtime entry keeps the library's properties and chart questions", () => {
  const survey = new runtime.Model({
    icon: "Star",
    resultTemplate: { title: "T" },
    elements: [{ type: "chart", name: "c", chartType: "line" }],
  });
  expect(survey.toJSON()).toMatchObject({ icon: "Star", resultTemplate: { title: "T" } });
  expect(survey.getQuestionByName("c")).toBeInstanceOf(runtime.QuestionChartModel);
});
