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

describe("RenderResult", () => {
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

  test("emits primary, secondary and close from its buttons", async () => {
    const view = render(getDefaultProps("en"));
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
