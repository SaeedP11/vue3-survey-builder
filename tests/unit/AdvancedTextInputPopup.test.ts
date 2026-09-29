import { mount } from "@vue/test-utils";
import { Model } from "survey-core";
import { describe, expect, test, vi } from "vitest";
import { ref } from "vue";
import AdvancedTextInputPopup from "../../src/components/AdvancedTextInputPopup.vue";
import type { AdvancedTextInput, ItemType } from "../../src/types/index.ts";

function setup({ currentPage = 1, totalPages = 3 } = {}) {
  const question = new Model({ elements: [{ type: "text", name: "q" }] }).getQuestionByName("q");
  const handlers: AdvancedTextInput = {
    items: ref<ItemType[]>([
      { value: "IR", text: "Iran" },
      { value: "JP", text: "Japan" },
    ]),
    currentPage: ref(currentPage),
    totalPages: ref(totalPages),
    handleSearch: vi.fn(),
    handleNextPage: vi.fn(),
    handlePrevPage: vi.fn(),
    onSelect: vi.fn(),
  };
  const model = {
    question,
    handlers,
    selected: ref<ItemType | null>(null),
    popupModel: { isVisible: true },
    onItemSelected: vi.fn(),
  };
  const wrapper = mount(AdvancedTextInputPopup, { props: { model } });
  const buttons = () => wrapper.findAll(".advanced-text-input-popup__pagination button");
  return { wrapper, model, handlers, question, prev: () => buttons()[0], next: () => buttons()[1] };
}

describe("AdvancedTextInputPopup", () => {
  test("lists the items", () => {
    const { wrapper } = setup();
    expect(wrapper.findAll("li").map((li) => li.text())).toEqual(["Iran", "Japan"]);
  });

  test("picking an item tells the action and the host, then closes", async () => {
    const { wrapper, model, handlers, question } = setup();
    await wrapper.findAll("li")[1].trigger("mousedown");
    const item = { value: "JP", text: "Japan" };
    expect(model.onItemSelected).toHaveBeenCalledWith(item);
    expect(handlers.onSelect).toHaveBeenCalledWith(question, item);
    expect(model.popupModel.isVisible).toBe(false);
  });

  test("works without an onSelect handler", async () => {
    const { wrapper, handlers, model } = setup();
    delete handlers.onSelect;
    await wrapper.findAll("li")[0].trigger("mousedown");
    expect(model.popupModel.isVisible).toBe(false);
  });

  test("marks the selected item", async () => {
    const { wrapper, model } = setup();
    model.selected.value = { value: "JP", text: "Japan" };
    await wrapper.vm.$nextTick();
    const [iran, japan] = wrapper.findAll("li");
    expect(japan.classes()).toContain("sv-list__item--selected");
    expect(iran.classes()).not.toContain("sv-list__item--selected");
  });

  test("searches", async () => {
    const { wrapper, handlers } = setup();
    await wrapper.find("input").setValue("ja");
    expect(handlers.handleSearch).toHaveBeenCalledWith("ja");
  });

  test("pages within bounds", async () => {
    const first = setup({ currentPage: 1 });
    expect(first.prev().attributes("disabled")).toBeDefined();
    await first.prev().trigger("mousedown");
    await first.next().trigger("mousedown");
    expect(first.handlers.handlePrevPage).not.toHaveBeenCalled();
    expect(first.handlers.handleNextPage).toHaveBeenCalledTimes(1);

    const last = setup({ currentPage: 3 });
    expect(last.next().attributes("disabled")).toBeDefined();
    await last.next().trigger("mousedown");
    await last.prev().trigger("mousedown");
    expect(last.handlers.handleNextPage).not.toHaveBeenCalled();
    expect(last.handlers.handlePrevPage).toHaveBeenCalledTimes(1);
    expect(last.wrapper.text()).toContain("3 / 3");
  });

  test("says so when there is nothing to show", async () => {
    const { wrapper, handlers } = setup();
    handlers.items.value = [];
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("No data to display");
  });
});
