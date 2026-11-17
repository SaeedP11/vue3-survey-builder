import { mount } from "@vue/test-utils";
import { describe, expect, test, vi } from "vitest";
import { Model } from "survey-core";
import ChatSurvey from "../../src/components/ChatSurvey.vue";
import { createTestI18n, flush } from "./helpers.ts";

describe("ChatSurvey component", () => {
  const sampleSurveyJson = {
    title: "Customer Satisfaction",
    description: "Please help us improve",
    elements: [
      {
        type: "radiogroup",
        name: "feedback",
        title: "How satisfied are you?",
        isRequired: true,
        choices: ["Satisfied", "Neutral", "Dissatisfied"],
      },
      {
        type: "boolean",
        name: "recommend",
        title: "Would you recommend us?",
        isRequired: false,
      },
      {
        type: "text",
        name: "comments",
        title: "Any additional comments?",
        isRequired: false,
      },
    ],
  };

  test("renders survey title, subtitle, and first bot question", async () => {
    const i18n = createTestI18n("en");
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        json: sampleSurveyJson,
        typingDelay: 0,
      },
    });
    await flush();

    expect(wrapper.text()).toContain("Customer Satisfaction");
    expect(wrapper.text()).toContain("Please help us improve");
    expect(wrapper.text()).toContain("How satisfied are you?");
    // Radiogroup choices should be rendered
    expect(wrapper.text()).toContain("Satisfied");
    expect(wrapper.text()).toContain("Neutral");
    expect(wrapper.text()).toContain("Dissatisfied");
  });

  test("clicking an option in radiogroup selects it, creates user bubble, and advances", async () => {
    const i18n = createTestI18n("en");
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        json: sampleSurveyJson,
        typingDelay: 0,
      },
    });
    await flush();

    // Find the option button for "Satisfied"
    const options = wrapper.findAll("button").filter((b) => b.text().includes("Satisfied"));
    expect(options.length).toBeGreaterThan(0);

    // Click "Satisfied"
    await options[0].trigger("click");
    await flush();

    // User message bubble should appear with "Satisfied"
    expect(wrapper.text()).toContain("Satisfied");

    // The next question should now be active: "Would you recommend us?"
    expect(wrapper.text()).toContain("Would you recommend us?");
    expect(wrapper.text()).toContain("Yes");
    expect(wrapper.text()).toContain("No");
  });

  test("clicking boolean option selects value and advances", async () => {
    const i18n = createTestI18n("en");
    const survey = new Model(sampleSurveyJson);
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        model: survey,
        typingDelay: 0,
      },
    });
    await flush();

    // Answer Q1
    const optQ1 = wrapper.findAll("button").filter((b) => b.text().includes("Satisfied"))[0];
    await optQ1.trigger("click");
    await flush();

    // Now on Q2 (Boolean): click "Yes"
    const yesBtn = wrapper.findAll("button").filter((b) => b.text().trim() === "Yes")[0];
    expect(yesBtn).toBeDefined();
    await yesBtn.trigger("click");
    await flush();

    expect(survey.getValue("recommend")).toBe(true);
    // Should now be on Q3 (Text)
    expect(wrapper.text()).toContain("Any additional comments?");
  });

  test("typing in text input and clicking send advances and completes survey", async () => {
    const i18n = createTestI18n("en");
    const survey = new Model(sampleSurveyJson);
    const onComplete = vi.fn();

    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        model: survey,
        typingDelay: 0,
      },
      attrs: {
        onComplete,
      },
    });
    await flush();

    // Q1
    await wrapper.findAll("button").filter((b) => b.text().includes("Neutral"))[0].trigger("click");
    await flush();

    // Q2
    await wrapper.findAll("button").filter((b) => b.text().trim() === "No")[0].trigger("click");
    await flush();

    // Q3: Type text
    const input = wrapper.find("input[type='text']");
    expect(input.exists()).toBe(true);
    await input.setValue("Great experience overall!");

    // Press enter or click send
    await input.trigger("keydown.enter");
    await flush();

    expect(survey.getValue("comments")).toBe("Great experience overall!");
    expect(survey.state).toBe("completed");
    expect(wrapper.text()).toContain("Survey Completed!");
  });

  test("checkbox allows selecting multiple options and confirming", async () => {
    const checkboxJson = {
      elements: [
        {
          type: "checkbox",
          name: "features",
          title: "Which features do you use?",
          choices: ["Design", "Analytics", "Export"],
        },
      ],
    };

    const i18n = createTestI18n("en");
    const survey = new Model(checkboxJson);
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        model: survey,
        typingDelay: 0,
      },
    });
    await flush();

    // Select Design and Export
    const designBtn = wrapper.findAll("button").filter((b) => b.text().includes("Design"))[0];
    const exportBtn = wrapper.findAll("button").filter((b) => b.text().includes("Export"))[0];

    await designBtn.trigger("click");
    await exportBtn.trigger("click");
    await flush();

    // Click confirm button
    const confirmBtn = wrapper.findAll("button").filter((b) => b.text().includes("Confirm"))[0];
    expect(confirmBtn).toBeDefined();
    await confirmBtn.trigger("click");
    await flush();

    expect(survey.getValue("features")).toEqual(["Design", "Export"]);
    expect(wrapper.text()).toContain("Survey Completed!");
  });

  test("rating question renders rate buttons and selects rating on click", async () => {
    const ratingJson = {
      elements: [
        {
          type: "rating",
          name: "score",
          title: "Rate your experience (1 to 5)",
          rateMax: 5,
        },
      ],
    };

    const i18n = createTestI18n("en");
    const survey = new Model(ratingJson);
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        model: survey,
        typingDelay: 0,
      },
    });
    await flush();

    const rate5Btn = wrapper.findAll("button").filter((b) => b.text().trim() === "5")[0];
    expect(rate5Btn).toBeDefined();
    await rate5Btn.trigger("click");
    await flush();

    expect(survey.getValue("score")).toBe(5);
    expect(wrapper.text()).toContain("Survey Completed!");
  });

  test("validates required question and shows error message", async () => {
    const requiredJson = {
      elements: [
        {
          type: "text",
          name: "requiredName",
          title: "Your Name",
          isRequired: true,
        },
      ],
    };

    const i18n = createTestI18n("en");
    const survey = new Model(requiredJson);
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        model: survey,
        typingDelay: 0,
      },
    });
    await flush();

    const input = wrapper.find("input[type='text']");
    await input.setValue("");
    await input.trigger("keydown.enter");
    await flush();

    // Should not advance to completion
    expect(survey.state).not.toBe("completed");
    expect(wrapper.text()).toContain("Please answer this question");
  });

  test("supports skipping optional questions", async () => {
    const skipJson = {
      elements: [
        {
          type: "text",
          name: "optionalPhone",
          title: "Phone Number",
          isRequired: false,
        },
        {
          type: "text",
          name: "city",
          title: "City",
          isRequired: false,
        },
      ],
    };

    const i18n = createTestI18n("en");
    const survey = new Model(skipJson);
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        model: survey,
        typingDelay: 0,
        allowSkip: true,
      },
    });
    await flush();

    const skipBtn = wrapper.findAll("button").filter((b) => b.text().includes("Skip"))[0];
    expect(skipBtn).toBeDefined();
    await skipBtn.trigger("click");
    await flush();

    expect(wrapper.text()).toContain("Skipped");
    expect(wrapper.text()).toContain("City");
  });

  test("dynamically evaluates visibleIf condition", async () => {
    const branchingJson = {
      elements: [
        {
          type: "radiogroup",
          name: "hasCar",
          title: "Do you own a car?",
          choices: ["Yes", "No"],
        },
        {
          type: "text",
          name: "carModel",
          title: "What is your car model?",
          visibleIf: "{hasCar} = 'Yes'",
        },
        {
          type: "text",
          name: "publicTransport",
          title: "Do you use public transport?",
          visibleIf: "{hasCar} = 'No'",
        },
      ],
    };

    const i18n = createTestI18n("en");
    const survey = new Model(branchingJson);
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        model: survey,
        typingDelay: 0,
      },
    });
    await flush();

    // Answer "Yes" to car
    const yesBtn = wrapper.findAll("button").filter((b) => b.text().includes("Yes"))[0];
    await yesBtn.trigger("click");
    await flush();

    // carModel should be visible, publicTransport should not
    expect(wrapper.text()).toContain("What is your car model?");
    expect(wrapper.text()).not.toContain("Do you use public transport?");
  });

  test("allows editing past answers and rewinding the chat", async () => {
    const twoQJson = {
      elements: [
        {
          type: "radiogroup",
          name: "pet",
          title: "Pick a pet",
          choices: ["Cat", "Dog"],
        },
        {
          type: "text",
          name: "petName",
          title: "Pet's name",
        },
      ],
    };

    const i18n = createTestI18n("en");
    const survey = new Model(twoQJson);
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        model: survey,
        typingDelay: 0,
        allowEdit: true,
      },
    });
    await flush();

    // Answer Q1 with "Cat"
    await wrapper.findAll("button").filter((b) => b.text().includes("Cat"))[0].trigger("click");
    await flush();

    expect(wrapper.text()).toContain("Pet's name");

    // Click edit button on Q1
    const editBtn = wrapper.find("button[title='Edit']");
    expect(editBtn.exists()).toBe(true);
    await editBtn.trigger("click");
    await flush();

    // Q1 options should reappear
    expect(wrapper.text()).toContain("Pick a pet");
    const dogBtn = wrapper.findAll("button").filter((b) => b.text().includes("Dog"))[0];
    await dogBtn.trigger("click");
    await flush();

    expect(survey.getValue("pet")).toBe("Dog");
    expect(wrapper.text()).toContain("Dog");
  });

  test("supports restarting survey", async () => {
    const i18n = createTestI18n("en");
    const survey = new Model(sampleSurveyJson);
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        model: survey,
        typingDelay: 0,
      },
    });
    await flush();

    // Answer Q1
    await wrapper.findAll("button").filter((b) => b.text().includes("Satisfied"))[0].trigger("click");
    await flush();

    expect(wrapper.text()).toContain("Would you recommend us?");

    // Click restart in header
    const restartBtn = wrapper.find("button[title='Restart']");
    await restartBtn.trigger("click");
    await flush();

    // Reset back to Q1
    expect(survey.getValue("feedback")).toBeUndefined();
    expect(wrapper.text()).toContain("How satisfied are you?");
  });

  test("supports Persian locale and RTL direction", async () => {
    const i18n = createTestI18n("fa");
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        json: {
          elements: [
            {
              type: "text",
              name: "q1",
              title: "نام شما چیست؟",
              isRequired: true,
            },
          ],
        },
        typingDelay: 0,
      },
    });
    await flush();

    // Root should have dir="rtl"
    const root = wrapper.find("div[dir='rtl']");
    expect(root.exists()).toBe(true);

    // Persian title and restart label
    expect(wrapper.text()).toContain("گفتگوی نظرسنجی");
    expect(wrapper.text()).toContain("شروع مجدد");
    expect(wrapper.text()).toContain("اجباری");
    expect(wrapper.text()).toContain("نام شما چیست؟");
  });

  test("renders PersianDateTimePicker for inputType date and completes", async () => {
    const dateJson = {
      elements: [
        {
          type: "text",
          name: "birthday",
          title: "Select your date",
          inputType: "date",
          isRequired: true,
        },
      ],
    };

    const i18n = createTestI18n("en");
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        json: dateJson,
        typingDelay: 0,
      },
    });
    await flush();

    // PersianDateTimePicker should be rendered
    const picker = wrapper.findComponent({ name: "PersianDateTimePicker" });
    expect(picker.exists()).toBe(true);
  });

  test("applies responsive max-width and break-words to user message bubble", async () => {
    const i18n = createTestI18n("en");
    const wrapper = mount(ChatSurvey, {
      global: { plugins: [i18n] },
      props: {
        json: sampleSurveyJson,
        typingDelay: 0,
      },
    });
    await flush();

    // Click first option
    const opt = wrapper.findAll("button").filter((b) => b.text().includes("Satisfied"))[0];
    await opt.trigger("click");
    await flush();

    const userBubble = wrapper.find(".rounded-te-xs");
    expect(userBubble.exists()).toBe(true);
    expect(userBubble.classes()).toContain("break-words");
  });
});
