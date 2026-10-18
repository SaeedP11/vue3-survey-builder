import { describe, expect, test } from "vitest";
import { defineComponent, h, nextTick, type Component } from "vue";
import RenderResult from "../../src/components/RenderResult.vue";
import SurveyResult from "../../src/components/templates/SurveyResult.vue";
import BulletChart from "../../src/components/widgets/BulletChart.vue";
import DefaultScoreCard from "../../src/components/widgets/DefaultScoreCard.vue";
import DonutGauge from "../../src/components/widgets/DonutGauge.vue";
import LinearHealthGauge from "../../src/components/widgets/LinearHealthGauge.vue";
import RadialGauge from "../../src/components/widgets/RadialGauge.vue";
import SegmentedPills from "../../src/components/widgets/SegmentedPills.vue";
import Table from "../../src/components/widgets/Table.vue";
import TemperatureGauge from "../../src/components/widgets/TemperatureGauge.vue";
import VerticalThermometer from "../../src/components/widgets/VerticalThermometer.vue";
import { surveyResult } from "../../src/locales/index.ts";
import { provideSurveyResultTemplate } from "../../src/provider/surveyResultTemplate.ts";
import { getDefaultProps } from "../../src/schemas/templates.ts";
import type { ScoreDisplayVariant, SurveyResultProps } from "../../src/types/index.ts";
import { mountWithCreator } from "./helpers.ts";
import ResultImages from "../../src/components/templates/ResultImages.vue";
import type { ResultAction, ResultImage } from "../../src/types/index.ts";
import { vi } from "vitest";

describe("RenderResult", () => {
  test("fills a link's placeholders with the answers and passes clicks on", async () => {
    const action: ResultAction = {
      id: "book",
      label: "Book",
      type: "link",
      url: "https://example.com/book?score={riskScore}&name={ name }&x={missing}",
    };
    const { wrapper, child } = mountWithCreator(RenderResult, {
      props: { templateProps: { actions: [action] }, result: { riskScore: 42, name: "A B" } },
    });
    const link = wrapper.find("a");
    expect(link.attributes("href")).toBe("https://example.com/book?score=42&name=A%20B&x=");
    link.element.addEventListener("click", (e) => e.preventDefault());
    await link.trigger("click");
    expect(child.emitted("action")?.[0][0]).toMatchObject({ id: "book" });
  });

  test("passes restart and close on", async () => {
    const { wrapper, child } = mountWithCreator(RenderResult, {
      props: {
        templateProps: {
          actions: [
            { id: "r", label: "Again", type: "restart" },
            { id: "c", label: "Close it", type: "close", variant: "text" },
          ],
        },
        result: {},
      },
    });
    for (const b of wrapper.findAll("button").filter((b) => ["Again", "Close it"].includes(b.text())))
      await b.trigger("click");
    expect(child.emitted("restart")).toHaveLength(1);
    expect(child.emitted("close")).toHaveLength(1);
  });

  /** Renders with a stand-in template that records the props it gets. */
  function render(templateProps: SurveyResultProps | undefined, result: Record<string, unknown>) {
    let received: Record<string, unknown> | undefined;
    const Probe = defineComponent({
      inheritAttrs: false,
      setup(_, { attrs }) {
        return () => {
          received = { ...attrs };
          return h("div", { class: "probe" });
        };
      },
    });
    const { wrapper } = mountWithCreator(RenderResult, {
      props: { templateProps, result },
      setup: () => provideSurveyResultTemplate({ id: "probe", component: Probe }),
    });
    return { wrapper, received: () => received };
  }

  test("reads the score from the named answer or calculated value", () => {
    const { received } = render({ score: "riskScore", title: "T" }, { riskScore: 42 });
    expect(received()).toMatchObject({ score: 42, title: "T" });
  });

  test("converts a numeric string answer", () => {
    expect(render({ score: "q" }, { q: "7.5" }).received()?.score).toBe(7.5);
  });

  test("passes a literal number through", () => {
    expect(render({ score: 13 }, {}).received()?.score).toBe(13);
  });

  test("gives no score for a missing, empty or non-numeric answer", () => {
    expect(render({ score: "missing" }, {}).received()?.score).toBeUndefined();
    expect(render({ score: "q" }, { q: null }).received()?.score).toBeUndefined();
    expect(render({ score: "q" }, { q: "" }).received()?.score).toBeUndefined();
    expect(render({ score: "q" }, { q: "abc" }).received()?.score).toBeUndefined();
    expect(render({ score: "" }, {}).received()?.score).toBeUndefined();
  });

  test("reads each table row's value from the answers", () => {
    const { received } = render(
      {
        scoreDisplay: "table",
        tableRows: [
          { metric: "Age", value: "age", min: 0, max: 100 },
          { metric: "Literal", value: 5, min: 0, max: 10 },
          { metric: "Unanswered", value: "missing", min: 0, max: 1 },
        ],
      },
      { age: 64 },
    );
    expect((received()?.tableRows as { value: unknown }[]).map((r) => r.value)).toEqual([64, 5, ""]);
  });

  test("renders nothing without a template", () => {
    const { wrapper } = render(undefined, {});
    expect(wrapper.find(".probe").exists()).toBe(false);
  });
});

