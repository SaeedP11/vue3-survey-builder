import { mount } from "@vue/test-utils";
import { ElementFactory, Model, Serializer } from "survey-core";
import { ComponentFactory, SurveyComponent } from "survey-vue3-ui";
import { editorLocalization } from "survey-creator-core";
import { describe, expect, test } from "vitest";
import ChartQuestion from "../../src/components/ChartQuestion.vue";
import registerChartQuestion, {
  QuestionChartModel,
} from "../../src/utils/registerChartQuestion.ts";
import { createTestI18n, flush, newCreator } from "./helpers.ts";

registerChartQuestion();

const JSON_ = {
  elements: [
    { type: "text", name: "weight", inputType: "number" },
    { type: "text", name: "height", inputType: "number" },
    {
      type: "chart",
      name: "body",
      title: "Body",
      chartType: "bar",
      unit: "kg",
      items: [
        { value: "w", text: "Weight", expression: "{weight}" },
        { value: "h", text: "Height", expression: "{height} / 2", color: "#123456" },
        { value: "c", text: "Constant", expression: "10" },
      ],
    },
  ],
};

function chartOf(survey: Model) {
  return survey.getQuestionByName("body") as QuestionChartModel;
}

describe("chart question model", () => {
  test("is registered for JSON, the toolbox and the renderer", () => {
    expect(Serializer.findClass("chart")).toBeTruthy();
    expect(Serializer.findClass("chartitem")).toBeTruthy();
    expect(ElementFactory.Instance.getAllTypes()).toContain("chart");
    expect(ComponentFactory.Instance.getComponent("survey-chart")).toBe(ChartQuestion);
  });

  test("registering twice is harmless", () => {
    expect(() => registerChartQuestion()).not.toThrow();
  });

  test("round-trips through JSON with its items", () => {
    const survey = new Model(JSON_);
    // "bar" is the default, so SurveyJS leaves it out
    const { chartType: _, ...saved } = JSON_.elements[2];
    expect(survey.toJSON().pages[0].elements[2]).toEqual(saved);
    expect(new Model({ elements: [{ ...saved, chartType: "donut" }] }).toJSON().pages[0].elements[0].chartType).toBe("donut");
    const chart = chartOf(survey);
    expect(chart.chartType).toBe("bar");
    expect(chart.items.map((i) => i.getType())).toEqual(["chartitem", "chartitem", "chartitem"]);
  });

  test("evaluates each item's expression against the answers, live", () => {
    const survey = new Model(JSON_);
    const chart = chartOf(survey);
    expect(chart.chartValues).toEqual({ w: null, h: null, c: 10 });

    survey.setValue("weight", 72);
    survey.setValue("height", 180);
    expect(chart.chartValues).toEqual({ w: 72, h: 90, c: 10 });

    survey.setValue("weight", "not a number");
    expect(chart.chartValues.w).toBeNull();
  });

  test("adds nothing to the survey's data and never blocks completion", () => {
    const survey = new Model(JSON_);
    survey.setValue("weight", 70);
    const chart = chartOf(survey);
    expect(chart.hasInput).toBe(false);
    expect(chart.validate()).toBe(true);
    expect(survey.data).toEqual({ weight: 70 });
  });

  test("hides the answer and validation properties from the designer", () => {
    for (const name of ["isRequired", "defaultValue", "validators", "readOnly"]) {
      expect(Serializer.findProperty("chart", name).visible, name).toBe(false);
    }
    expect(Serializer.findProperty("chart", "items").type).toBe("chartitem[]");
  });

  test("has designer strings in both languages", () => {
    for (const code of ["en", "fa"]) {
      const locale = editorLocalization.getLocale(code);
      expect(locale.qt.chart, code).toBeTruthy();
      expect(locale.pe.chart.items, code).toBeTruthy();
      expect(locale.pe.chartitem.expression, code).toBeTruthy();
      expect(locale.pv.chartType.donut, code).toBeTruthy();
    }
  });

  test("the designer's toolbox lists the chart with its icon, and adds a working one", () => {
    const creator = newCreator();
    const tool = creator.toolbox.getItemByName("chart");
    expect(tool).toBeTruthy();
    expect(tool.iconName).toBe("icon-chart");
    expect(tool.title).toBe("Chart");
    const added = creator.survey.currentPage
      ? creator.survey.currentPage.addNewQuestion("chart", "chart1")
      : creator.survey.addNewPage("p").addNewQuestion("chart", "chart1");
    expect(added).toBeInstanceOf(QuestionChartModel);
  });

  test("the designer's property grid edits items with an expression column", () => {
    const creator = newCreator(JSON_);
    const chart = creator.survey.getQuestionByName("body");
    creator.selectElement(chart);
    const items = creator.propertyGrid.getQuestionByName("items") as unknown as {
      columns: { name: string }[];
    };
    expect(items.columns.map((c) => c.name)).toEqual(
      expect.arrayContaining(["text", "expression"]),
    );
  });
});

