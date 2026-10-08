import { mount } from "@vue/test-utils";
import type { SurveyCreatorModel } from "survey-creator-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import FormBuilder from "../../src/components/FormBuilder.vue";
import SurveyResultRequiredToast from "../../src/components/SurveyResultRequiredToast.vue";
import SurveyResult from "../../src/components/templates/SurveyResult.vue";
import { createTestI18n, flush } from "./helpers.ts";

// The SurveyJS creator UI is replaced; the creator model behind it is real.
vi.mock("survey-creator-vue", async (original) => {
  const { defineComponent, h } = await import("vue");
  return {
    ...(await original<object>()),
    SurveyCreatorComponent: defineComponent({
      name: "SurveyCreatorStub",
      props: ["model"],
      render: () => h("div", { class: "creator-stub" }),
    }),
  };
});

const SURVEY = { elements: [{ type: "text", name: "score" }] };

/**
 * Mounts FormBuilder with v-model:json, as a host does.
 */
function setup(
  initial: object | undefined = SURVEY,
  { locale = "en", dir }: { locale?: string; dir?: "ltr" | "rtl" } = {},
) {
  const json = ref<object | undefined>(initial);
  const updates: object[] = [];
  const Host = defineComponent({
    setup: () => () =>
      h(FormBuilder, {
        json: json.value,
        dir,
        "onUpdate:json": (value: object | undefined) => {
          if (value) updates.push(value);
          json.value = value;
        },
      }),
  });
  const i18n = createTestI18n(locale);
  const wrapper = mount(Host, {
    global: { plugins: [i18n] },
    attachTo: document.body,
  });
  const creator = wrapper.findComponent({ name: "SurveyCreatorStub" }).props("model") as SurveyCreatorModel;
  const toastOpen = () => wrapper.findComponent(SurveyResultRequiredToast).props("open");
  const root = () => wrapper.get(".fb-root");
  return { wrapper, creator, json, updates, toastOpen, i18n, root };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("FormBuilder", () => {
  test("loads the v-model JSON into the creator", () => {
    const { creator } = setup();
    expect(creator.survey.getAllQuestions().map((q) => q.name)).toEqual(["score"]);
  });

  test("autosave hands the creator's JSON back through v-model", async () => {
    const { creator, updates } = setup();
    creator.survey.pages[0].addNewQuestion("text", "added");
    await flush();
    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual(creator.JSON);
    expect(JSON.stringify(updates[0])).toContain("added");
  });

  test("its own autosave does not reload the designer", async () => {
    const { creator } = setup();
    const before = creator.survey;
    creator.saveSurveyFunc(1, () => {});
    await flush();
    expect(creator.survey).toBe(before);
  });

  test("a new JSON from the host reloads the designer", async () => {
    const { creator, json } = setup();
    json.value = { elements: [{ type: "comment", name: "other" }] };
    await flush();
    expect(creator.survey.getAllQuestions().map((q) => q.name)).toEqual(["other"]);
  });

  test("reminds about a missing result template once, not on every autosave", async () => {
    const { creator, wrapper, toastOpen } = setup();
    expect(toastOpen()).toBe(false);

    creator.saveSurveyFunc(1, () => {});
    await nextTick();
    expect(toastOpen()).toBe(true);

    wrapper.findComponent(SurveyResultRequiredToast).vm.$emit("close");
    await nextTick();
    creator.saveSurveyFunc(2, () => {});
    await nextTick();
    expect(toastOpen()).toBe(false);
  });

  test("hides the reminder once a template exists", async () => {
    const { creator, toastOpen } = setup();
    creator.saveSurveyFunc(1, () => {});
    await nextTick();
    creator.survey.setPropertyValue("resultTemplate", { title: "Done" });
    creator.saveSurveyFunc(2, () => {});
    await nextTick();
    expect(toastOpen()).toBe(false);
  });

  test("does not remind when the survey has a template", async () => {
    const { creator, toastOpen } = setup({ ...SURVEY, resultTemplate: { title: "Done" } });
    creator.saveSurveyFunc(1, () => {});
    await nextTick();
    expect(toastOpen()).toBe(false);
  });

  test("shows the result template over a completed preview, with the score from the answers", async () => {
    // Where the creator's Preview tab renders its survey
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div class="svd-simulator-content"><div class="sd-root-modern"><div class="sv-scroll__wrapper" id="preview"></div></div></div>',
    );
    const { creator } = setup({
      ...SURVEY,
      resultTemplate: { title: "Your result", score: "score", min: 0, max: 100, statusLabels: ["Low", "High"] },
    });

    const preview = creator.createSurvey(creator.JSON, "preview-tab");
    preview.setValue("score", 80);
    preview.doComplete();
    await flush();

    const target = document.getElementById("preview")!;
    expect(target.textContent).toContain("Your result");
    expect(target.textContent).toContain("High");
    expect(preview.showCompletedPage).toBe(false);
  });

  test("a template saved in the result-template editor reaches the host's v-model", async () => {
    const { creator, wrapper, updates } = setup();
    creator.toolbar.getActionById("ui").action();
    await nextTick();
    const save = wrapper.findAll("button").find((b) => b.text() === "Save")!;
    await save.trigger("click");
    await nextTick();
    expect(updates.at(-1)).toMatchObject({ resultTemplate: { scoreDisplay: "default" } });
  });

  test("an edit reaches the host's v-model at once, not after the autosave delay", () => {
    // A host Save pressed within the creator's default 500 ms sent the survey
    // as it was before the last edit
    const { creator, updates } = setup();
    expect(creator.autoSaveDelay).toBe(0);
    creator.survey.title = "Edited";
    expect(updates.at(-1)).toMatchObject({ title: "Edited" });
  });

  test("registers its survey properties (icon, repetition, resultTemplate)", () => {
    const { creator } = setup({ ...SURVEY, icon: "Star", repetition: true });
    expect(creator.JSON).toMatchObject({ icon: "Star", repetition: true });
  });

  test("lays the designer out right to left in Persian", () => {
    const { creator, root } = setup(SURVEY, { locale: "fa" });
    expect(root().attributes("dir")).toBe("rtl");
    expect(creator.isRTL).toBe(true);
  });

  test("lays the designer out left to right in English", () => {
    const { creator, root } = setup(SURVEY, { locale: "en" });
    expect(root().attributes("dir")).toBe("ltr");
    expect(creator.isRTL).toBe(false);
  });

  test("follows a locale switch", async () => {
    const { creator, root, i18n } = setup(SURVEY, { locale: "en" });
    i18n.global.locale.value = "fa";
    await nextTick();
    expect(root().attributes("dir")).toBe("rtl");
    expect(creator.isRTL).toBe(true);

    i18n.global.locale.value = "en";
    await nextTick();
    expect(root().attributes("dir")).toBe("ltr");
    expect(creator.isRTL).toBe(false);
  });

  test("a dir prop wins over the locale", () => {
    const { creator, root } = setup(SURVEY, { locale: "fa", dir: "ltr" });
    expect(root().attributes("dir")).toBe("ltr");
    expect(creator.isRTL).toBe(false);
  });

  test("works without a v-model value", () => {
    expect(() => setup(undefined)).not.toThrow();
  });

  test("shows no result until a preview is completed", () => {
    const { wrapper } = setup();
    expect(wrapper.findComponent(SurveyResult).exists()).toBe(false);
  });
});
