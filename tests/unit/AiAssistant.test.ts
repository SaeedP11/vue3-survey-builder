import { describe, expect, test, vi } from "vitest";
import { nextTick } from "vue";
import AiAssistant from "../../src/components/AiAssistant.vue";
import { provideAiAssistantConfig } from "../../src/provider/aiAssistantConfig.ts";
import type { SurveyAiAssitantConfig } from "../../src/types/index.ts";
import { flush, mountWithCreator, newCreator } from "./helpers.ts";

const GENERATED = { elements: [{ type: "text", name: "generated" }] };
const EXISTING = { elements: [{ type: "text", name: "existing" }] };

function setup(onSubmit: SurveyAiAssitantConfig["onSubmit"], locale = "en") {
  const creator = newCreator(EXISTING);
  const mounted = mountWithCreator(AiAssistant, {
    creator,
    locale,
    setup: () => provideAiAssistantConfig({ onSubmit }),
  });
  const open = async () => {
    creator.toolbar.getActionById("chat-ai").action();
    await nextTick();
  };
  const submit = async (prompt: string) => {
    await mounted.wrapper.find("textarea").setValue(prompt);
    await mounted.wrapper.find("button.submit-button").trigger("click");
  };
  const questionNames = () => creator.survey.getAllQuestions().map((q) => q.name);
  return { ...mounted, open, submit, questionNames };
}

describe("AiAssistant", () => {
  test("its toolbar button is named in the current language", async () => {
    const en = setup(vi.fn(), "en");
    expect(en.creator.toolbar.getActionById("chat-ai").title).toBe("AI assistant");
    en.i18n.global.locale.value = "fa";
    await nextTick();
    expect(en.creator.toolbar.getActionById("chat-ai").title).toBe("دستیار هوش مصنوعی");
  });

  test("adds a toolbar button that toggles the prompt box", async () => {
    const { wrapper, creator, open } = setup(vi.fn());
    expect(creator.toolbar.getActionById("chat-ai")).toBeTruthy();
    expect(wrapper.find("textarea").exists()).toBe(false);
    await open();
    expect(wrapper.find("textarea").exists()).toBe(true);
    await open();
    expect(wrapper.find("textarea").exists()).toBe(false);
  });

  test("awaits an async onSubmit and loads the schema it returns", async () => {
    let resolve!: (json: object) => void;
    const onSubmit = vi.fn(() => new Promise<object>((r) => (resolve = r)));
    const { wrapper, open, submit, questionNames } = setup(onSubmit);
    await open();
    await submit("a form about sleep");

    expect(onSubmit).toHaveBeenCalledWith("a form about sleep");
    // Still waiting: the form is untouched and the button shows progress
    expect(questionNames()).toEqual(["existing"]);
    const button = wrapper.find("button.submit-button");
    expect(button.attributes("disabled")).toBeDefined();
    expect(button.text()).toBe("Designing...");

    resolve(GENERATED);
    await flush();
    expect(questionNames()).toEqual(["generated"]);
    expect(wrapper.find("textarea").exists()).toBe(false);
  });

  test("accepts a schema returned synchronously", async () => {
    const { open, submit, questionNames } = setup(() => GENERATED);
    await open();
    await submit("x");
    await flush();
    expect(questionNames()).toEqual(["generated"]);
  });

  test("leaves the form alone when onSubmit returns undefined", async () => {
    const { wrapper, open, submit, questionNames } = setup(async () => undefined);
    await open();
    await submit("x");
    await flush();
    expect(questionNames()).toEqual(["existing"]);
    expect(wrapper.find("textarea").exists()).toBe(false);
  });

  test("leaves the form alone and recovers when onSubmit throws", async () => {
    const { wrapper, open, submit, questionNames } = setup(async () => {
      throw new Error("network down");
    });
    await open();
    await submit("x");
    await flush();
    expect(questionNames()).toEqual(["existing"]);
    await open();
    expect(wrapper.find("button.submit-button").attributes("disabled")).toBeUndefined();
  });

  test("ignores an empty prompt", async () => {
    const onSubmit = vi.fn();
    const { open, submit } = setup(onSubmit);
    await open();
    await submit("");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("sends one request while one is running", async () => {
    const onSubmit = vi.fn(() => new Promise<object>(() => {}));
    const { wrapper, open, submit } = setup(onSubmit);
    await open();
    await submit("x");
    await wrapper.find("button.submit-button").trigger("click");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("is translated", async () => {
    const en = setup(vi.fn(), "en");
    await en.open();
    const fa = setup(vi.fn(), "fa");
    await fa.open();
    const placeholder = (s: typeof en) => s.wrapper.find("textarea").attributes("placeholder");
    expect(placeholder(en)).toMatch(/form/i);
    expect(placeholder(fa)).not.toBe(placeholder(en));
    expect(fa.wrapper.find("button.submit-button").text()).toBe("ایجاد");
  });
});
