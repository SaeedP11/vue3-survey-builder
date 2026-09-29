import * as surveyCore from "survey-core";
import { expect, test } from "vitest";
import * as lib from "../../src/index.ts";
import { OWN_EXPORTS } from "../publicApi.ts";

test("exports its public API", () => {
  const own = Object.keys(lib).filter((name) => !(name in surveyCore));
  expect(own.sort()).toEqual(OWN_EXPORTS);
  for (const name of OWN_EXPORTS) {
    expect((lib as Record<string, unknown>)[name], name).toBeDefined();
  }
});

test("re-exports survey-core, as the same objects", () => {
  expect(lib.Model).toBe(surveyCore.Model);
  expect(lib.Serializer).toBe(surveyCore.Serializer);
  for (const name of Object.keys(surveyCore)) {
    if (name === "default") continue;
    expect((lib as Record<string, unknown>)[name], name).toBe(
      (surveyCore as Record<string, unknown>)[name],
    );
  }
});

test("SurveySchemaPrompt is a chat history of role/content messages", () => {
  expect(lib.SurveySchemaPrompt.length).toBeGreaterThan(0);
  for (const message of lib.SurveySchemaPrompt) {
    expect(["user", "assistant", "system"]).toContain(message.role);
    expect(typeof message.content).toBe("string");
    expect(message.content.length).toBeGreaterThan(0);
  }
});

test("SurveySchemaPrompt asks for the [JSON]...[/JSON] reply that hosts parse", () => {
  const text = lib.SurveySchemaPrompt.map((m) => m.content).join("\n");
  expect(text).toContain("[JSON]");
  expect(text).toContain("[/JSON]");
});
