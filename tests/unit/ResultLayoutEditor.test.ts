import { afterEach, describe, expect, test, vi } from "vitest";
import useBlockDrag from "../../src/composables/useBlockDrag.ts";
import { defineComponent, h, nextTick, ref } from "vue";
import ResultLayoutEditor from "../../src/components/ResultLayoutEditor.vue";
import { surveyResultEditor } from "../../src/locales/index.ts";
import type { ResultBlock } from "../../src/types/index.ts";
import { MAX_BLOCKS, MAX_HTML_LENGTH, defaultLayout } from "../../src/utils/resultLayout.ts";
import { mountWithCreator, flush } from "./helpers.ts";

const T = surveyResultEditor.en;

interface Options {
  layout?: ResultBlock[];
  selected?: string | null;
  statusLabels?: string[];
  variables?: string[];
  emptyIds?: string[];
  locale?: string;
}

/** The panel under a host that keeps its v-models, as the editor does. */
function setup({
  layout: initial = defaultLayout(),
  selected: initialSelected = null,
  statusLabels = ["Low", "High"],
  variables = ["age", "riskScore"],
  emptyIds = [],
  locale = "en",
}: Options = {}) {
  const layout = ref<ResultBlock[]>(initial);
  const selected = ref<string | null>(initialSelected);
  const Host = defineComponent({
    setup() {
      return () =>
        h(ResultLayoutEditor, {
          modelValue: layout.value,
          "onUpdate:modelValue": (v: ResultBlock[]) => (layout.value = v),
          selected: selected.value,
          "onUpdate:selected": (v: string | null) => (selected.value = v),
          statusLabels,
          variables,
          emptyIds,
        });
    },
  });
  const { wrapper } = mountWithCreator(Host, { locale });

  const row = (id: string) => wrapper.find(`li[data-block-id="${id}"]`);
  const rowButton = (id: string, label: string) =>
    row(id).findAll("button").find((b) => b.attributes("aria-label")?.startsWith(label));
  const title = (id: string) => row(id).find("button[aria-expanded]");
  const ids = () => layout.value.map((b) => b.id);
  const paletteItem = (key: string) => wrapper.find(`[data-palette="${key}"]`);

  return { wrapper, layout, selected, row, rowButton, title, ids, paletteItem };
}

