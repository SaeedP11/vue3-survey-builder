import { mount } from "@vue/test-utils";
import { SurveyCreatorModel } from "survey-creator-core";
import { describe, expect, test, vi } from "vitest";
import { defineComponent, h, ref, type Component } from "vue";
import {
  provideAiAssistantConfig,
  useSurveyAiAssistantConfig,
} from "../../src/provider/aiAssistantConfig.ts";
import {
  provideRecurringSurveyHelpers,
  useRecurringSurveyHelpers,
} from "../../src/provider/recurringSurveyHandlers.ts";
import { initSurveyCreator, useSurveyCreator } from "../../src/provider/surveyCreator.ts";
import {
  provideSurveyResultTemplate,
  useSurveyResultTemplate,
} from "../../src/provider/surveyResultTemplate.ts";
import { surveyResultTemplate } from "../../src/schemas/templates.ts";
import type { RecurringSurveyHandlers } from "../../src/types/index.ts";
import { createTestI18n, flush } from "./helpers.ts";

/** Runs `provide` in a parent and `use` in its child; returns what `use` gave. */
function provideAndUse<T>(provide: (() => void) | null, use: () => T, locale = "en") {
  let result!: T;
  const Child = defineComponent({
    setup() {
      result = use();
      return () => null;
    },
  });
  const Parent = defineComponent({
    setup() {
      provide?.();
      return () => h(Child as Component);
    },
  });
  const i18n = createTestI18n(locale);
  mount(Parent, { global: { plugins: [i18n] } });
  return { result, i18n };
}

describe("AI assistant config", () => {
  test("without a provider, onSubmit warns and leaves the form alone (undefined)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = provideAndUse(null, useSurveyAiAssistantConfig);
    expect(await result.onSubmit("prompt")).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  test("hands descendants the provided config", () => {
    const config = { onSubmit: vi.fn() };
    const { result } = provideAndUse(() => provideAiAssistantConfig(config), useSurveyAiAssistantConfig);
    expect(result).toBe(config);
  });
});

describe("survey creator", () => {
  test("useSurveyCreator throws without a provider", () => {
    expect(() => provideAndUse(null, useSurveyCreator)).toThrow(/without/);
  });

  test("initSurveyCreator(model) provides that model", () => {
    const model = new SurveyCreatorModel({});
    const { result } = provideAndUse(() => initSurveyCreator(model), useSurveyCreator);
    expect(result).toBe(model);
  });

  test("initSurveyCreator() makes a creator that follows vue-i18n's locale", async () => {
    const { result: creator, i18n } = provideAndUse(() => initSurveyCreator(), useSurveyCreator, "fa");
    expect(creator).toBeInstanceOf(SurveyCreatorModel);
    expect(creator.locale).toBe("fa");
    expect(creator.showTranslationTab).toBe(true);
    expect(creator.showThemeTab).toBe(false);

    i18n.global.locale.value = "en";
    await flush();
    expect(creator.locale).toBe("en");
  });

  test("initSurveyCreator() switches the creator theme with the dark class", async () => {
    const { result: creator } = provideAndUse(() => initSurveyCreator(), useSurveyCreator);
    const light = JSON.stringify(creator.creatorTheme?.cssVariables);
    document.documentElement.classList.add("dark");
    await flush();
    expect(JSON.stringify(creator.creatorTheme?.cssVariables)).not.toBe(light);
    document.documentElement.classList.remove("dark");
  });
});

describe("survey result template", () => {
  test("defaults to the built-in template", () => {
    const { result } = provideAndUse(null, useSurveyResultTemplate);
    expect(result).toBe(surveyResultTemplate);
  });

  test("hands descendants the provided template", () => {
    const custom = { id: "custom", component: defineComponent({ render: () => null }) };
    const { result } = provideAndUse(() => provideSurveyResultTemplate(custom), useSurveyResultTemplate);
    expect(result).toBe(custom);
  });
});

describe("recurring survey helpers", () => {
  test("throw without a provider", () => {
    expect(() => provideAndUse(null, useRecurringSurveyHelpers)).toThrow();
  });

  test("hand descendants the provided handlers", () => {
    const handlers: RecurringSurveyHandlers = {
      data: ref([]),
      loading: ref(false),
      currentPage: ref(1),
      totalPages: ref(1),
      handleNextPage: vi.fn(),
      handlePrevPage: vi.fn(),
      refresh: vi.fn(),
    };
    const { result } = provideAndUse(
      () => provideRecurringSurveyHelpers(handlers),
      useRecurringSurveyHelpers,
    );
    expect(result).toBe(handlers);
  });
});
