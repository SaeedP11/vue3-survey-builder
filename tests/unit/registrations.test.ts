import { mount } from "@vue/test-utils";
import {
  ElementFactory,
  Model,
  Serializer,
  type PopupModel,
  type Question,
} from "survey-core";
import {
  QuestionAdornerViewModel,
  SurveyLogic,
  editorLocalization,
} from "survey-creator-core";
import { describe, expect, test, vi } from "vitest";
import { defineComponent, ref } from "vue";
import AsyncDropdown from "../../src/components/AsyncDropdown.vue";
import AdvancedTextInputPopup from "../../src/components/AdvancedTextInputPopup.vue";
import registerAdvancedTextInput from "../../src/utils/registerAdvancedTextInput.ts";
import registerAsyncDropdown from "../../src/utils/registerAsyncDropdown.ts";
import registerCustomLogic from "../../src/utils/registerCustomLogic.ts";
import handleComplete from "../../src/utils/handleComplete.ts";
import type { AsyncDropdownHandlers, ItemType } from "../../src/types/index.ts";
import "../../src/utils/serilizers.ts";
import { newCreator } from "./helpers.ts";

function handlers(overrides: Partial<AsyncDropdownHandlers> = {}): AsyncDropdownHandlers {
  return {
    items: ref<ItemType[]>([{ value: "IR", text: "Iran" }]),
    currentPage: ref(1),
    totalPages: ref(1),
    handleSearch: vi.fn(),
    handleNextPage: vi.fn(),
    handlePrevPage: vi.fn(),
    ...overrides,
  };
}

/** Runs `register` inside a component's setup, as the helpers require. */
function inSetup(register: () => void) {
  const wrapper = mount(
    defineComponent({
      setup() {
        register();
        return () => null;
      },
    }),
  );
  return wrapper.vm.$.appContext;
}

describe("survey properties (serilizers.ts)", () => {
  test("icon, repetition and resultTemplate round-trip through JSON", () => {
    const json = {
      icon: "HeartPulse",
      repetition: true,
      resultTemplate: { title: "Done", score: "s" },
      elements: [{ type: "text", name: "q" }],
    };
    const survey = new Model(json);
    expect(survey.icon).toBe("HeartPulse");
    expect(survey.toJSON()).toMatchObject({
      icon: "HeartPulse",
      repetition: true,
      resultTemplate: { title: "Done", score: "s" },
    });
  });

  test("repetition defaults to false, and resultTemplate is hidden from the property grid", () => {
    expect(new Model({}).repetition).toBe(false);
    expect(Serializer.findProperty("survey", "resultTemplate").visible).toBe(false);
  });

  test("repetition has a label in both languages", () => {
    expect(editorLocalization.getLocale("en").pe.repetition).toBeTruthy();
    expect(editorLocalization.getLocale("fa").pe.repetition).toBeTruthy();
  });
});

describe("registerAsyncDropdown", () => {
  test("needs a component's setup()", () => {
    expect(() => registerAsyncDropdown("asyncOutside", handlers())).toThrow(/setup\(\)/);
  });

  test("registers the question type, its JSON class and its component", () => {
    const h = handlers();
    const app = inSetup(() => registerAsyncDropdown("asyncCountry", h));

    expect(app.components["survey-asyncCountry"]).toBe(AsyncDropdown);
    expect(ElementFactory.Instance.getAllTypes()).toContain("asyncCountry");
    expect(Serializer.findClass("asyncCountry")).toBeTruthy();

    const survey = new Model({ elements: [{ type: "asyncCountry", name: "country" }] });
    const question = survey.getQuestionByName("country") as Question & {
      handlers: AsyncDropdownHandlers;
    };
    expect(question.getType()).toBe("asyncCountry");
    expect(question.handlers).toBe(h);

    question.value = "IR";
    expect(survey.data).toEqual({ country: "IR" });
    expect(survey.toJSON().pages[0].elements[0]).toMatchObject({
      type: "asyncCountry",
      name: "country",
    });
  });
});

describe("registerAdvancedTextInput", () => {
  test("needs a component's setup()", () => {
    expect(() => registerAdvancedTextInput("advOutside", handlers())).toThrow(/setup\(\)/);
  });

  test("renders as a text input but keeps its own type in JSON", () => {
    inSetup(() => registerAdvancedTextInput("advCode", handlers()));
    const survey = new Model({ elements: [{ type: "advCode", name: "code" }] });
    const question = survey.getQuestionByName("code");
    expect(question.getType()).toBe("advCode");
    expect(question.getTemplate()).toBe("text");
    expect((question as unknown as { getCssType(): string }).getCssType()).toBe("text");
    expect(survey.toJSON().pages[0].elements[0].type).toBe("advCode");
  });

  test("registers its popup component on the app", () => {
    const app = inSetup(() => registerAdvancedTextInput("advPopup", handlers()));
    expect(app.components["survey-text-input-popup"]).toBe(AdvancedTextInputPopup);
  });

  test("swaps the designer's type button for the async list, for its questions only", () => {
    const onSelect = vi.fn((question: Question, item: ItemType) => {
      question.title = item.text;
    });
    const h = handlers({ onSelect });
    inSetup(() => registerAdvancedTextInput("advCountry", h));
    const creator = newCreator({
      elements: [
        { type: "advCountry", name: "fav" },
        { type: "text", name: "plain" },
      ],
    });

    const convertAction = (name: string) =>
      new QuestionAdornerViewModel(
        creator,
        creator.survey.getQuestionByName(name),
        undefined as never,
      ).actionContainer.getActionById("convertInputType");

    const custom = convertAction("fav");
    const popup = custom.popupModel as PopupModel;
    expect(popup.contentComponentName).toBe("survey-text-input-popup");
    const model = popup.contentComponentData.model;
    expect(model.handlers).toBe(h);
    expect(model.popupModel).toBe(popup);

    // Picking an item retitles the action; the popup component then calls onSelect
    model.onItemSelected({ value: "IR", text: "Iran" });
    expect(custom.title).toBe("Iran");
    expect(model.selected.value).toEqual({ value: "IR", text: "Iran" });

    // A plain text question keeps SurveyJS's own input-type list
    const plain = convertAction("plain");
    expect((plain?.popupModel as PopupModel | undefined)?.contentComponentName).not.toBe(
      "survey-text-input-popup",
    );
  });
});