describe("the block list", () => {
  test("lists every block in order, by name", () => {
    const { wrapper } = setup();
    expect(wrapper.findAll("li[data-block-id]").map((li) => li.find("button[aria-expanded] span").text())).toEqual([
      T.blocks.images.banner,
      T.blocks.hero,
      T.blocks.score,
      T.blocks.images.afterScore,
      T.blocks.note,
      T.blocks.images.beforeActions,
      T.blocks.actions,
    ]);
  });

  test("names an HTML block by its text, and an empty one by its type", () => {
    const { title } = setup({
      layout: [
        { id: "a", type: "html", html: "<h3>Next steps</h3><p>Call   us</p>" },
        { id: "b", type: "html", html: "" },
        { id: "c", type: "html", html: `<p>${"x".repeat(60)}</p>` },
      ],
    });
    expect(title("a").text()).toBe("Next steps Call us");
    expect(title("b").text()).toBe(T.blocks.html);
    expect(title("c").text()).toBe(`${"x".repeat(39)}…`);
  });

  test("says when the page has no blocks", () => {
    const { wrapper } = setup({ layout: [] });
    expect(wrapper.text()).toContain(T.layout.empty);
  });

  test("marks hidden blocks, blocks with nothing to show, and tier blocks", () => {
    const { title } = setup({
      layout: [
        { id: "hero", type: "hero", hidden: true },
        { id: "note", type: "note" },
        { id: "h", type: "html", html: "<p>x</p>", tier: 1 },
      ],
      emptyIds: ["note"],
    });
    expect(title("hero").text()).toContain(T.layout.hidden);
    expect(title("note").text()).toContain(T.layout.nothingToShow);
    expect(title("h").text()).toContain("High");
  });

  test("moves a block up and down, but not past the ends", async () => {
    const { rowButton, ids } = setup();
    await rowButton("score", T.moveUp)!.trigger("click");
    expect(ids().slice(0, 3)).toEqual(["images-banner", "score", "hero"]);
    await rowButton("score", T.moveDown)!.trigger("click");
    expect(ids().slice(0, 3)).toEqual(["images-banner", "hero", "score"]);
    expect(rowButton("images-banner", T.moveUp)!.attributes("disabled")).toBeDefined();
    expect(rowButton("actions", T.moveDown)!.attributes("disabled")).toBeDefined();
  });

  test("hides and shows a block, leaving no hidden: false behind", async () => {
    const { rowButton, layout } = setup();
    const hide = rowButton("note", T.layout.hide)!;
    expect(hide.attributes("aria-pressed")).toBe("false");
    await hide.trigger("click");
    expect(layout.value.find((b) => b.id === "note")).toEqual({ id: "note", type: "note", hidden: true });
    const show = rowButton("note", T.layout.show)!;
    expect(show.attributes("aria-pressed")).toBe("true");
    await show.trigger("click");
    expect(layout.value.find((b) => b.id === "note")).toEqual({ id: "note", type: "note" });
  });

  test("removes a block, and a built-in one goes back to the palette", async () => {
    const { rowButton, ids, paletteItem } = setup({ selected: "note" });
    expect(paletteItem("note").exists()).toBe(false);
    await rowButton("note", T.layout.remove)!.trigger("click");
    expect(ids()).not.toContain("note");
    expect(paletteItem("note").text()).toContain(T.blocks.note);
  });

  test("clears the selection when the selected block is removed", async () => {
    const { rowButton, selected } = setup({ selected: "note" });
    await rowButton("note", T.layout.remove)!.trigger("click");
    expect(selected.value).toBeNull();
  });

  test("opens a block's settings on click, and closes them on a second", async () => {
    const { title, selected, row } = setup();
    await title("score").trigger("click");
    expect(selected.value).toBe("score");
    expect(title("score").attributes("aria-expanded")).toBe("true");
    expect(row("score").find("select").exists()).toBe(true);
    await title("score").trigger("click");
    expect(selected.value).toBeNull();
    expect(row("score").find("select").exists()).toBe(false);
  });

  test("limits a block to a status tier, and back to every result", async () => {
    const { row, layout } = setup({ selected: "note" });
    const select = row("note").find("select");
    expect(select.findAll("option").map((o) => o.text())).toEqual([T.layout.everyResult, "Low", "High"]);
    await select.setValue("1");
    expect(layout.value.find((b) => b.id === "note")?.tier).toBe(1);
    await select.setValue("");
    expect(layout.value.find((b) => b.id === "note")).toEqual({ id: "note", type: "note" });
  });

  test("brings a block selected elsewhere into view", async () => {
    const { row, selected } = setup();
    const scroll = vi.fn();
    row("actions").element.scrollIntoView = scroll;
    selected.value = "actions";
    await nextTick();
    await nextTick();
    expect(scroll).toHaveBeenCalledWith({ block: "nearest" });
  });
});

