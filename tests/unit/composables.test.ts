import { mount } from "@vue/test-utils";
import { Model, SurveyModel, type Question } from "survey-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import { defineComponent, effectScope, h, nextTick, ref } from "vue";
import useColorMode from "../../src/composables/useColorMode.ts";
import useCreatorEvent from "../../src/composables/useCreatorEvent.ts";
import useCreatorToolbarAction from "../../src/composables/useCreatorToolbarAction.ts";
import useScrollToError from "../../src/composables/useScrollToError.ts";
import { useSurveyModel } from "../../src/composables/useSurveyModel.ts";
import { createTestI18n, flush, newCreator } from "./helpers.ts";

afterEach(() => {
  document.documentElement.classList.remove("dark");
});

describe("useColorMode", () => {
  test("starts from the dark class on <html> and follows it", async () => {
    document.documentElement.classList.add("dark");
    const scope = effectScope();
    const { isDark } = scope.run(() => useColorMode())!;
    expect(isDark.value).toBe(true);

    document.documentElement.classList.remove("dark");
    await flush();
    expect(isDark.value).toBe(false);
    scope.stop();
  });

  test("stops observing when its scope is disposed", async () => {
    const scope = effectScope();
    const { isDark } = scope.run(() => useColorMode())!;
    scope.stop();

    document.documentElement.classList.add("dark");
    await flush();
    expect(isDark.value).toBe(false);
  });

  test("works outside a scope", () => {
    expect(() => useColorMode()).not.toThrow();
  });
});

describe("useScrollToError", () => {
  function surveyWithScrollSpies() {
    const survey = new Model({
      elements: [
        { type: "text", name: "first", isRequired: true },
        { type: "text", name: "second", isRequired: true },
        { type: "text", name: "third" },
      ],
    });
    const spies = Object.fromEntries(
      ["first", "second", "third"].map((name) => {
        const el = document.createElement("div");
        el.scrollIntoView = vi.fn();
        vi.spyOn(survey.getQuestionByName(name) as Question, "getWrapperElement").mockReturnValue(el);
        return [name, el.scrollIntoView as ReturnType<typeof vi.fn>];
      }),
    );
    useScrollToError(survey);
    return { survey, spies };
  }

  test("scrolls once, to the first invalid question", () => {
    const { survey, spies } = surveyWithScrollSpies();
    survey.completeLastPage();
    expect(spies.first).toHaveBeenCalledTimes(1);
    expect(spies.second).not.toHaveBeenCalled();
  });

  test("scrolls to the next invalid question once the first is answered", () => {
    const { survey, spies } = surveyWithScrollSpies();
    survey.setValue("first", "x");
    survey.completeLastPage();
    expect(spies.first).not.toHaveBeenCalled();
    expect(spies.second).toHaveBeenCalledTimes(1);
  });

  test("does nothing on a valid page", () => {
    const { survey, spies } = surveyWithScrollSpies();
    survey.setValue("first", "x");
    survey.setValue("second", "y");
    survey.completeLastPage();
    expect(Object.values(spies).every((s) => s.mock.calls.length === 0)).toBe(true);
    expect(survey.state).toBe("completed");
  });

  test("tolerates a question that is not rendered", () => {
    const survey = new Model({ elements: [{ type: "text", name: "q", isRequired: true }] });
    useScrollToError(survey);
    expect(() => survey.completeLastPage()).not.toThrow();
  });
});

describe("useSurveyModel", () => {
  function mountSurvey(json: object | undefined, locale = "en") {
    let survey!: SurveyModel;
    const i18n = createTestI18n(locale);
    const wrapper = mount(
      defineComponent({
        setup() {
          survey = useSurveyModel(json);
          return () => h("div");
        },
      }),
      { global: { plugins: [i18n] } },
    );
    return { survey, i18n, wrapper };
  }

  test("builds a survey from the JSON", () => {
    const { survey } = mountSurvey({ elements: [{ type: "text", name: "q" }] });
    expect(survey).toBeInstanceOf(SurveyModel);
    expect(survey.getQuestionByName("q")).toBeTruthy();
  });

  test("builds an empty survey without JSON", () => {
    const { survey } = mountSurvey(undefined);
    expect(survey.getAllQuestions()).toHaveLength(0);
  });

  test("follows vue-i18n's locale", async () => {
    const { survey, i18n } = mountSurvey({}, "fa");
    expect(survey.locale).toBe("fa");
    const persianComplete = survey.completeText;

    i18n.global.locale.value = "en";
    await flush();
    // SurveyJS reports its default locale, English, as ""
    expect(survey.locale).toBe("");
    expect(survey.completeText).toBe("Complete");
    expect(persianComplete).not.toBe("Complete");
  });

  test("applies the dark or light theme with the dark class", async () => {
    const applyTheme = vi.spyOn(SurveyModel.prototype, "applyTheme");
    mountSurvey({});
    expect(applyTheme.mock.lastCall?.[0]).toMatchObject({ colorPalette: "light", isPanelless: true });

    document.documentElement.classList.add("dark");
    await flush();
    expect(applyTheme.mock.lastCall?.[0]).toMatchObject({ colorPalette: "dark", isPanelless: true });
  });

  test("wires scroll-to-error", () => {
    const { survey } = mountSurvey({ elements: [{ type: "text", name: "q", isRequired: true }] });
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();
    vi.spyOn(survey.getQuestionByName("q"), "getWrapperElement").mockReturnValue(el);
    survey.completeLastPage();
    expect(el.scrollIntoView).toHaveBeenCalled();
  });
});

describe("useCreatorToolbarAction", () => {
  test("adds the action, replacing one with the same id, and removes it on dispose", () => {
    const creator = newCreator();
    const scope = effectScope();
    scope.run(() => {
      useCreatorToolbarAction(creator, { id: "fb-test", title: "One" });
      useCreatorToolbarAction(creator, { id: "fb-test", title: "Two" });
    });
    const matching = creator.toolbar.actions.filter((a) => a.id === "fb-test");
    expect(matching.map((a) => a.title)).toEqual(["Two"]);

    scope.stop();
    expect(creator.toolbar.getActionById("fb-test")).toBeFalsy();
  });

  test("names an icon-only button, following the title as it changes", async () => {
    const creator = newCreator();
    const title = ref("First");
    const scope = effectScope();
    scope.run(() => useCreatorToolbarAction(creator, { id: "fb-named", iconName: "x" }, () => title.value));
    const action = creator.toolbar.getActionById("fb-named");
    expect(action.title).toBe("First");
    expect(action.showTitle).toBe(false);

    title.value = "Second";
    await nextTick();
    expect(action.title).toBe("Second");
    scope.stop();
  });
});

describe("useCreatorEvent", () => {
  test("subscribes while its scope lives", () => {
    const creator = newCreator();
    const handler = vi.fn();
    const scope = effectScope();
    scope.run(() => useCreatorEvent(creator.onModified, handler));

    creator.onModified.fire(creator, {} as never);
    expect(handler).toHaveBeenCalledTimes(1);

    scope.stop();
    creator.onModified.fire(creator, {} as never);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
