import { DOMWrapper } from "@vue/test-utils";
import { describe, expect, test, vi } from "vitest";
import { nextTick, reactive } from "vue";
import SurveyResultEditor from "../../src/components/SurveyResultEditor.vue";
import { surveyResultEditor } from "../../src/locales/index.ts";
import { getDefaultProps } from "../../src/schemas/templates.ts";
import type { SurveyResultProps } from "../../src/types/index.ts";
import { mountWithCreator, newCreator } from "./helpers.ts";

const T = surveyResultEditor.en;

const WITH_SOURCES = {
  elements: [
    { type: "text", name: "age" },
    { type: "text", name: "weight" },
  ],
  calculatedValues: [{ name: "riskScore", expression: "{age} * 2" }],
};

function setup(json: object = WITH_SOURCES, overrides: Partial<SurveyResultProps> = {}) {
  const model = reactive<SurveyResultProps>({ ...getDefaultProps("en"), ...overrides });
  const creator = newCreator(json);
  const { child } = mountWithCreator(SurveyResultEditor, { creator, props: { props: model } });

  /** The inputs/selects labelled `text`, in document order. */
  const controls = (text: string) =>
    child
      .findAll("label, span")
      // Text-only elements: a <label> wrapping its <span> would match twice
      .filter((el) => el.element.children.length === 0 && el.text() === text)
      .map((el) => el.element.parentElement!.querySelector("input, select, textarea"))
      .filter((el): el is HTMLInputElement => !!el)
      .map((el) => new DOMWrapper(el));
  const control = (text: string) => controls(text)[0];
  const button = (text: string) => child.findAll("button").find((b) => b.text() === text);
  const optionValues = (select: DOMWrapper<Element>) =>
    select.findAll("option").map((o) => (o.element as HTMLOptionElement).value);

  return { model, creator, child, controls, control, button, optionValues };
}

describe("score", () => {
  test("offers every display, translated", () => {
    const { control } = setup();
    const select = control(T.fields.scoreDisplay.label);
    expect(select.findAll("option").map((o) => o.text())).toEqual(
      Object.values(T.options.scoreDisplay),
    );
  });

  test("offers the survey's questions and calculated values as the score", async () => {
    const { control, optionValues, model } = setup();
    const select = control(T.fields.score.label);
    expect(optionValues(select)).toEqual(["", "age", "weight", "riskScore"]);
    expect(select.findAll("optgroup").map((g) => g.attributes("label"))).toEqual([
      T.questions,
      T.calculatedValues,
    ]);

    await select.setValue("riskScore");
    expect(model.score).toBe("riskScore");
  });

  test("picks up questions added in the designer", async () => {
    const { creator, control, optionValues } = setup();
    creator.survey.pages[0].addNewQuestion("text", "height");
    creator.onModified.fire(creator, {} as never);
    await nextTick();
    expect(optionValues(control(T.fields.score.label))).toContain("height");
  });

  test("without questions, says so and links to the survey's properties", async () => {
    const { child, control, button, creator } = setup({});
    expect(control(T.fields.score.label)).toBeUndefined();
    expect(child.text()).toContain(T.noSourcesYet);

    const select = vi.spyOn(creator, "selectElement");
    await button(T.openSurveyProperties)!.trigger("click");
    expect(select).toHaveBeenCalledWith(creator.survey);
  });

  test("sets min and max as numbers", async () => {
    const { control, model } = setup();
    await control(T.fields.min.label).setValue("5");
    await control(T.fields.max.label).setValue("250");
    expect(model.min).toBe(5);
    expect(model.max).toBe(250);
  });
});

