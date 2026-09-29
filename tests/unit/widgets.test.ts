import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { Component } from "vue";
import BulletChart from "../../src/components/widgets/BulletChart.vue";
import DefaultScoreCard from "../../src/components/widgets/DefaultScoreCard.vue";
import DonutGauge from "../../src/components/widgets/DonutGauge.vue";
import LinearHealthGauge from "../../src/components/widgets/LinearHealthGauge.vue";
import RadialGauge from "../../src/components/widgets/RadialGauge.vue";
import SegmentedPills from "../../src/components/widgets/SegmentedPills.vue";
import Table from "../../src/components/widgets/Table.vue";
import TemperatureGauge from "../../src/components/widgets/TemperatureGauge.vue";
import VerticalThermometer from "../../src/components/widgets/VerticalThermometer.vue";
import { vi } from "vitest";
import { createTestI18n } from "./helpers.ts";

const LABELS = ["Tier-A", "Tier-B", "Tier-C", "Tier-D"];

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["setTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
  });
});
afterEach(() => vi.useRealTimers());

async function settle(wrapper: { vm: { $nextTick: () => Promise<void> } }) {
  await vi.advanceTimersByTimeAsync(5000);
  await wrapper.vm.$nextTick();
}

/** The score prop: two gauges take it as modelValue (SurveyResult binds it so). */
const CHARTS: [string, Component, "value" | "modelValue"][] = [
  ["DefaultScoreCard", DefaultScoreCard, "value"],
  ["LinearHealthGauge", LinearHealthGauge, "modelValue"],
  ["RadialGauge", RadialGauge, "value"],
  ["TemperatureGauge", TemperatureGauge, "modelValue"],
  ["DonutGauge", DonutGauge, "value"],
  ["BulletChart", BulletChart, "value"],
  ["VerticalThermometer", VerticalThermometer, "value"],
  ["SegmentedPills", SegmentedPills, "value"],
];

describe.each(CHARTS)("%s", (_name, widget, scoreProp) => {
  function render(score: number) {
    return mount(widget, {
      props: { [scoreProp]: score, min: 0, max: 100, statusLabels: LABELS },
      global: { plugins: [createTestI18n("en")] },
    });
  }

  test("shows the score and the lowest tier's label for a low score", async () => {
    const wrapper = render(10);
    await settle(wrapper);
    expect(wrapper.text()).toContain("10");
    expect(wrapper.text()).toContain("Tier-A");
  });

  test("shows the highest tier's label for a high score", async () => {
    const wrapper = render(95);
    await settle(wrapper);
    expect(wrapper.text()).toContain("95");
    expect(wrapper.text()).toContain("Tier-D");
  });

  test("follows a new score", async () => {
    const wrapper = render(10);
    await settle(wrapper);
    await wrapper.setProps({ [scoreProp]: 95 });
    await settle(wrapper);
    expect(wrapper.text()).toContain("Tier-D");
  });

  test("clamps a score outside the range instead of breaking", async () => {
    const wrapper = render(500);
    await settle(wrapper);
    expect(wrapper.text()).toContain("Tier-D");
    expect(wrapper.html()).not.toMatch(/NaN|Infinity/);
  });

  test("survives an empty range", async () => {
    const wrapper = mount(widget, {
      props: { [scoreProp]: 5, min: 5, max: 5, statusLabels: LABELS },
      global: { plugins: [createTestI18n("en")] },
    });
    await settle(wrapper);
    expect(wrapper.html()).not.toMatch(/NaN|Infinity/);
  });
});

describe("Table", () => {
  function render(props: Record<string, unknown>, locale = "en") {
    return mount(Table, { props, global: { plugins: [createTestI18n(locale)] } });
  }
  const statusOf = (wrapper: ReturnType<typeof render>) =>
    wrapper.findAll("tbody tr").map((tr) => tr.findAll("td").at(-1)!.text());

  test("rates each row against its range", () => {
    const wrapper = render({
      statusLabels: ["Normal", "Watch", "Alert"],
      rows: [
        { metric: "in range", value: 50, min: 0, max: 100 },
        { metric: "a little high", value: 110, min: 0, max: 100 },
        { metric: "far too high", value: 200, min: 0, max: 100 },
        { metric: "a little low", value: -10, min: 0, max: 100 },
        { metric: "far too low", value: -100, min: 0, max: 100 },
      ],
    });
    expect(statusOf(wrapper)).toEqual(["Normal", "Watch", "Alert", "Watch", "Alert"]);
  });

  test("shows value, range and unit", () => {
    const wrapper = render({
      rows: [{ metric: "Heart rate", value: 72, min: 60, max: 100, unit: "BPM" }],
    });
    const cells = wrapper.findAll("tbody td").map((td) => td.text());
    expect(cells[0]).toContain("Heart rate");
    expect(cells[1]).toContain("72");
    expect(cells[1]).toContain("BPM");
    expect(cells[2]).toBe("60 - 100");
  });

  test("shows a dash for a row without a numeric value", () => {
    const wrapper = render({ rows: [{ metric: "m", value: "", min: 0, max: 1 }] });
    expect(wrapper.findAll("tbody td")[1].text()).toBe("—");
  });

  test("falls back to sample rows when it has none", () => {
    expect(render({ rows: [] }).findAll("tbody tr").length).toBeGreaterThan(0);
  });

  test("translates its headers", () => {
    const en = render({ rows: [] }).findAll("th").map((th) => th.text());
    const fa = render({ rows: [] }, "fa").findAll("th").map((th) => th.text());
    expect(en).toEqual(["Metric / factor", "Current value", "Normal range", "Status"]);
    expect(fa).not.toEqual(en);
  });
});
