import { afterEach, describe, expect, test } from "vitest";
import type { VueWrapper } from "@vue/test-utils";
import RenderResult from "../../src/components/RenderResult.vue";
import SurveyResult from "../../src/components/templates/SurveyResult.vue";
import ResultCanvasBlock from "../../src/components/templates/ResultCanvasBlock.vue";
import useBlockDrag from "../../src/composables/useBlockDrag.ts";
import { surveyResult } from "../../src/locales/index.ts";
import { getDefaultProps } from "../../src/schemas/templates.ts";
import type { ResultBlock, SurveyResultProps } from "../../src/types/index.ts";
import { defaultLayout } from "../../src/utils/resultLayout.ts";
import { mountWithCreator, flush } from "./helpers.ts";

const R = surveyResult.en;

function render(props: SurveyResultProps & { preview?: boolean; selectedBlock?: string | null }) {
  return mountWithCreator(SurveyResult, { props }).child;
}

/** The page's blocks, by type, top to bottom. */
const order = (view: VueWrapper) => view.findAll("[data-block]").map((b) => b.attributes("data-block"));

const image = (placement: "banner" | "afterScore" | "beforeActions", extra = {}) => ({
  id: `img-${placement}`,
  src: "https://example.com/a.png",
  alt: placement,
  placement,
  ...extra,
});

/** The layout the preview last asked for. */
const lastLayout = (view: VueWrapper) =>
  (view.emitted("update:layout")?.at(-1)?.[0] as ResultBlock[]).map((b) => b.id);

describe("the page's layout", () => {
  test("without a layout, keeps the standard order", () => {
    const view = render({
      ...getDefaultProps("en"),
      layout: undefined,
      images: [image("banner"), image("afterScore"), image("beforeActions")],
    });
    expect(order(view)).toEqual(["images", "hero", "score", "images", "note", "images", "actions"]);
    // The banner is the full-width one
    const blocks = view.findAll("[data-block]");
    expect(blocks[0].classes()).not.toContain("px-9.5");
    expect(blocks[1].classes()).toContain("px-9.5");
  });

  test("shows the blocks in the layout's order", () => {
    const view = render({
      ...getDefaultProps("en"),
      layout: [
        { id: "actions", type: "actions" },
        { id: "note", type: "note" },
        { id: "d", type: "divider" },
        { id: "score", type: "score" },
        { id: "hero", type: "hero" },
      ],
    });
    expect(order(view)).toEqual(["actions", "note", "divider", "score", "hero"]);
    expect(view.find("[data-block=divider] hr").exists()).toBe(true);
  });

  test("leaves out blocks the layout leaves out", () => {
    const view = render({ ...getDefaultProps("en"), layout: [{ id: "score", type: "score" }] });
    expect(order(view)).toEqual(["score"]);
    expect(view.text()).not.toContain(R.title);
  });

  test("skips blocks with nothing to show", () => {
    const view = render({
      ...getDefaultProps("en"),
      noteText: "  ",
      actions: [],
      images: [],
      layout: [...defaultLayout(), { id: "h", type: "html", html: "  " }],
    });
    expect(order(view)).toEqual(["hero", "score"]);
  });

  test("pads the page top only when it does not start with the banner", () => {
    const withBanner = render({ ...getDefaultProps("en"), images: [image("banner")] });
    expect(withBanner.find("[data-block]").element.parentElement!.className).not.toContain("pt-9.5");
    const without = render({ ...getDefaultProps("en") });
    expect(without.find("[data-block]").element.parentElement!.className).toContain("pt-9.5");
  });

  test("puts each image in its slot, wherever the slot is", () => {
    const view = render({
      ...getDefaultProps("en"),
      images: [image("afterScore", { alt: "under" }), image("beforeActions", { alt: "above" })],
      layout: [
        { id: "images-beforeActions", type: "images", placement: "beforeActions" },
        { id: "hero", type: "hero" },
        { id: "images-afterScore", type: "images", placement: "afterScore" },
      ],
    });
    expect(view.findAll("img[alt=under], img[alt=above]").map((i) => i.attributes("alt"))).toEqual(["above", "under"]);
  });
});