describe("table display", () => {
  test("swaps the score fields for the table rows", async () => {
    const { control, model, child } = setup();
    expect(child.text()).not.toContain(T.fields.tableRows.label);

    model.scoreDisplay = "table";
    await nextTick();
    expect(control(T.fields.score.label)).toBeUndefined();
    expect(control(T.fields.min.label)).toBeUndefined();
    expect(child.text()).toContain(T.fields.tableRows.label);
  });

  test("adds, edits and removes rows", async () => {
    const { model, button, controls, optionValues } = setup(WITH_SOURCES, { scoreDisplay: "table" });

    await button(T.addRow)!.trigger("click");
    await button(T.addRow)!.trigger("click");
    expect(model.tableRows).toHaveLength(2);
    expect(model.tableRows![0]).toMatchObject({ metric: "", value: "", min: 0, max: 100, unit: "" });
    expect(model.tableRows![0].id).not.toBe(model.tableRows![1].id);

    await controls(T.fields.metric.label)[1].setValue("Weight");
    await controls(T.fields.unit.label)[1].setValue("kg");
    await controls(T.fields.min.label)[1].setValue("40");
    await controls(T.fields.max.label)[1].setValue("120");
    const valueSelect = controls(T.fields.valueVariable.label)[1];
    expect(optionValues(valueSelect)).toEqual(["", "age", "weight", "riskScore"]);
    await valueSelect.setValue("weight");

    expect(model.tableRows![1]).toMatchObject({
      metric: "Weight",
      unit: "kg",
      min: 40,
      max: 120,
      value: "weight",
    });

    await button(T.remove)!.trigger("click");
    expect(model.tableRows).toHaveLength(1);
    expect(model.tableRows![0].metric).toBe("Weight");
  });
});

describe("status labels", () => {
  test("a newly added label can be typed into", async () => {
    const { model, button, controls } = setup(WITH_SOURCES, { statusLabels: ["Low"] });
    await button(T.addStatusLabel)!.trigger("click");
    expect(model.statusLabels).toEqual(["Low", ""]);

    const inputs = controls("2");
    await inputs[0].setValue("High");
    expect(model.statusLabels).toEqual(["Low", "High"]);
  });

  test("a cleared label can be typed into again", async () => {
    const { model, controls } = setup(WITH_SOURCES, { statusLabels: ["Low", "High"] });
    const input = controls("1")[0];
    await input.setValue("");
    await input.setValue("Lowest");
    expect(model.statusLabels).toEqual(["Lowest", "High"]);
  });

  test("removes a label but keeps at least one", async () => {
    const { model, child } = setup(WITH_SOURCES, { statusLabels: ["A", "B"] });
    const removes = () => child.findAll("button").filter((b) => b.text() === T.remove);
    await removes()[0].trigger("click");
    expect(model.statusLabels).toEqual(["B"]);
    expect(removes()[0].attributes("disabled")).toBeDefined();
  });

  test("starts a list when the template has none", async () => {
    const { model, button } = setup(WITH_SOURCES, { statusLabels: undefined });
    await button(T.addStatusLabel)!.trigger("click");
    expect(model.statusLabels).toEqual([""]);
  });
});

test("binds the brand and copy fields", async () => {
  const { control, model } = setup();
  const fields: [string, keyof SurveyResultProps][] = [
    [T.fields.brandName.label, "brandName"],
    [T.fields.brandTagline.label, "brandTagline"],
    [T.fields.categoryChip.label, "categoryChip"],
    [T.fields.title.label, "title"],
    [T.fields.subtitle.label, "subtitle"],
    [T.fields.description.label, "description"],
    [T.fields.noteText.label, "noteText"],
  ];
  for (const [label, key] of fields) {
    const input = control(label);
    expect(input, label).toBeDefined();
    await input.setValue(`new ${key}`);
    expect(model[key]).toBe(`new ${key}`);
  }
});

