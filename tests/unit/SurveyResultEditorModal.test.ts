import { afterEach, describe, expect, test, vi } from "vitest";
import useBlockDrag from "../../src/composables/useBlockDrag.ts";
import { defineComponent, h, nextTick } from "vue";
import SurveyResultEditor from "../../src/components/SurveyResultEditor.vue";
import SurveyResultEditorModal from "../../src/components/SurveyResultEditorModal.vue";
import ResultLayoutEditor from "../../src/components/ResultLayoutEditor.vue";
import SurveyResultRequiredToast from "../../src/components/SurveyResultRequiredToast.vue";
import Modal from "../../src/components/Modal.vue";
import SurveyResult from "../../src/components/templates/SurveyResult.vue";
import { surveyResultEditor } from "../../src/locales/index.ts";
import { provideSurveyResultTemplate } from "../../src/provider/surveyResultTemplate.ts";
import { getDefaultProps } from "../../src/schemas/templates.ts";
import { surveyResult } from "../../src/locales/index.ts";
import { legacyActions } from "../../src/utils/resultContent.ts";
import "../../src/utils/serilizers.ts";
import { mountWithCreator, newCreator, flush } from "./helpers.ts";
import { mount } from "@vue/test-utils";

const T = surveyResultEditor.en;

describe("SurveyResultEditorModal", () => {
  function setup({ json = {}, locale = "en", setup: extra }: { json?: object; locale?: string; setup?: () => void } = {}) {
    const creator = newCreator({ elements: [{ type: "text", name: "q" }], ...json });
    const mounted = mountWithCreator(SurveyResultEditorModal, { creator, locale, setup: extra });
    const open = async () => {
      creator.toolbar.getActionById("ui").action();
      await nextTick();
    };
    const button = (text: string) => mounted.child.findAll("button").find((b) => b.text() === text);
    return { ...mounted, open, button };
  }

  test("its toolbar button is named", () => {
    expect(setup().creator.toolbar.getActionById("ui").title).toBe(T.title);
    expect(setup({ locale: "fa" }).creator.toolbar.getActionById("ui").title).toBe(
      surveyResultEditor.fa.title,
    );
  });

  test("opens from its toolbar button", async () => {
    const { child, open } = setup();
    expect(child.findComponent(SurveyResultEditor).exists()).toBe(false);
    await open();
    expect(child.findComponent(SurveyResultEditor).exists()).toBe(true);
    expect(child.text()).toContain(T.title);
  });

  test("starts a new template from the current locale's defaults", async () => {
    for (const locale of ["en", "fa"]) {
      const { child, open } = setup({ locale });
      await open();
      expect(child.findComponent(SurveyResultEditor).props("props")).toEqual(getDefaultProps(locale));
    }
  });

  test("loads the stored template over the defaults", async () => {
    const { child, open } = setup({ json: { resultTemplate: { title: "Stored", max: 40 } } });
    await open();
    expect(child.findComponent(SurveyResultEditor).props("props")).toEqual({
      ...getDefaultProps("en"),
      title: "Stored",
      max: 40,
      // A template from before buttons were editable keeps the buttons it showed
      actions: legacyActions({}, surveyResult.en),
    });
    expect(child.findComponent(SurveyResult).props("title")).toBe("Stored");
  });

  test("saving writes a plain copy to the survey, emits apply and closes", async () => {
    const { child, open, button, creator } = setup();
    await open();
    child.findComponent(SurveyResultEditor).props("props").title = "Edited";
    await button(T.save)!.trigger("click");

    const saved = creator.survey.getPropertyValue("resultTemplate");
    expect(saved).toMatchObject({ title: "Edited" });
    expect(creator.JSON.resultTemplate).toMatchObject({ title: "Edited" });
    expect(child.emitted("apply")?.[0][0]).toEqual(saved);
    expect(child.findComponent(SurveyResultEditor).exists()).toBe(false);
  });

  test("saving tells the creator the survey changed, so it autosaves", async () => {
    const { open, button, creator } = setup();
    const modified = vi.fn();
    creator.onModified.add(modified);
    await open();
    await button(T.save)!.trigger("click");
    expect(modified).toHaveBeenCalledTimes(1);
    expect(modified.mock.calls[0][1]).toMatchObject({ type: "PROPERTY_CHANGED", name: "resultTemplate" });
    expect(creator.state).toBe("modified");
  });

  test("cancel and close leave the survey alone", async () => {
    const { child, open, button, creator } = setup();
    for (const close of [
      () => button(T.cancel)!,
      () => child.find(`button[aria-label="${surveyResultEditor.en.close}"]`),
    ]) {
      await open();
      child.findComponent(SurveyResultEditor).props("props").title = "Discarded";
      await close().trigger("click");
      expect(child.findComponent(SurveyResultEditor).exists()).toBe(false);
      expect(creator.JSON.resultTemplate).toBeUndefined();
    }
    expect(child.emitted("close")).toHaveLength(2);
  });

  test("uses a provided template component and editor", async () => {
    const Preview = defineComponent({ props: ["title"], render: () => h("div", { class: "custom-preview" }) });
    const Editor = defineComponent({ props: ["props"], render: () => h("div", { class: "custom-editor" }) });
    const { child, open } = setup({
      setup: () => provideSurveyResultTemplate({ id: "custom", component: Preview, editor: Editor }),
    });
    await open();
    expect(child.find(".custom-preview").exists()).toBe(true);
    expect(child.find(".custom-editor").exists()).toBe(true);
    expect(child.findComponent(SurveyResultEditor).exists()).toBe(false);
  });
});

