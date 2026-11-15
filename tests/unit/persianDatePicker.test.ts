import { mount } from "@vue/test-utils";
import { Model, Serializer, SvgRegistry } from "survey-core";
import { ComponentFactory, SurveyComponent } from "survey-vue3-ui";
import { describe, expect, test } from "vitest";
import PersianDateTimePicker from "../../src/components/PersianDateTimePicker.vue";
import {
  registerPersianDatePicker,
} from "../../src/utils/registerPersianDatePicker";
import {
  addPersianDateTimeToolboxItems,
  registerPersianDatePickerDesigner,
} from "../../src/utils/registerPersianDatePickerDesigner";
import { createTestI18n, flush, newCreator } from "./helpers.ts";

// Ensure registration
registerPersianDatePicker();
registerPersianDatePickerDesigner();

describe("PersianDateTimePicker registration", () => {
  test("registers dateFormat property on SurveyJS text question", () => {
    const prop = Serializer.findProperty("text", "dateFormat");
    expect(prop).toBeDefined();
    expect(prop?.defaultValue).toBe("jalali");
    expect(prop?.choices).toBeDefined();
  });

  test("registers toolbox icons in SvgRegistry", () => {
    expect(SvgRegistry.icons["persian-date"]).toBeDefined();
    expect(SvgRegistry.icons["persian-datetime"]).toBeDefined();
    expect(SvgRegistry.icons["persian-time"]).toBeDefined();
  });

  test("adds Date, Date & Time, and Time items to the Creator toolbox", () => {
    const creator = newCreator();
    addPersianDateTimeToolboxItems(creator);

    const dateItem = creator.toolbox.getItemByName("persian-date");
    expect(dateItem).toBeDefined();
    expect(dateItem.json).toMatchObject({
      type: "text",
      inputType: "date",
      dateFormat: "jalali",
    });

    const datetimeItem = creator.toolbox.getItemByName("persian-datetime");
    expect(datetimeItem).toBeDefined();
    expect(datetimeItem.json).toMatchObject({
      type: "text",
      inputType: "datetime-local",
      dateFormat: "jalali",
    });

    const timeItem = creator.toolbox.getItemByName("persian-time");
    expect(timeItem).toBeDefined();
    expect(timeItem.json).toMatchObject({
      type: "text",
      inputType: "time",
    });
  });

  test("registers survey-persian-datetime-picker in ComponentFactory", () => {
    expect(
      ComponentFactory.Instance.getComponent("survey-persian-datetime-picker"),
    ).toBe(PersianDateTimePicker);
  });
});