describe("the HTML editor", () => {
  const html = (layout: { value: ResultBlock[] }) => layout.value.find((b) => b.id === "h")?.html;

  function htmlSetup(markup = "<p>Hi</p>") {
    return setup({ layout: [{ id: "h", type: "html", html: markup }], selected: "h" });
  }

  test("edits the block's markup, left to right, with a character count", async () => {
    const { row, layout } = htmlSetup();
    const textarea = row("h").find("textarea");
    expect(textarea.attributes("dir")).toBe("ltr");
    expect(textarea.attributes("maxlength")).toBe(String(MAX_HTML_LENGTH));
    await textarea.setValue("<h3>New</h3>");
    expect(html(layout)).toBe("<h3>New</h3>");
    expect(row("h").text()).toContain(
      T.layout.html.count.replace("{n}", "12").replace("{max}", String(MAX_HTML_LENGTH)),
    );
  });

  test("offers the score, the status and the survey's values to insert", () => {
    const { row } = htmlSetup();
    const chips = row("h")
      .findAll("button")
      .map((b) => b.text())
      .filter((text) => text.startsWith("{"));
    expect(chips).toEqual(["{$score}", "{$status}", "{age}", "{riskScore}"]);
  });

  test("inserts a value at the cursor", async () => {
    const { row, layout } = htmlSetup("<p>Hi </p>");
    const textarea = row("h").find("textarea").element as HTMLTextAreaElement;
    textarea.setSelectionRange(6, 6);
    await row("h").findAll("button").find((b) => b.text() === "{age}")!.trigger("click");
    expect(html(layout)).toBe("<p>Hi {age}</p>");
    expect(textarea.selectionStart).toBe(11);
  });

  test("replaces the selected text with the value", async () => {
    const { row, layout } = htmlSetup("<p>NAME</p>");
    const textarea = row("h").find("textarea").element as HTMLTextAreaElement;
    textarea.setSelectionRange(3, 7);
    await row("h").findAll("button").find((b) => b.text() === "{$status}")!.trigger("click");
    expect(html(layout)).toBe("<p>{$status}</p>");
  });

  test("shows no HTML editor for other blocks", () => {
    const { row } = setup({ selected: "note" });
    expect(row("note").find("textarea").exists()).toBe(false);
  });
});

describe("the palette", () => {
  test("offers HTML, a divider and the built-in blocks left out", () => {
    const { wrapper } = setup({ layout: [{ id: "score", type: "score" }] });
    expect(wrapper.findAll("[data-palette]").map((b) => b.attributes("data-palette"))).toEqual([
      "html",
      "divider",
      "images-banner",
      "hero",
      "images-afterScore",
      "note",
      "images-beforeActions",
      "actions",
    ]);
  });

  test("adds an HTML block after the selected one, with starter text, and selects it", async () => {
    const { paletteItem, layout, selected } = setup({ selected: "hero" });
    await paletteItem("html").trigger("click");
    const added = layout.value[2];
    expect(added.type).toBe("html");
    expect(added.html).toContain(T.layout.html.starterTitle);
    expect(added.html).toContain(T.layout.html.starterText);
    expect(selected.value).toBe(added.id);
  });

  test("adds a block from the keyboard, with Enter or Space", async () => {
    const { paletteItem, layout } = setup();
    expect(paletteItem("divider").attributes("role")).toBe("button");
    expect(paletteItem("divider").attributes("tabindex")).toBe("0");
    await paletteItem("divider").trigger("keydown", { key: "Enter" });
    await paletteItem("divider").trigger("keydown", { key: " " });
    expect(layout.value.filter((b) => b.type === "divider")).toHaveLength(2);
  });

  test("adds a block last when none is selected", async () => {
    const { paletteItem, layout } = setup();
    await paletteItem("divider").trigger("click");
    expect(layout.value.at(-1)?.type).toBe("divider");
  });

  test("puts a built-in block back", async () => {
    const { paletteItem, ids } = setup({ layout: [{ id: "score", type: "score" }] });
    await paletteItem("images-banner").trigger("click");
    expect(ids()).toEqual(["score", "images-banner"]);
  });

  test("is closed once the layout is full", async () => {
    const full = Array.from({ length: MAX_BLOCKS }, (_, i) => ({ id: `d${i}`, type: "divider" as const }));
    const { paletteItem, wrapper, layout } = setup({ layout: full });
    expect(paletteItem("html").attributes("aria-disabled")).toBe("true");
    expect(paletteItem("html").attributes("draggable")).toBe("false");
    expect(paletteItem("html").attributes("tabindex")).toBe("-1");
    await paletteItem("html").trigger("click");
    expect(layout.value).toHaveLength(MAX_BLOCKS);
    expect(wrapper.text()).toContain(T.layout.full.replace("{max}", String(MAX_BLOCKS)));
  });
});

