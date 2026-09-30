import { TextareaJsonEditorModel } from "survey-creator-core";
import { SvgRegistry } from "survey-core";
import { ComponentFactory } from "survey-vue3-ui";
import { afterEach, describe, expect, test } from "vitest";
import { nextTick } from "vue";
import JsonEditorTab from "../../src/components/JsonEditorTab.vue";
import { formatJson, highlightJson } from "../../src/utils/jsonHighlight.ts";
import registerJsonEditor from "../../src/utils/registerJsonEditor.ts";
import { mountWithCreator, newCreator } from "./helpers.ts";

/** The tokens `highlightJson` marks, as [type, text] pairs. */
function tokens(text: string): [string, string][] {
  const el = document.createElement("div");
  el.innerHTML = highlightJson(text);
  return [...el.querySelectorAll("span")].map((s) => [
    s.className.replace("fb-json-", ""),
    s.textContent!,
  ]);
}

describe("highlightJson", () => {
  test("marks keys, values and punctuation", () => {
    expect(tokens('{"a": "x", "n": -1.5e3, "b": true, "z": null}')).toEqual([
      ["punctuation", "{"],
      ["key", '"a"'],
      ["punctuation", ":"],
      ["string", '"x"'],
      ["punctuation", ","],
      ["key", '"n"'],
      ["punctuation", ":"],
      ["number", "-1.5e3"],
      ["punctuation", ","],
      ["key", '"b"'],
      ["punctuation", ":"],
      ["boolean", "true"],
      ["punctuation", ","],
      ["key", '"z"'],
      ["punctuation", ":"],
      ["null", "null"],
      ["punctuation", "}"],
    ]);
  });

  test("marks the JSON5 the creator accepts: bare keys and comments", () => {
    expect(tokens("{ name: 'q1' // first\n}")).toEqual([
      ["punctuation", "{"],
      ["key", "name"],
      ["punctuation", ":"],
      ["string", "'q1'"],
      ["comment", "// first"],
      ["punctuation", "}"],
    ]);
  });

  test("keeps escaped quotes inside a string, and digits inside a word", () => {
    expect(tokens('["say \\"hi\\"", question1]')).toEqual([
      ["punctuation", "["],
      ["string", '"say \\"hi\\""'],
      ["punctuation", ","],
      ["punctuation", "]"],
    ]);
  });

  test("escapes HTML and keeps the text unchanged", () => {
    const text = '{"html": "<b>&amp;</b>", oops }';
    const el = document.createElement("div");
    el.innerHTML = highlightJson(text);
    expect(el.textContent).toBe(text);
    expect(el.querySelector("b")).toBeNull();
  });
});

describe("formatJson", () => {
  test("re-indents compact JSON", () => {
    expect(formatJson('{"a":[1,{"b":2}]}')).toBe(
      '{\n  "a": [\n    1,\n    {\n      "b": 2\n    }\n  ]\n}',
    );
    expect(formatJson('{"a":1}', 4)).toBe('{\n    "a": 1\n}');
  });

  test("writes strict JSON from JSON5", () => {
    expect(formatJson("{ a: 'x', /* c */ b: [1,], }")).toBe(
      '{\n  "a": "x",\n  "b": [\n    1\n  ]\n}',
    );
  });

  test("gives null for text that does not parse, or none", () => {
    expect(formatJson("{ not json")).toBeNull();
    expect(formatJson("")).toBeNull();
  });
});

describe("JsonEditorTab", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  function mountTab(json: object = { elements: [{ type: "text", name: "q1" }] }) {
    const creator = newCreator(json);
    creator.activeTab = "json";
    const model = new TextareaJsonEditorModel(creator);
    const mounted = mountWithCreator(JsonEditorTab, { creator, props: { model } });
    const textarea = mounted.child.find("textarea");
    const highlight = mounted.child.find(".fb-json-editor__highlight");
    return { ...mounted, model, textarea, highlight };
  }

  test("shows the creator's JSON, highlighted behind the textarea", () => {
    const { model, textarea, highlight } = mountTab();
    expect((textarea.element as HTMLTextAreaElement).value).toBe(model.text);
    expect(highlight.text().trim()).toBe(model.text);
    expect(highlight.findAll(".fb-json-key").map((k) => k.text())).toContain('"name"');
    expect(highlight.findAll(".fb-json-string").map((s) => s.text())).toContain('"q1"');
    expect(model.textElement).toBe(textarea.element);
  });

  test("typing updates the model and the highlight", async () => {
    const { model, textarea, highlight } = mountTab();
    await textarea.setValue('{"title": 5}');
    expect(model.text).toBe('{"title": 5}');
    expect(model.isJSONChanged).toBe(true);
    expect(highlight.find(".fb-json-number").text()).toBe("5");
  });

  test("the toolbar's Format JSON button re-indents the text", async () => {
    const { creator, model, textarea } = mountTab();
    await textarea.setValue('{"title":"T","elements":[]}');
    const action = creator.toolbar.getActionById("fb-json-format");
    expect(action.title).toBe("Format JSON (Shift+Alt+F)");
    expect(action.visible).toBe(true);

    action.action!();
    await nextTick();
    expect(model.text).toBe('{\n  "title": "T",\n  "elements": []\n}');
    expect((textarea.element as HTMLTextAreaElement).value).toBe(model.text);
  });

  test("Shift+Alt+F formats, and invalid JSON is left as it is", async () => {
    const { model, textarea } = mountTab();
    await textarea.setValue('{"a":1}');
    await textarea.trigger("keydown", { code: "KeyF", shiftKey: true, altKey: true });
    expect(model.text).toBe('{\n  "a": 1\n}');

    await textarea.setValue("{ broken");
    await textarea.trigger("keydown", { code: "KeyF", shiftKey: true, altKey: true });
    expect(model.text).toBe("{ broken");
  });

  test("Tab indents at the caret instead of leaving the editor", async () => {
    const { model, textarea } = mountTab();
    await textarea.setValue("{}");
    const el = textarea.element as HTMLTextAreaElement;
    el.selectionStart = el.selectionEnd = 1;
    await textarea.trigger("keydown", { key: "Tab" });
    expect(model.text).toBe("{  }");
    expect(el.selectionStart).toBe(3);
  });

  test("the button is shown on the JSON tab only, and goes with the editor", () => {
    const { creator, wrapper } = mountTab();
    const action = creator.toolbar.getActionById("fb-json-format");
    creator.activeTab = "designer";
    expect(action.visible).toBe(false);
    wrapper.unmount();
    expect(creator.toolbar.getActionById("fb-json-format")).toBeFalsy();
  });
});

test("registerJsonEditor replaces the creator's textarea JSON tab", () => {
  registerJsonEditor();
  expect(ComponentFactory.Instance.getComponent("svc-tab-json-editor-textarea")).toBe(
    JsonEditorTab,
  );
  expect(SvgRegistry.icons["fb-format-json"]).toContain("<symbol");
});