describe("PersianDateTimePicker component standalone", () => {
  test("renders with initial Jalali date and formats display value", async () => {
    const i18n = createTestI18n("fa");
    const wrapper = mount(PersianDateTimePicker, {
      props: {
        modelValue: "1403/08/25",
        mode: "date",
      },
      global: { plugins: [i18n] },
    });

    const input = wrapper.find("input");
    expect(input.exists()).toBe(true);
    // In Persian locale, display value uses Persian digits
    expect(input.element.value).toContain("۱۴۰۳/۰۸/۲۵");
  });

  test("opens popover on click and closes on escape", async () => {
    const i18n = createTestI18n("fa");
    const wrapper = mount(PersianDateTimePicker, {
      props: {
        modelValue: "1403/08/25",
        mode: "date",
      },
      global: { plugins: [i18n] },
      attachTo: document.body,
    });

    expect(wrapper.find(".fb-datetime-picker__popover").exists()).toBe(false);

    // Click input wrapper to open
    await wrapper.find(".fb-datetime-picker__input-wrapper").trigger("click");
    expect(wrapper.find(".fb-datetime-picker__popover").exists()).toBe(true);

    // Escape closes popover
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);
    await flush();

    expect(wrapper.find(".fb-datetime-picker__popover").exists()).toBe(false);
  });

  test("picking a day in date mode emits update:modelValue and closes", async () => {
    const i18n = createTestI18n("en");
    const wrapper = mount(PersianDateTimePicker, {
      props: {
        modelValue: "1403/08/10",
        mode: "date",
        dateFormat: "jalali",
      },
      global: { plugins: [i18n] },
    });

    await wrapper.find(".fb-datetime-picker__input-wrapper").trigger("click");
    expect(wrapper.find(".fb-datetime-picker__popover").exists()).toBe(true);

    // Find day button for 15
    const dayButtons = wrapper.findAll(".fb-datetime-picker__calendar button");
    const day15 = dayButtons.find((btn) => btn.text().trim() === "15");
    expect(day15).toBeDefined();

    await day15!.trigger("click");
    await flush();

    // Emits new value
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["1403/08/15"]);
    expect(wrapper.emitted("change")?.at(-1)).toEqual(["1403/08/15"]);
    // Closes popover
    expect(wrapper.find(".fb-datetime-picker__popover").exists()).toBe(false);
  });

  test("stores Gregorian format when dateFormat='gregorian'", async () => {
    const i18n = createTestI18n("en");
    const wrapper = mount(PersianDateTimePicker, {
      props: {
        modelValue: "2024-11-15",
        mode: "date",
        dateFormat: "gregorian",
      },
      global: { plugins: [i18n] },
    });

    // 2024-11-15 is 1403/08/25 in Jalali
    const input = wrapper.find("input");
    expect(input.element.value).toBe("1403/08/25");

    await wrapper.find(".fb-datetime-picker__input-wrapper").trigger("click");

    // Select day 1
    const dayButtons = wrapper.findAll(".fb-datetime-picker__calendar button");
    const day1 = dayButtons.find((btn) => btn.text().trim() === "1");
    await day1!.trigger("click");
    await flush();

    // 1403/08/01 in Gregorian is 2024-10-22
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["2024-10-22"]);
  });

  test("clearing value emits empty string", async () => {
    const i18n = createTestI18n("en");
    const wrapper = mount(PersianDateTimePicker, {
      props: {
        modelValue: "1403/08/15",
        mode: "date",
      },
      global: { plugins: [i18n] },
    });

    const clearBtn = wrapper.find(".fb-datetime-picker__clear");
    expect(clearBtn.exists()).toBe(true);

    await clearBtn.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([""]);
  });

  test("time mode shows time controls and emits selected time", async () => {
    const i18n = createTestI18n("en");
    const wrapper = mount(PersianDateTimePicker, {
      props: {
        modelValue: "10:30",
        mode: "time",
      },
      global: { plugins: [i18n] },
    });

    await wrapper.find(".fb-datetime-picker__input-wrapper").trigger("click");
    expect(wrapper.find(".fb-datetime-picker__time").exists()).toBe(true);
    expect(wrapper.find(".fb-datetime-picker__calendar").exists()).toBe(false);

    // Click Apply
    await wrapper.find(".fb-datetime-picker__apply").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["10:30"]);
  });
});

describe("SurveyComponent integration with PersianDateTimePicker", () => {
  test("renders PersianDateTimePicker for inputType 'date' question in a survey", async () => {
    const survey = new Model({
      elements: [
        {
          type: "text",
          name: "appointmentDate",
          title: "Appointment Date",
          inputType: "date",
          dateFormat: "jalali",
        },
      ],
    });

    const i18n = createTestI18n("fa");
    const wrapper = mount(SurveyComponent, {
      props: { model: survey },
      global: { plugins: [i18n] },
      attachTo: document.body,
    });

    await flush();

    const picker = wrapper.findComponent(PersianDateTimePicker);
    expect(picker.exists()).toBe(true);

    // Setting value on survey updates picker
    survey.setValue("appointmentDate", "1403/08/25");
    await flush();

    expect(picker.find("input").element.value).toContain("۱۴۰۳/۰۸/۲۵");
  });

  test("renders normal input for standard text questions", async () => {
    const survey = new Model({
      elements: [
        {
          type: "text",
          name: "fullName",
          title: "Full Name",
          inputType: "text",
        },
      ],
    });

    const i18n = createTestI18n("en");
    const wrapper = mount(SurveyComponent, {
      props: { model: survey },
      global: { plugins: [i18n] },
      attachTo: document.body,
    });

    await flush();

    // Does NOT render PersianDateTimePicker for standard text
    expect(wrapper.findComponent(PersianDateTimePicker).exists()).toBe(false);
    expect(wrapper.find("input[type='text']").exists()).toBe(true);
  });
});