describe("hidden and tier blocks, for respondents", () => {
  const tiers = { min: 0, max: 100, statusLabels: ["Low", "Mid", "High", "Top"] };

  test("hides a hidden block", () => {
    const view = render({
      ...getDefaultProps("en"),
      layout: [
        { id: "hero", type: "hero", hidden: true },
        { id: "score", type: "score" },
      ],
    });
    expect(order(view)).toEqual(["score"]);
  });

  test("shows a tier's block only to scores in that tier", () => {
    const layout: ResultBlock[] = [
      { id: "low", type: "html", html: "<p>Low advice</p>", tier: 0 },
      { id: "top", type: "html", html: "<p>Top advice</p>", tier: 3 },
      { id: "all", type: "html", html: "<p>For everyone</p>" },
    ];
    const low = render({ ...getDefaultProps("en"), ...tiers, score: 10, layout });
    expect(low.text()).toContain("Low advice");
    expect(low.text()).not.toContain("Top advice");
    expect(low.text()).toContain("For everyone");

    const top = render({ ...getDefaultProps("en"), ...tiers, score: 95, layout });
    expect(top.text()).toContain("Top advice");
    expect(top.text()).not.toContain("Low advice");

    // Without a score, only the blocks for every result
    const none = render({ ...getDefaultProps("en"), ...tiers, score: "riskScore", layout });
    expect(none.text()).not.toMatch(/Low advice|Top advice/);
    expect(none.text()).toContain("For everyone");
  });

  test("lets a respondent hide a built-in section and bring it back", async () => {
    const view = render({ ...getDefaultProps("en") });
    const hide = view.findAll(`button[aria-label="${R.hideSection}"]`);
    // The hero, score, note and buttons each have one
    expect(hide).toHaveLength(4);
    await hide[0].trigger("click");
    expect(order(view)).not.toContain("hero");
    const restore = view.findAll("button").find((b) => b.text() === R.restoreHidden)!;
    await restore.trigger("click");
    expect(order(view)).toContain("hero");
  });
});

describe("HTML blocks", () => {
  test("show the author's markup, sanitized", () => {
    const view = render({
      ...getDefaultProps("en"),
      layout: [
        {
          id: "h",
          type: "html",
          html: '<h3>Next steps</h3><p onclick="alert(1)">Call us</p><script>alert(1)</script><button>Submit</button>',
        },
      ],
    });
    const block = view.find(".fb-result-html");
    expect(block.find("h3").text()).toBe("Next steps");
    expect(block.find("p").attributes("onclick")).toBeUndefined();
    expect(block.find("script").exists()).toBe(false);
    expect(block.find("button").exists()).toBe(false);
  });

  test("fill the score, status and range once there is a score", () => {
    const view = render({
      ...getDefaultProps("en"),
      score: 72.456,
      min: 0,
      max: 100,
      statusLabels: ["Low", "Mid", "High", "Top"],
      layout: [{ id: "h", type: "html", html: "<p>{$score} of {$min}-{$max}: {$status} ({age})</p>" }],
    });
    // {age} is RenderResult's to fill; here it stays as written
    expect(view.find(".fb-result-html").text()).toBe("72.46 of 0-100: High ({age})");
  });

  test("format the score in the locale's digits", () => {
    const { child } = mountWithCreator(SurveyResult, {
      locale: "fa",
      props: { ...getDefaultProps("fa"), score: 12, layout: [{ id: "h", type: "html", html: "<p>{$score}</p>" }] },
    });
    expect(child.find(".fb-result-html").text()).toBe("۱۲");
  });

  test("in the editor, keep placeholders as written and point an empty block at the panel", () => {
    const view = render({
      ...getDefaultProps("en"),
      score: "riskScore",
      preview: true,
      layout: [
        { id: "h", type: "html", html: "<p>{$score} {age}</p>" },
        { id: "e", type: "html", html: "" },
      ],
    });
    expect(view.find(".fb-result-html").text()).toBe("{$score} {age}");
    expect(view.text()).toContain(R.canvas.emptyHtml);
  });
});

describe("RenderResult and HTML blocks", () => {
  test("fills answers in as text and leaves the template's values to it", () => {
    const { wrapper } = mountWithCreator(RenderResult, {
      props: {
        templateProps: {
          score: "risk",
          max: 100,
          statusLabels: ["Low", "High"],
          layout: [
            { id: "h", type: "html", html: "<p>{name}: {$score} ({$status})</p>" },
            { id: "s", type: "score" },
          ],
        },
        result: { name: "<b>Ann</b>", risk: 80 },
      },
    });
    const block = wrapper.find(".fb-result-html");
    expect(block.text()).toBe("<b>Ann</b>: 80 (High)");
    expect(block.find("b").exists()).toBe(false);
  });

  test("drops a layout it cannot read, so the page keeps its standard order", () => {
    const { wrapper } = mountWithCreator(RenderResult, {
      props: { templateProps: { layout: "nonsense" as unknown as ResultBlock[] }, result: {} },
    });
    expect(wrapper.findAll("[data-block]").map((b) => b.attributes("data-block"))).toEqual([
      "hero",
      "score",
      "actions",
    ]);
  });
});

