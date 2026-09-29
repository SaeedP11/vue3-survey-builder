// @vitest-environment jsdom
import * as surveyCore from "survey-core";
import { beforeAll, expect, test } from "vitest";
import { OWN_EXPORTS } from "../publicApi.ts";
import "../setup.ts";

// The built ES module, loaded the way a bundler would load the package
let built: Record<string, unknown>;
beforeAll(async () => {
  built = await import("../../dist/form-builder.mjs");
});

test("the build exposes the same API as the source", () => {
  const own = Object.keys(built).filter((name) => !(name in surveyCore));
  expect(own.sort()).toEqual(OWN_EXPORTS);
});

test("the build shares survey-core with the host instead of carrying a copy", () => {
  expect(built.Model).toBe(surveyCore.Model);
  expect(built.Serializer).toBe(surveyCore.Serializer);
});

test("the build registers its survey properties on the shared Serializer", () => {
  const survey = new surveyCore.Model({ icon: "Star", resultTemplate: { title: "T" } });
  expect(survey.toJSON()).toMatchObject({ icon: "Star", resultTemplate: { title: "T" } });
});