describe("SurveyResult", () => {
  function render(props: SurveyResultProps, locale = "en") {
    return mountWithCreator(SurveyResult, { props, locale }).child;
  }

  test("shows the template's copy", () => {
    const view = render({ ...getDefaultProps("en"), title: "My title", noteText: "My note" });
    expect(view.text()).toContain("My title");
    expect(view.text()).toContain("My note");
  });

  test("falls back to the locale's copy for empty fields", () => {
    for (const locale of ["en", "fa"] as const) {
      const view = render({ title: "", brandName: "  ", primaryLabel: "" }, locale);
      expect(view.text()).toContain(surveyResult[locale].title);
      expect(view.text()).toContain(surveyResult[locale].brandName);
      expect(view.text()).toContain(surveyResult[locale].primaryLabel);
    }
  });

  test("leaves out the description and note when they are empty", () => {
    const view = render({ description: "", noteText: "" });
    expect(view.text()).not.toContain(surveyResult.en.description);
    expect(view.text()).not.toContain(surveyResult.en.noteText);
  });

  const DISPLAYS: [ScoreDisplayVariant, Component][] = [
    ["default", DefaultScoreCard],
    ["linear", LinearHealthGauge],
    ["radial", RadialGauge],
    ["temperature", TemperatureGauge],
    ["donut", DonutGauge],
    ["bullet", BulletChart],
    ["thermometer", VerticalThermometer],
    ["pills", SegmentedPills],
    ["table", Table],
  ];

  test.each(DISPLAYS)("scoreDisplay %s renders its widget", (display, widget) => {
    const view = render({ scoreDisplay: display, score: 30, min: 0, max: 60 });
    const found = view.findComponent(widget);
    expect(found.exists()).toBe(true);
    for (const [, other] of DISPLAYS) {
      if (other !== widget) expect(view.findComponent(other).exists()).toBe(false);
    }
    if (display !== "table") {
      const props = found.props() as Record<string, unknown>;
      expect(props.min).toBe(0);
      expect(props.max).toBe(60);
    }
  });

  test("hands the widget the score, or 0 when there is none", () => {
    expect(render({ score: 30 }).findComponent(DefaultScoreCard).props("value")).toBe(30);
    expect(render({ score: undefined }).findComponent(DefaultScoreCard).props("value")).toBe(0);
    expect(render({ score: "riskScore" }).findComponent(DefaultScoreCard).props("value")).toBe(0);
  });

  test("hands the widget the template's status labels", () => {
    const view = render({ statusLabels: ["x", "y"] });
    expect(view.findComponent(DefaultScoreCard).props("statusLabels")).toEqual(["x", "y"]);
  });

  test("falls back to the locale's status labels, in that language", () => {
    for (const locale of ["en", "fa"] as const) {
      const view = render({ statusLabels: [] }, locale);
      expect(view.findComponent(DefaultScoreCard).props("statusLabels")).toEqual(
        surveyResult[locale].statusLabels,
      );
    }
  });

  test("hands the table its rows", () => {
    const rows = [{ metric: "m", value: 1, min: 0, max: 2 }];
    expect(render({ scoreDisplay: "table", tableRows: rows }).findComponent(Table).props("rows")).toEqual(rows);
  });

  test("a template from before buttons were editable emits primary, secondary and close", async () => {
    const view = render({ title: "Old" });
    const buttons = view.findAll("button").filter((b) =>
      [surveyResult.en.primaryLabel, surveyResult.en.secondaryLabel, surveyResult.en.close].includes(
        b.text(),
      ),
    );
    for (const b of buttons) await b.trigger("click");
    expect(Object.keys(view.emitted())).toEqual(
      expect.arrayContaining(["primary", "secondary", "close"]),
    );
  });

  test("sections can be hidden and restored", async () => {
    const view = render({ ...getDefaultProps("en"), title: "Hide me" });
    const restore = () =>
      view.findAll("button").find((b) => b.text() === surveyResult.en.restoreHidden);
    expect(restore()).toBeUndefined();

    const hideButtons = view.findAll(`button[title="${surveyResult.en.hideSection}"]`);
    expect(hideButtons.length).toBe(4);
    await hideButtons[0].trigger("click");
    expect(view.text()).not.toContain("Hide me");
    expect(restore()).toBeDefined();

    await restore()!.trigger("click");
    await nextTick();
    expect(view.text()).toContain("Hide me");
    expect(restore()).toBeUndefined();
  });
});