describe("editing on the preview", () => {
  const layout: ResultBlock[] = [
    { id: "hero", type: "hero" },
    { id: "score", type: "score" },
    { id: "h1", type: "html", html: "<p>One</p>" },
    { id: "actions", type: "actions" },
  ];

  function preview(extra: Partial<SurveyResultProps> & { selectedBlock?: string | null } = {}) {
    return render({ ...getDefaultProps("en"), layout, preview: true, ...extra });
  }

  const canvas = (view: VueWrapper, id: string) => view.find(`[data-block-id="${id}"]`);

  test("wraps every block in the editor's chrome, without the respondent's hide buttons", () => {
    const view = preview();
    expect(view.findAllComponents(ResultCanvasBlock).map((b) => b.props("id"))).toEqual([
      "hero",
      "score",
      "h1",
      "actions",
    ]);
    expect(view.findAll(`button[aria-label="${R.hideSection}"]`)).toHaveLength(0);
    expect(canvas(view, "hero").attributes("aria-label")).toBe(R.blocks.hero);
    // An HTML block goes by its text, an empty one by its type
    expect(canvas(view, "h1").attributes("aria-label")).toBe("One");
  });

  test("selects a block when it is clicked or picked from the keyboard", async () => {
    const view = preview();
    await canvas(view, "score").trigger("click");
    expect(view.emitted("update:selectedBlock")?.at(-1)).toEqual(["score"]);
    await canvas(view, "h1").trigger("keydown", { key: "Enter" });
    expect(view.emitted("update:selectedBlock")?.at(-1)).toEqual(["h1"]);
  });

  test("marks the selected block", () => {
    const view = preview({ selectedBlock: "h1" });
    expect(canvas(view, "h1").attributes("aria-current")).toBe("true");
    expect(canvas(view, "hero").attributes("aria-current")).toBeUndefined();
  });

  test("moves a block with its toolbar buttons", async () => {
    const view = preview();
    const block = canvas(view, "h1");
    await block.find(`button[aria-label="${R.canvas.moveUp}: One"]`).trigger("click");
    expect(lastLayout(view)).toEqual(["hero", "h1", "score", "actions"]);
    await block.find(`button[aria-label="${R.canvas.moveDown}: One"]`).trigger("click");
    expect(lastLayout(view)).toEqual(["hero", "score", "actions", "h1"]);
  });

  test("moves a focused block with Alt+arrows, and not past the ends", async () => {
    const view = preview();
    await canvas(view, "score").trigger("keydown", { key: "ArrowUp", altKey: true });
    expect(lastLayout(view)).toEqual(["score", "hero", "h1", "actions"]);
    const before = view.emitted("update:layout")!.length;
    await canvas(view, "hero").trigger("keydown", { key: "ArrowUp", altKey: true });
    await canvas(view, "actions").trigger("keydown", { key: "ArrowDown", altKey: true });
    expect(view.emitted("update:layout")!.length).toBe(before);
  });

  test("disables moving the first block up and the last down", () => {
    const view = preview();
    expect(canvas(view, "hero").find(`button[aria-label^="${R.canvas.moveUp}"]`).attributes("disabled")).toBeDefined();
    expect(canvas(view, "actions").find(`button[aria-label^="${R.canvas.moveDown}"]`).attributes("disabled")).toBeDefined();
  });

  test("moves past blocks the preview does not show", async () => {
    // The images slot between score and html has no images, so it is not shown
    const view = preview({
      layout: [
        { id: "score", type: "score" },
        { id: "images-afterScore", type: "images", placement: "afterScore" },
        { id: "h1", type: "html", html: "<p>One</p>" },
      ],
    });
    await canvas(view, "h1").find(`button[aria-label^="${R.canvas.moveUp}"]`).trigger("click");
    expect(lastLayout(view)).toEqual(["h1", "score", "images-afterScore"]);
  });

  test("hides and shows a block, which stays on the preview, dimmed", async () => {
    const view = preview({ layout: [{ id: "hero", type: "hero", hidden: true }, ...layout.slice(1)] });
    const hero = canvas(view, "hero");
    expect(hero.exists()).toBe(true);
    expect(hero.text()).toContain(R.canvas.hidden);
    await hero.find(`button[aria-label="${R.canvas.show}: ${R.blocks.hero}"]`).trigger("click");
    const shown = view.emitted("update:layout")!.at(-1)![0] as ResultBlock[];
    expect(shown[0]).toEqual({ id: "hero", type: "hero" });

    await canvas(view, "score").find(`button[aria-label="${R.canvas.hide}: ${R.blocks.score}"]`).trigger("click");
    const hidden = view.emitted("update:layout")!.at(-1)![0] as ResultBlock[];
    expect(hidden[1]).toEqual({ id: "score", type: "score", hidden: true });
  });

  test("labels a tier's block with its tier", () => {
    const view = preview({
      statusLabels: ["Low", "High"],
      layout: [{ id: "h", type: "html", html: "<p>x</p>", tier: 1 }],
    });
    expect(canvas(view, "h").text()).toContain(R.images.onlyFor.replace("{tier}", "High"));
  });

  test("drops a dragged block before the block it lands on", async () => {
    const view = preview();
    await canvas(view, "actions").trigger("dragstart");
    await flush();
    expect(view.emitted("update:selectedBlock")?.at(-1)).toEqual(["actions"]);
    await canvas(view, "score").trigger("dragover");
    expect(canvas(view, "score").find("[data-drop-indicator]").exists()).toBe(true);
    await canvas(view, "score").trigger("drop");
    expect(lastLayout(view)).toEqual(["hero", "actions", "score", "h1"]);
    expect(view.find("[data-drop-indicator]").exists()).toBe(false);
  });

  test("drops after a block from its lower half", async () => {
    const view = preview();
    const target = canvas(view, "hero");
    target.element.getBoundingClientRect = () => ({ top: 0, height: 100, bottom: 100 }) as DOMRect;
    await canvas(view, "actions").trigger("dragstart");
    await flush();
    await target.trigger("dragover", { clientY: 80 });
    await target.trigger("drop", { clientY: 80 });
    expect(lastLayout(view)).toEqual(["hero", "actions", "score", "h1"]);
  });

  test("changes nothing on the page during dragstart, which would cancel the drag in Chromium", async () => {
    const view = preview();
    canvas(view, "actions").element.dispatchEvent(new Event("dragstart", { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();
    expect(view.find("[data-drop-end]").exists()).toBe(false);
    expect(view.emitted("update:selectedBlock")).toBeUndefined();
    await flush();
    expect(view.find("[data-drop-end]").exists()).toBe(true);
    expect(view.emitted("update:selectedBlock")?.at(-1)).toEqual(["actions"]);
  });

  test("offers a drop zone at the end while dragging", async () => {
    const view = preview();
    expect(view.find("[data-drop-end]").exists()).toBe(false);
    await canvas(view, "hero").trigger("dragstart");
    await flush();
    const end = view.find("[data-drop-end]");
    expect(end.text()).toBe(R.canvas.dropHere);
    await end.trigger("dragover");
    await end.trigger("drop");
    expect(lastLayout(view)).toEqual(["score", "h1", "actions", "hero"]);
    expect(view.find("[data-drop-end]").exists()).toBe(false);
  });

  test("takes a new block dragged from the palette, and selects it", async () => {
    const view = preview();
    const drag = useBlockDrag();
    drag.start(new Event("dragstart") as DragEvent, {
      kind: "add",
      block: { id: "new-html", type: "html", html: "<p>New</p>" },
    });
    await canvas(view, "score").trigger("dragover");
    await canvas(view, "score").trigger("drop");
    expect(lastLayout(view)).toEqual(["hero", "new-html", "score", "h1", "actions"]);
    expect(view.emitted("update:selectedBlock")?.at(-1)).toEqual(["new-html"]);
  });

  test("ignores drags that are not blocks, such as files", async () => {
    const view = preview();
    const event = new Event("dragover", { cancelable: true });
    canvas(view, "score").element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    await canvas(view, "score").trigger("drop");
    expect(view.emitted("update:layout")).toBeUndefined();
  });

  test("ends a cancelled drag without changing anything", async () => {
    const view = preview();
    await canvas(view, "hero").trigger("dragstart");
    await flush();
    await canvas(view, "hero").trigger("dragend");
    expect(view.find("[data-drop-end]").exists()).toBe(false);
    expect(view.emitted("update:layout")).toBeUndefined();
  });

  test("names an empty HTML block by its type", () => {
    const view = preview({ layout: [{ id: "e", type: "html", html: "" }] });
    expect(canvas(view, "e").attributes("aria-label")).toBe(R.blocks.html);
  });

  test("on an empty page, asks for a block to be dragged in", async () => {
    const view = preview({ layout: [] });
    expect(view.find("[data-drop-end]").text()).toBe(R.canvas.emptyLayout);
  });

  test("does not follow a link or reorder when a button is clicked", async () => {
    const view = preview({
      actions: [{ id: "go", label: "Go", type: "link", url: "https://example.com" }],
    });
    const link = view.find("a[href='https://example.com']");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(view.emitted("update:layout")).toBeUndefined();
  });
});

// The drag in progress is shared across the page: none outlives a test
afterEach(() => useBlockDrag().end());
