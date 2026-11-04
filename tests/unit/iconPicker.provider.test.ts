import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { mountWithCreator } from "./helpers.ts";
import { provideIconPicker } from "../../src/provider/iconPickerKey.ts";
import IconView from "../../src/components/templates/IconView.vue";
import IconPickerField from "../../src/components/IconPickerField.vue";
import { resolveAppearance } from "../../src/utils/resultLayout.ts";

const HostIcon = defineComponent({
  props: { name: String },
  setup: (p) => () => h("i", { "data-host-icon": p.name }),
});
const HostPicker = defineComponent({
  props: { modelValue: String },
  emits: ["update:modelValue"],
  setup: (_, { emit }) => () =>
    h("button", { "data-host-picker": "", onClick: () => emit("update:modelValue", "lucide:star") }),
});

function withHost<T>(comp: T, props: Record<string, unknown>, config: Parameters<typeof provideIconPicker>[0]) {
  return mountWithCreator(
    defineComponent({ setup: () => (provideIconPicker(config), () => h(comp as never, props)) }),
  ).wrapper;
}
const plain = (comp: never, props: Record<string, unknown>) => mountWithCreator(comp, { props }).wrapper;

describe("pluggable icon picker", () => {
  it("draws built in names itself and other names through the host", () => {
    const w = withHost(IconView, { name: "lucide:star" }, { icon: HostIcon });
    expect(w.find("[data-host-icon='lucide:star']").exists()).toBe(true);
    const b = withHost(IconView, { name: "arrow" }, { icon: HostIcon });
    expect(b.find("[data-host-icon]").exists()).toBe(false);
    expect(b.find("svg").exists()).toBe(true);
  });

  it("draws nothing for an unknown name without a host", () => {
    expect(plain(IconView as never, { name: "lucide:star" }).find("svg").exists()).toBe(false);
  });

  it("uses the host picker and emits its value", async () => {
    const w = withHost(IconPickerField, { modelValue: "", label: "Icon" }, { picker: HostPicker });
    await w.find("[data-host-picker]").trigger("click");
    expect(w.findComponent(IconPickerField).emitted("update:modelValue")?.[0]).toEqual(["lucide:star"]);
  });

  it("falls back to the built in select", () => {
    expect(plain(IconPickerField as never, { label: "Icon" }).find("select").exists()).toBe(true);
  });

  it("keeps a valid hero icon name only", () => {
    expect(resolveAppearance({ heroIcon: "solar:star-bold" })?.heroIcon).toBe("solar:star-bold");
    expect(resolveAppearance({ heroIcon: "<x>" })?.heroIcon).toBeUndefined();
  });
});
