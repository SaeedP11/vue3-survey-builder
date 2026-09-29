import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { markRaw, reactive, ref } from "vue";
import AsyncDropdown from "../../src/components/AsyncDropdown.vue";
import type { AsyncDropdownHandlers, ItemType } from "../../src/types/index.ts";

const PAGE_1: ItemType[] = [
  { value: "IR", text: "Iran" },
  { value: "IQ", text: "Iraq" },
];
const PAGE_2: ItemType[] = [{ value: "JP", text: "Japan" }];

function setup({ value = undefined as string | undefined, totalPages = 2 } = {}) {
  const handlers: AsyncDropdownHandlers = {
    items: ref(PAGE_1),
    currentPage: ref(1),
    totalPages: ref(totalPages),
    handleSearch: vi.fn(),
    handleNextPage: vi.fn(),
    handlePrevPage: vi.fn(),
  };
  // survey-vue3-ui makes a question's properties reactive; reactive() stands in,
  // with the handlers kept raw so their refs are not unwrapped
  const question = reactive({ value, handlers: markRaw(handlers) });
  const wrapper = mount(AsyncDropdown, { props: { question } });
  const input = () => wrapper.find("input");
  const open = () => input().trigger("focus");
  const options = () => wrapper.findAll("li.sv-list__item");
  const [next, prev] = [0, 1].map((i) => () => wrapper.findAll(".pagination button")[i]);
  return { wrapper, handlers, question, input, open, options, next, prev };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("AsyncDropdown", () => {
  test("opens the list on focus and closes it after blur", async () => {
    const { wrapper, open, input, options } = setup();
    expect(wrapper.find(".sv-popup").exists()).toBe(false);
    await open();
    expect(options().map((o) => o.text())).toEqual(["Iran", "Iraq"]);

    await input().trigger("blur");
    vi.advanceTimersByTime(200);
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".sv-popup").exists()).toBe(false);
  });

  test("passes what is typed to handleSearch", async () => {
    const { handlers, open, input } = setup();
    await open();
    await input().setValue("ira");
    expect(handlers.handleSearch).toHaveBeenCalledWith("ira");
  });

  test("picking an item sets the question's value and shows its text", async () => {
    const { question, open, options, input, wrapper } = setup();
    await open();
    await options()[1].trigger("mousedown");
    expect(question.value).toBe("IQ");
    expect(wrapper.find(".sv-popup").exists()).toBe(false);
    expect((input().element as HTMLInputElement).value).toBe("Iraq");
  });

  test("keeps showing the selected text after paging away from it", async () => {
    const { handlers, open, options, input, wrapper } = setup();
    await open();
    await options()[0].trigger("mousedown");

    handlers.items.value = PAGE_2;
    await wrapper.vm.$nextTick();
    expect((input().element as HTMLInputElement).value).toBe("Iran");
  });

  test("marks the selected item", async () => {
    const { open, options } = setup({ value: "IQ" });
    await open();
    expect(options()[1].classes()).toContain("sv-list__item--selected");
    expect(options()[1].attributes("aria-selected")).toBe("true");
    expect(options()[0].attributes("aria-selected")).toBe("false");
  });

  test("pages forward and back within bounds", async () => {
    const { handlers, open, next, prev, wrapper } = setup();
    await open();
    expect(wrapper.find(".pagination").text()).toContain("1 / 2");
    expect(prev().attributes("disabled")).toBeDefined();
    await prev().trigger("mousedown");
    expect(handlers.handlePrevPage).not.toHaveBeenCalled();

    await next().trigger("mousedown");
    expect(handlers.handleNextPage).toHaveBeenCalledTimes(1);

    handlers.currentPage.value = 2;
    await wrapper.vm.$nextTick();
    expect(next().attributes("disabled")).toBeDefined();
    await next().trigger("mousedown");
    expect(handlers.handleNextPage).toHaveBeenCalledTimes(1);
    await prev().trigger("mousedown");
    expect(handlers.handlePrevPage).toHaveBeenCalledTimes(1);
  });

  test("hides the pager when there are no pages", async () => {
    const { open, wrapper } = setup({ totalPages: 0 });
    await open();
    expect(wrapper.find(".pagination").exists()).toBe(false);
  });

  test("says so when there is nothing to show", async () => {
    const { handlers, open, wrapper } = setup();
    handlers.items.value = [];
    await open();
    expect(wrapper.text()).toContain("No data to display");
  });
});