describe("drag and drop", () => {
  const handle = (row: ReturnType<ReturnType<typeof setup>["row"]>) => row.find("[draggable=true]");

  test("drops a dragged block before the one it lands on", async () => {
    const { row, ids, selected } = setup();
    await handle(row("actions")).trigger("dragstart");
    await flush();
    await row("hero").trigger("dragover");
    expect(row("hero").find("[data-drop-indicator]").exists()).toBe(true);
    await row("hero").trigger("drop");
    expect(ids().slice(0, 3)).toEqual(["images-banner", "actions", "hero"]);
    expect(selected.value).toBe("actions");
  });

  test("drops after a block from its lower half", async () => {
    const { row, ids } = setup();
    row("hero").element.getBoundingClientRect = () => ({ top: 0, height: 40, bottom: 40 }) as DOMRect;
    await handle(row("actions")).trigger("dragstart");
    await flush();
    await row("hero").trigger("dragover", { clientY: 30 });
    await row("hero").trigger("drop", { clientY: 30 });
    expect(ids().slice(0, 3)).toEqual(["images-banner", "hero", "actions"]);
  });

  test("drops at the end through the zone that shows while dragging", async () => {
    const { wrapper, row, ids } = setup();
    expect(wrapper.find("[data-drop-end]").exists()).toBe(false);
    await handle(row("hero")).trigger("dragstart");
    await flush();
    const end = wrapper.find("[data-drop-end]");
    expect(end.text()).toBe(T.layout.dropHere);
    await end.trigger("drop");
    expect(ids().at(-1)).toBe("hero");
    expect(wrapper.find("[data-drop-end]").exists()).toBe(false);
  });

  test("shows its drop zone only after dragstart, so the palette does not move under the pointer", async () => {
    const { wrapper, paletteItem } = setup();
    paletteItem("html").element.dispatchEvent(new Event("dragstart", { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();
    expect(wrapper.find("[data-drop-end]").exists()).toBe(false);
    await flush();
    expect(wrapper.find("[data-drop-end]").exists()).toBe(true);
  });

  test("drags a new block in from the palette", async () => {
    const { row, paletteItem, layout, selected } = setup();
    await paletteItem("html").trigger("dragstart");
    await flush();
    await row("score").trigger("drop");
    const index = layout.value.findIndex((b) => b.type === "html");
    expect(layout.value[index + 1].id).toBe("score");
    expect(selected.value).toBe(layout.value[index].id);
  });

  test("clears the drop marker when the drag leaves or ends", async () => {
    const { row, wrapper } = setup();
    await handle(row("actions")).trigger("dragstart");
    await flush();
    await row("hero").trigger("dragover");
    await row("hero").trigger("dragleave");
    expect(wrapper.find("[data-drop-indicator]").exists()).toBe(false);
    await row("hero").trigger("dragover");
    await handle(row("actions")).trigger("dragend");
    expect(wrapper.find("[data-drop-indicator]").exists()).toBe(false);
    expect(wrapper.find("[data-drop-end]").exists()).toBe(false);
  });

  test("ignores drags that are not blocks", async () => {
    const { row, ids } = setup();
    const before = ids();
    const event = new Event("dragover", { cancelable: true });
    row("hero").element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    await row("hero").trigger("drop");
    expect(ids()).toEqual(before);
  });
});

test("speaks Persian", () => {
  const F = surveyResultEditor.fa;
  const { wrapper, title } = setup({ locale: "fa" });
  expect(title("hero").text()).toBe(F.blocks.hero);
  expect(wrapper.text()).toContain(F.layout.add);
  expect(wrapper.text()).toContain(F.layout.help);
});

// The drag in progress is shared across the page: none outlives a test
afterEach(() => useBlockDrag().end());