describe("SurveyResultRequiredToast", () => {
  function setup(open: boolean, locale = "en") {
    const creator = newCreator();
    const configure = vi.fn();
    creator.toolbar.addAction({ id: "ui", action: configure });
    const mounted = mountWithCreator(SurveyResultRequiredToast, { creator, locale, props: { open } });
    return { ...mounted, configure };
  }

  test("renders only when open", () => {
    expect(setup(false).child.text()).toBe("");
    expect(setup(true).child.text()).toContain(T.resultTemplateRequired.title);
  });

  test("its dismiss button is labelled and emits close", async () => {
    const { child } = setup(true);
    const dismiss = child.find(`button[aria-label="${T.resultTemplateRequired.dismiss}"]`);
    expect(dismiss.exists()).toBe(true);
    await dismiss.trigger("click");
    expect(child.emitted("close")).toHaveLength(1);
  });

  test("configure closes it and opens the result-template editor", async () => {
    const { child, configure } = setup(true);
    const button = child.findAll("button").find((b) => b.text() === T.resultTemplateRequired.configure)!;
    await button.trigger("click");
    expect(child.emitted("close")).toHaveLength(1);
    expect(configure).toHaveBeenCalled();
  });

  test("is translated", () => {
    expect(setup(true, "fa").child.text()).toContain(surveyResultEditor.fa.resultTemplateRequired.title);
  });
});

describe("Modal", () => {
  function render(modelValue: boolean) {
    return mount(Modal, {
      props: { modelValue, "onUpdate:modelValue": vi.fn() },
      slots: { default: () => h("p", { class: "content" }, "Hello") },
    });
  }

  test("shows the backdrop only when open, and always renders its slot", () => {
    expect(render(false).find(".backdrop").exists()).toBe(false);
    const open = render(true);
    expect(open.find(".backdrop").exists()).toBe(true);
    expect(open.find(".content").text()).toBe("Hello");
  });

  test("clicking the backdrop closes it", async () => {
    const wrapper = render(true);
    await wrapper.find(".backdrop").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });
});