/** Renders the chart the way a filled form does: inside SurveyJS's own survey. */
async function render(json: object, data: Record<string, unknown> = {}, locale = "en") {
  const survey = new Model({ elements: [json] });
  survey.data = data;
  const wrapper = mount(SurveyComponent, {
    props: { model: survey },
    global: { plugins: [createTestI18n(locale)] },
    attachTo: document.body,
  });
  await flush();
  return { wrapper, survey };
}

const item = (value: string, text: string, expression: string) => ({
  value,
  text,
  expression,
});

describe("ChartQuestion", () => {
  test("asks for data rows when the chart has none", async () => {
    const { wrapper } = await render({ type: "chart", name: "c" });
    expect(wrapper.text()).toContain("Add data rows");
  });

  test("waits for answers before drawing", async () => {
    const { wrapper } = await render({
      type: "chart",
      name: "c",
      items: [item("a", "A", "{x}")],
    });
    expect(wrapper.text()).toContain("fills in as the form is answered");
    expect(wrapper.find("svg.fb-chart__svg").exists()).toBe(false);
  });

  test("draws a bar per item with a number, and redraws as answers change", async () => {
    const { wrapper, survey } = await render(
      { type: "chart", name: "c", items: [item("a", "A", "{x}"), item("b", "B", "{y}")] },
      { x: 4 },
    );
    expect(wrapper.findAll("path.fb-chart__bar")).toHaveLength(1);
    survey.setValue("y", 8);
    await flush();
    expect(wrapper.findAll("path.fb-chart__bar")).toHaveLength(2);
    expect(wrapper.find("svg.fb-chart__svg").attributes("aria-label")).toContain("A 4");
  });

  test("lists the numbers in a table for screen readers", async () => {
    const { wrapper } = await render(
      { type: "chart", name: "c", unit: "kg", items: [item("a", "Weight", "72")] },
    );
    const row = wrapper.find(".fb-chart__sr tbody tr");
    expect(row.find("th").text()).toBe("Weight");
    expect(row.find("td").text()).toBe("72 kg");
  });

  test("draws a line with a marker per point", async () => {
    const { wrapper } = await render({
      type: "chart",
      name: "c",
      chartType: "line",
      items: [item("a", "A", "1"), item("b", "B", "3"), item("c", "C", "2")],
    });
    expect(wrapper.findAll("path.fb-chart__line")).toHaveLength(1);
    expect(wrapper.findAll("circle.fb-chart__marker")).toHaveLength(3);
  });

  test("draws horizontal bars as rows, scaled to the axis maximum", async () => {
    const { wrapper } = await render({
      type: "chart",
      name: "c",
      chartType: "horizontalBar",
      maxValue: 200,
      items: [item("a", "A", "50")],
    });
    const fill = wrapper.find(".fb-chart__fill");
    expect(fill.attributes("style")).toContain("inline-size: 25%");
  });

  test("a donut shows shares and folds a ninth slice into Other", async () => {
    const items = Array.from({ length: 10 }, (_, i) => item(`k${i}`, `S${i}`, "1"));
    const { wrapper } = await render({ type: "chart", name: "c", chartType: "donut", items });
    const legend = wrapper.findAll(".fb-chart__legend li");
    expect(legend).toHaveLength(8);
    expect(legend[7].text()).toContain("Other");
    expect(legend[7].text()).toContain("3");
    expect(legend[0].find(".fb-chart__legend-share").text()).toBe("10%");
  });

  test("shows the hovered value in the tooltip", async () => {
    const { wrapper } = await render(
      { type: "chart", name: "c", items: [item("a", "Apples", "5")] },
    );
    await wrapper.find("rect.fb-chart__hit").trigger("mouseenter");
    expect(wrapper.find(".fb-chart__tooltip").text()).toContain("Apples");
    expect(wrapper.find(".fb-chart__tooltip").classes()).toContain("is-on");
  });

  test("shows sample data in the designer", () => {
    const creator = newCreator({
      elements: [{ type: "chart", name: "c", items: [item("a", "A", "{x}")] }],
    });
    const question = creator.survey.getQuestionByName("c") as QuestionChartModel;
    const wrapper = mount(ChartQuestion, {
      props: { question },
      global: { plugins: [createTestI18n()] },
    });
    expect(wrapper.text()).toContain("Sample data");
    expect(wrapper.findAll("path.fb-chart__bar")).toHaveLength(1);
  });

  test("speaks Persian with Persian digits", async () => {
    const { wrapper } = await render(
      { type: "chart", name: "c", items: [item("a", "وزن", "72")] },
      {},
      "fa",
    );
    expect(wrapper.find(".fb-chart__sr td").text()).toBe("۷۲");
  });
});