describe("SurveyResult buttons", () => {
  function render(props: object, locale = "en") {
    return mountWithCreator(SurveyResult, { props, locale }).child;
  }
  const actionEls = (view: ReturnType<typeof render>) =>
    view.findAll("a, button").filter((el) => !el.attributes("title"));

  test("shows the template's buttons in order, primary and secondary before text ones", () => {
    const view = render({
      actions: [
        { id: "a", label: "Later", type: "close", variant: "text" },
        { id: "b", label: "First", type: "custom", variant: "primary" },
        { id: "c", label: "Second", type: "print", variant: "secondary" },
        { id: "d", label: "  ", type: "custom" },
      ],
    });
    expect(actionEls(view).map((b) => b.text())).toEqual(["First", "Second", "Later"]);
  });

  test("no buttons leaves out the buttons section", () => {
    const view = render({ actions: [], noteText: "Note" });
    expect(view.findAll(`button[title="${surveyResult.en.hideSection}"]`)).toHaveLength(3);
  });

  test("a link is an anchor; a new-tab link drops the opener", () => {
    const view = render({
      actions: [
        { id: "a", label: "Same", type: "link", url: "/next" },
        { id: "b", label: "New", type: "link", url: "https://x.test", newTab: true },
      ],
    });
    const [same, next] = view.findAll("a");
    expect(same.attributes()).toMatchObject({ href: "/next" });
    expect(same.attributes("target")).toBeUndefined();
    expect(next.attributes()).toMatchObject({ target: "_blank", rel: "noopener noreferrer" });
  });

  test("a link with a script address is a plain button", () => {
    const view = render({
      actions: [{ id: "x", label: "Bad", type: "link", url: "javascript:alert(1)" }],
    });
    expect(view.find("a").exists()).toBe(false);
    expect(actionEls(view).map((b) => b.text())).toEqual(["Bad"]);
  });

  test("emits action for every click, and close or restart for those types", async () => {
    const actions: ResultAction[] = [
      { id: "c", label: "C", type: "custom" },
      { id: "r", label: "R", type: "restart" },
      { id: "x", label: "X", type: "close" },
    ];
    const view = render({ actions });
    for (const b of actionEls(view)) await b.trigger("click");
    expect(view.emitted("action")?.map((e) => (e[0] as ResultAction).id)).toEqual(["c", "r", "x"]);
    expect(view.emitted("restart")).toHaveLength(1);
    expect(view.emitted("close")).toHaveLength(1);
    expect(view.emitted("primary")).toBeUndefined();
  });

  test("print opens the print dialog, except in the editor's preview", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    const actions: ResultAction[] = [{ id: "p", label: "Print", type: "print" }];
    await actionEls(render({ actions })).at(0)!.trigger("click");
    expect(print).toHaveBeenCalledTimes(1);
    await actionEls(render({ actions, preview: true })).at(0)!.trigger("click");
    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });

  test("shows a button only for the scores it is limited to", () => {
    const base = {
      min: 0,
      max: 100,
      statusLabels: ["Low", "High"],
      actions: [
        { id: "all", label: "Always", type: "close", variant: "text" },
        { id: "high", label: "Book", type: "custom", tier: 1 },
        { id: "low", label: "Relax", type: "custom", scoreMax: 30 },
      ],
    };
    const labels = (score: unknown) =>
      actionEls(render({ ...base, score })).map((b) => b.text());
    expect(labels(10)).toEqual(["Relax", "Always"]);
    expect(labels(45)).toEqual(["Always"]);
    expect(labels(90)).toEqual(["Book", "Always"]);
    // A score that is still a variable name has no value to compare
    expect(labels("riskScore")).toEqual(["Always"]);
  });

  test("hides the buttons block when the score allows none of its buttons", () => {
    const view = render({
      score: 10,
      layout: [{ id: "actions", type: "actions" }],
      actions: [{ id: "a", label: "Book", type: "custom", scoreMin: 50 }],
    });
    expect(actionEls(view)).toHaveLength(0);
  });

  test("the editor's preview shows every button, naming the scores it is for", () => {
    const view = render({
      preview: true,
      score: 10,
      statusLabels: ["Low", "High"],
      actions: [
        { id: "a", label: "Book", type: "custom", tier: 1 },
        { id: "b", label: "Call", type: "custom", scoreMin: 40, scoreMax: 60 },
        { id: "c", label: "Later", type: "close", variant: "text", scoreMin: 70 },
      ],
    });
    expect(view.findAll("[data-action-condition]").map((c) => c.text())).toEqual([
      "Only for: High",
      "Only for: 40–60",
      "Only for: ≥ 70",
    ]);
  });

  test("a link does not navigate in the editor's preview", async () => {
    const view = render({
      preview: true,
      actions: [{ id: "a", label: "Go", type: "link", url: "https://x.test" }],
    });
    const event = new MouseEvent("click", { cancelable: true });
    view.find("a").element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe("SurveyResult images", () => {
  const img = (over: Partial<ResultImage>): ResultImage => ({
    id: Math.random().toString(36),
    src: "https://img.test/a.png",
    ...over,
  });
  function render(props: object) {
    return mountWithCreator(SurveyResult, { props }).child;
  }
  const srcs = (view: ReturnType<typeof render>) => view.findAll("img").map((i) => i.attributes("src"));

  test("puts each image at its placement", () => {
    const view = render({
      images: [
        img({ src: "https://img.test/banner.png", placement: "banner", alt: "Banner" }),
        img({ src: "https://img.test/score.png" }),
        img({ src: "https://img.test/actions.png", placement: "beforeActions" }),
      ],
    });
    const groups = view.findAllComponents(ResultImages);
    expect(groups.map((g) => g.findAll("img").map((i) => i.attributes("src")))).toEqual([
      ["https://img.test/banner.png"],
      ["https://img.test/score.png"],
      ["https://img.test/actions.png"],
    ]);
    expect(view.find("img").attributes("alt")).toBe("Banner");
  });

  test("shows a tier's image only when the score lands in that tier", () => {
    const images = [
      img({ src: "https://img.test/all.png" }),
      img({ src: "https://img.test/low.png", tier: 0 }),
      img({ src: "https://img.test/high.png", tier: 1 }),
    ];
    const base = { images, min: 0, max: 100, statusLabels: ["Low", "High"] };
    expect(srcs(render({ ...base, score: 10 }))).toEqual(["https://img.test/all.png", "https://img.test/low.png"]);
    expect(srcs(render({ ...base, score: 90 }))).toEqual(["https://img.test/all.png", "https://img.test/high.png"]);
    expect(srcs(render({ ...base, score: undefined }))).toEqual(["https://img.test/all.png"]);
  });

  test("the editor's preview shows every image, naming a tier's", () => {
    const view = render({
      preview: true,
      statusLabels: ["Low", "High"],
      images: [img({ tier: 1 }), img({ src: "" })],
    });
    expect(view.findAll("img")).toHaveLength(1);
    expect(view.text()).toContain("Only for: High");
    expect(view.text()).toContain(surveyResult.en.images.empty);
  });

  test("leaves out an image that fails to load, or has an unsafe address", async () => {
    const view = render({ images: [img({}), img({ src: "javascript:alert(1)" })] });
    expect(view.findAll("img")).toHaveLength(1);
    await view.find("img").trigger("error");
    expect(view.findAll("img")).toHaveLength(0);
    expect(view.findComponent(ResultImages).find("figure").exists()).toBe(false);
  });

  test("shows a caption", () => {
    expect(render({ images: [img({ caption: "Your heart" })] }).find("figcaption").text()).toBe("Your heart");
  });
});

describe("SurveyResult button rows", () => {
  const rows = (actions: ResultAction[]) =>
    mountWithCreator(SurveyResult, { props: { actions } })
      .child.findAll("div.sm\\:flex-row")
      .map((row) => row.findAll("button, a").map((b) => b.text()));
  const a = (label: string, variant: ResultAction["variant"]): ResultAction => ({
    id: label,
    label,
    type: "custom",
    variant,
  });

  test("two filled buttons share a row", () => {
    expect(rows([a("S", "secondary"), a("P", "primary")])).toEqual([["S", "P"]]);
  });

  test("with three or more, the primary ones get the first row", () => {
    expect(rows([a("S1", "secondary"), a("P", "primary"), a("S2", "secondary")])).toEqual([
      ["P"],
      ["S1", "S2"],
    ]);
  });
});