describe("SurveyResultEditorModal's layout", () => {
  async function opened(json: object = {}) {
    const creator = newCreator({ elements: [{ type: "text", name: "q" }], ...json });
    const mounted = mountWithCreator(SurveyResultEditorModal, { creator });
    creator.toolbar.getActionById("ui").action();
    await nextTick();
    const preview = () => mounted.child.findComponent(SurveyResult);
    const editor = () => mounted.child.findComponent(SurveyResultEditor);
    const panel = () => mounted.child.findComponent(ResultLayoutEditor);
    const canvas = (id: string) => preview().find(`[data-block-id="${id}"]`);
    const save = () => mounted.child.findAll("button").find((b) => b.text() === T.save)!.trigger("click");
    return { ...mounted, preview, editor, panel, canvas, save };
  }

  const ids = (layout: unknown) => (layout as { id: string }[]).map((b) => b.id);

  test("a block dragged on the preview moves in the panel too, and is saved", async () => {
    const { canvas, panel, save, creator } = await opened();
    await canvas("actions").trigger("dragstart");
    await flush();
    await canvas("hero").trigger("dragover");
    await canvas("hero").trigger("drop");
    // After the banner slot, empty here and so not on the preview
    expect(ids(panel().props("modelValue")).slice(0, 3)).toEqual(["images-banner", "actions", "hero"]);

    await save();
    expect(ids(creator.JSON.resultTemplate.layout).slice(0, 3)).toEqual(["images-banner", "actions", "hero"]);
  });

  test("a block picked on the preview opens in the panel, and the other way round", async () => {
    const { canvas, panel, child } = await opened();
    await canvas("score").trigger("click");
    expect(panel().props("selected")).toBe("score");
    expect(child.find('li[data-block-id="score"] button[aria-expanded]').attributes("aria-expanded")).toBe("true");

    await child.find('li[data-block-id="hero"] button[aria-expanded]').trigger("click");
    expect(canvas("hero").attributes("aria-current")).toBe("true");
  });

  test("an HTML block added in the panel shows on the preview as it is typed", async () => {
    const { child, preview, save, creator } = await opened();
    await child.find('[data-palette="html"]').trigger("click");
    const textarea = child.find("textarea");
    await textarea.setValue('<p>Hello <script>x</script><a href="javascript:x">there</a></p>');
    const html = preview().find(".fb-result-html");
    expect(html.text()).toBe("Hello there");
    expect(html.find("script").exists()).toBe(false);
    expect(html.find("a").attributes("href")).toBeUndefined();

    await save();
    // The author's markup is stored as written; it is sanitized wherever it is shown
    const stored = creator.JSON.resultTemplate.layout.find((b: { type: string }) => b.type === "html");
    expect(stored.html).toContain("<script>x</script>");
  });

  test("hiding on the preview is saved with the template", async () => {
    const { canvas, save, creator } = await opened();
    await canvas("note").find(`button[aria-label^="${surveyResult.en.canvas.hide}"]`).trigger("click");
    await save();
    expect(creator.JSON.resultTemplate.layout.find((b: { id: string }) => b.id === "note")).toEqual({
      id: "note",
      type: "note",
      hidden: true,
    });
  });

  test("loads a stored layout, cleaned up", async () => {
    const { panel } = await opened({
      resultTemplate: {
        layout: [{ id: "score", type: "score" }, { type: "html", html: "<p>x</p>" }, { type: "bogus" }],
      },
    });
    expect(panel().props("modelValue")).toEqual([
      { id: "score", type: "score" },
      { id: "html-1", type: "html", html: "<p>x</p>" },
    ]);
  });

  test("forgets the selection when it is opened again", async () => {
    const { canvas, panel, creator } = await opened();
    await canvas("score").trigger("click");
    creator.toolbar.getActionById("ui").action();
    await nextTick();
    creator.toolbar.getActionById("ui").action();
    await nextTick();
    expect(panel().props("selected")).toBeNull();
  });
});

// The drag in progress is shared across the page: none outlives a test
afterEach(() => useBlockDrag().end());
