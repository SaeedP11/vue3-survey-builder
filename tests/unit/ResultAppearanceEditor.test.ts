import { describe, expect, test } from "vitest";
import { defineComponent, h, ref } from "vue";
import ResultAppearanceEditor from "../../src/components/ResultAppearanceEditor.vue";
import type { ResultAppearance } from "../../src/types/index.ts";
import { mountWithCreator } from "./helpers.ts";

function setup(initial?: ResultAppearance) {
  const value = ref<ResultAppearance | undefined>(initial);
  const Host = defineComponent({
    setup: () => () =>
      h(ResultAppearanceEditor, {
        modelValue: value.value,
        "onUpdate:modelValue": (v: ResultAppearance | undefined) => (value.value = v),
      }),
  });
  const { wrapper } = mountWithCreator(Host);
  return { wrapper, value };
}

const field = (w: ReturnType<typeof setup>["wrapper"], key: string) =>
  w.find(`[data-appearance-field="${key}"]`);

describe("ResultAppearanceEditor", () => {
  test("sets and clamps a number, and clears it when emptied", async () => {
    const { wrapper, value } = setup();
    const input = field(wrapper, "radius");
    await input.setValue("99");
    expect(value.value).toEqual({ radius: 48 });
    await input.setValue("");
    expect(value.value).toBeUndefined();
  });

  test("keeps a colour only when it is safe", async () => {
    const { wrapper, value } = setup({ chipColor: "#112233" });
    await field(wrapper, "chipColor").setValue("not-a-colour");
    expect(value.value).toEqual({ chipColor: "#112233" });
    await field(wrapper, "chipColor").setValue("#abcdef");
    expect(value.value).toEqual({ chipColor: "#abcdef" });
  });

  test("toggles store false only and the shape select works", async () => {
    const { wrapper, value } = setup();
    await field(wrapper, "showHeader").setValue(false);
    expect(value.value).toEqual({ showHeader: false });
    await field(wrapper, "showHeader").setValue(true);
    expect(value.value).toBeUndefined();
    await field(wrapper, "buttonShape").setValue("pill");
    expect(value.value).toEqual({ buttonShape: "pill" });
  });

  test("reset clears the look and hides itself", async () => {
    const { wrapper, value } = setup({ gap: 10 });
    await wrapper.find("[data-appearance-reset]").trigger("click");
    expect(value.value).toBeUndefined();
    expect(wrapper.find("[data-appearance-reset]").exists()).toBe(false);
  });

  test("clicking a preset applies its theme values", async () => {
    const { wrapper, value } = setup();
    const oceanBtn = wrapper.findAll("button").find((b) => b.text().includes("Ocean Breeze"));
    expect(oceanBtn?.exists()).toBe(true);
    await oceanBtn!.trigger("click");
    expect(value.value).toMatchObject({
      chipBackground: "#e0f2fe",
      chipColor: "#0284c7",
      buttonShape: "pill",
      cardShadow: "md",
    });
  });
});