describe("registerCustomLogic", () => {
  test("adds a trigger type that round-trips through JSON", () => {
    registerCustomLogic({ type: "notifyJson", locales: { en: { displayName: "Notify" } } });
    const survey = new Model({
      elements: [{ type: "text", name: "q" }],
      triggers: [{ type: "notifyJson", expression: "{q} = 1" }],
    });
    // SurveyJS's own naming: { type: "complete" } is the class "completetrigger"
    expect(survey.triggers).toHaveLength(1);
    expect(survey.triggers[0].getType()).toBe("notifyJsontrigger");
    expect(survey.toJSON().triggers).toEqual([{ type: "notifyJson", expression: "{q} = 1" }]);
  });

  test("a trigger added the way the Logic tab does survives a save and reload", () => {
    registerCustomLogic({ type: "notifyTabSave", locales: { en: { displayName: "N" } } });
    const entry = SurveyLogic.types.find((t) => t.name === "trigger_notifyTabSave")!;

    const survey = new Model({ elements: [{ type: "text", name: "q" }] });
    const trigger = Serializer.createClass(entry.baseClass);
    trigger.expression = "{q} = 2";
    survey.triggers.push(trigger);

    const reloaded = new Model(survey.toJSON());
    expect(reloaded.triggers.map((t) => t.getType())).toEqual(["notifyTabSavetrigger"]);
    expect(reloaded.toJSON().triggers).toEqual([{ type: "notifyTabSave", expression: "{q} = 2" }]);
  });

  test("lists the trigger in the Logic tab once", () => {
    registerCustomLogic({ type: "notifyTab", locales: { en: { displayName: "Notify" } } });
    registerCustomLogic({ type: "notifyTab", locales: { en: { displayName: "Notify" } } });
    const entries = SurveyLogic.types.filter((t) => t.name === "trigger_notifyTab");
    expect(entries).toEqual([
      expect.objectContaining({ baseClass: "notifyTabtrigger", propertyName: "expression" }),
    ]);
  });

  test("adds the display strings per locale", () => {
    registerCustomLogic({
      type: "notifyText",
      locales: {
        en: { displayName: "Notify", description: "Sends a note" },
        fa: { displayName: "اعلان" },
      },
    });
    expect(editorLocalization.getString("lg.trigger_notifyTextName")).toBe("Notify");
    expect(editorLocalization.getString("lg.trigger_notifyTextDescription")).toBe("Sends a note");
    expect(editorLocalization.getLocale("fa").lg.trigger_notifyTextName).toBe("اعلان");
  });

  test("calls onFire when the expression turns true, with the survey and expression", () => {
    const onFire = vi.fn();
    registerCustomLogic({ type: "notifyFire", locales: { en: { displayName: "N" } }, onFire });
    const survey = new Model({
      elements: [{ type: "text", name: "q" }],
      triggers: [{ type: "notifyFire", expression: "{q} = 10" }],
    });

    survey.setValue("q", 3);
    expect(onFire).not.toHaveBeenCalled();
    survey.setValue("q", 10);
    expect(onFire).toHaveBeenCalledTimes(1);
    expect(onFire.mock.calls[0][0]).toMatchObject({ survey, expression: "{q} = 10" });
  });

  test("registering again replaces onFire without adding a second class", () => {
    const first = vi.fn();
    const second = vi.fn();
    registerCustomLogic({ type: "notifySwap", locales: { en: { displayName: "N" } }, onFire: first });
    registerCustomLogic({ type: "notifySwap", locales: { en: { displayName: "N" } }, onFire: second });
    const survey = new Model({
      elements: [{ type: "text", name: "q" }],
      triggers: [{ type: "notifySwap", expression: "{q} = 1" }],
    });
    survey.setValue("q", 1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test("works without onFire (JSON only)", () => {
    registerCustomLogic({ type: "notifySilent", locales: { en: { displayName: "N" } } });
    const survey = new Model({
      elements: [{ type: "text", name: "q" }],
      triggers: [{ type: "notifySilent", expression: "{q} = 1" }],
    });
    expect(() => survey.setValue("q", 1)).not.toThrow();
  });
});

describe("handleComplete", () => {
  test("calls back when a survey the creator makes is completed", () => {
    const creator = newCreator({ elements: [{ type: "text", name: "q" }] });
    const callback = vi.fn();
    handleComplete(creator, callback);

    const preview = creator.createSurvey({ elements: [{ type: "text", name: "q" }] }, "preview-tab");
    preview.setValue("q", "answer");
    preview.doComplete();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].data).toEqual({ q: "answer" });
  });
});