describe("logo", () => {
  test("its address field sets logoSrc", async () => {
    const { control, model } = setup();
    await control(T.fields.logoSrc.label).setValue("https://img.test/logo.png");
    expect(model.logoSrc).toBe("https://img.test/logo.png");
  });

  test("an uploaded file is stored as the host's upload handler answers", async () => {
    const { child, creator, model } = setup();
    creator.onUploadFile.add((_, options) => options.callback("success", "https://cdn.test/up.png"));
    const input = child.find('input[type="file"]');
    const file = new File(["x"], "logo.png", { type: "image/png" });
    Object.defineProperty(input.element, "files", { value: [file] });
    await input.trigger("change");
    expect(model.logoSrc).toBe("https://cdn.test/up.png");
  });

  test("refuses a file that is not an image", async () => {
    const { child, model } = setup();
    const input = child.find('input[type="file"]');
    Object.defineProperty(input.element, "files", {
      value: [new File(["x"], "a.txt", { type: "text/plain" })],
    });
    await input.trigger("change");
    expect(model.logoSrc).toBe("");
    expect(child.text()).toContain(T.imageField.notImage);
  });
});

describe("images", () => {
  test("adds, edits, orders and removes images", async () => {
    const { button, child, model } = setup();
    expect(child.text()).toContain(T.images.empty);
    await button(T.images.add)!.trigger("click");
    await button(T.images.add)!.trigger("click");
    expect(model.images).toHaveLength(2);

    await child.findAll("input").find((i) => i.attributes("id")?.includes("-alt-0"))!.setValue("A heart");
    expect(model.images![0].alt).toBe("A heart");

    const first = model.images![0].id;
    await child.find(`button[aria-label="${T.moveDown}: Image 1"]`).trigger("click");
    expect(model.images![1].id).toBe(first);

    await child.find(`button[aria-label="${T.remove}: Image 1"]`).trigger("click");
    expect(model.images!.map((i) => i.id)).toEqual([first]);
  });

  test("offers every result or one of the status labels", async () => {
    const { button, child, model } = setup(WITH_SOURCES, { statusLabels: ["Low", "High"] });
    await button(T.images.add)!.trigger("click");
    const select = child.findAll("select").find((s) => s.attributes("id")?.includes("-tier-0"))!;
    expect(select.findAll("option").map((o) => o.text())).toEqual([T.images.everyResult, "Low", "High"]);
    await select.setValue("1");
    expect(model.images![0].tier).toBe(1);
    await select.setValue("");
    expect(model.images![0].tier).toBeUndefined();
  });
});

describe("buttons", () => {
  const field = (child: ReturnType<typeof setup>["child"], name: string, index = 0) =>
    child.findAll("input, select").find((el) => el.attributes("id")?.endsWith(`-${name}-${index}`));

  test("lists the template's buttons and adds a link button", async () => {
    const { button, child, model } = setup();
    expect(model.actions).toHaveLength(3);
    await button(T.actions.add)!.trigger("click");
    expect(model.actions![3]).toMatchObject({ type: "link", variant: "secondary", newTab: true });
    expect(field(child, "url", 3)).toBeDefined();
  });

  test("a link's address is checked, and a custom button's id shown", async () => {
    const { child, model } = setup(WITH_SOURCES, {
      actions: [{ id: "a", label: "A", type: "link", url: "" }],
    });
    await field(child, "url")!.setValue("javascript:alert(1)");
    expect(child.text()).toContain(T.actions.urlInvalid);
    await field(child, "url")!.setValue("https://x.test/?s={riskScore}");
    expect(child.text()).not.toContain(T.actions.urlInvalid);
    expect(model.actions![0].url).toBe("https://x.test/?s={riskScore}");

    await field(child, "type")!.setValue("custom");
    expect(model.actions![0]).toMatchObject({ type: "custom", icon: "none" });
    expect(field(child, "url")).toBeUndefined();
    expect(field(child, "id")).toBeDefined();
  });

  test("warns about two buttons with one id", () => {
    const { child } = setup(WITH_SOURCES, {
      actions: [
        { id: "same", label: "A", type: "custom" },
        { id: "same", label: "B", type: "custom" },
      ],
    });
    expect(child.text()).toContain(T.actions.idDuplicate);
  });

  test("sets the style", async () => {
    const { child, model } = setup();
    const secondary = child
      .findAll('input[type="radio"]')
      .find((r) => r.attributes("value") === "secondary")!;
    await secondary.setValue(true);
    expect(model.actions![0].variant).toBe("secondary");
  });
});
