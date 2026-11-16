import { mount } from "@vue/test-utils";
import { describe, expect, test, vi } from "vitest";
import { Model } from "survey-core";
import { createTestI18n, flush } from "./helpers";
import { useSurveyChat } from "../../src/composables/useSurveyChat";
import { chatQuestionRegistry, ChatQuestionRegistry } from "../../src/components/chat/registry";
import "../../src/components/chat/registerBuiltInQuestions";
import SurveyChat from "../../src/components/chat/SurveyChat.vue";
import SurveyChatWidget from "../../src/components/chat/SurveyChatWidget.vue";
import SurveyChatModal from "../../src/components/chat/SurveyChatModal.vue";
import SurveyChatInline from "../../src/components/chat/SurveyChatInline.vue";
import { defineComponent, h } from "vue";

describe("useSurveyChat composable", () => {
  const sampleSurveyJson = {
    title: "Customer Feedback",
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "text",
            name: "customerName",
            title: "What is your name?",
            isRequired: true,
          },
          {
            type: "radiogroup",
            name: "experience",
            title: "How was your experience?",
            choices: [
              { value: "good", text: "Good" },
              { value: "bad", text: "Bad" },
            ],
            isRequired: true,
          },
          {
            type: "comment",
            name: "feedbackDetail",
            title: "What went wrong?",
            visibleIf: "{experience} = 'bad'",
            isRequired: true,
          },
          {
            type: "rating",
            name: "score",
            title: "Rate us from 1 to 5",
            rateMin: 1,
            rateMax: 5,
          },
        ],
      },
    ],
  };

  test("initializes greeting and first question without typing delay", async () => {
    const model = new Model(sampleSurveyJson);
    const chat = useSurveyChat(model, {
      persona: {
        name: "Support Bot",
        greeting: "Hello, welcome!",
        typingSpeedMs: 0,
      },
    });

    chat.start();
    await flush();

    expect(chat.messages.value.length).toBe(2);
    expect(chat.messages.value[0].sender).toBe("bot");
    expect(chat.messages.value[0].text).toBe("Hello, welcome!");

    expect(chat.messages.value[1].sender).toBe("bot");
    expect(chat.messages.value[1].questionName).toBe("customerName");
    expect(chat.activeQuestion.value?.name).toBe("customerName");
  });

  test("validates required questions and rejects empty answers", async () => {
    const model = new Model(sampleSurveyJson);
    const chat = useSurveyChat(model, { persona: { typingSpeedMs: 0 } });
    chat.start();
    await flush();

    const q1 = chat.activeQuestion.value!;
    const success = await chat.submitAnswer(q1, "");

    expect(success).toBe(false);
    expect(chat.errorMessage.value).toBeTruthy();
    expect(chat.activeQuestion.value?.name).toBe("customerName");
  });

  test("advances and follows conditional branching (visibleIf)", async () => {
    const model = new Model(sampleSurveyJson);
    const chat = useSurveyChat(model, { persona: { typingSpeedMs: 0 } });
    chat.start();
    await flush();

    // Answer Q1: customerName
    await chat.submitAnswer(chat.activeQuestion.value!, "Alice");
    await flush();

    expect(chat.activeQuestion.value?.name).toBe("experience");

    // Answer Q2: experience = 'good' -> feedbackDetail should be SKIPPED because visibleIf: "{experience} = 'bad'"
    await chat.submitAnswer(chat.activeQuestion.value!, "good");
    await flush();

    expect(chat.activeQuestion.value?.name).toBe("score");
  });

  test("shows conditional question when visibleIf condition is met", async () => {
    const model = new Model(sampleSurveyJson);
    const chat = useSurveyChat(model, { persona: { typingSpeedMs: 0 } });
    chat.start();
    await flush();

    // Answer Q1: customerName
    await chat.submitAnswer(chat.activeQuestion.value!, "Bob");
    await flush();

    // Answer Q2: experience = 'bad' -> feedbackDetail SHOULD be presented
    await chat.submitAnswer(chat.activeQuestion.value!, "bad");
    await flush();

    expect(chat.activeQuestion.value?.name).toBe("feedbackDetail");
  });

  test("completes survey when all visible questions are answered", async () => {
    const model = new Model(sampleSurveyJson);
    const completeSpy = vi.fn();
    model.onComplete.add(completeSpy);

    const chat = useSurveyChat(model, { persona: { typingSpeedMs: 0 } });
    chat.start();
    await flush();

    await chat.submitAnswer(chat.activeQuestion.value!, "Alice");
    await flush();
    await chat.submitAnswer(chat.activeQuestion.value!, "good");
    await flush();
    await chat.submitAnswer(chat.activeQuestion.value!, 5);
    await flush();

    expect(chat.isCompleted.value).toBe(true);
    expect(chat.activeQuestion.value).toBeNull();
    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(model.data).toMatchObject({
      customerName: "Alice",
      experience: "good",
      score: 5,
    });
  });

  test("editAnswer rolls back message stream and re-presents question", async () => {
    const model = new Model(sampleSurveyJson);
    const chat = useSurveyChat(model, { persona: { typingSpeedMs: 0 } });
    chat.start();
    await flush();

    await chat.submitAnswer(chat.activeQuestion.value!, "Alice");
    await flush();
    expect(chat.activeQuestion.value?.name).toBe("experience");

    // Roll back Q1 answer (message index 1 is user answer)
    const userMsgIndex = chat.messages.value.findIndex((m) => m.sender === "user");
    expect(userMsgIndex).toBeGreaterThan(-1);

    chat.editAnswer(userMsgIndex);
    await flush();

    expect(chat.activeQuestion.value?.name).toBe("customerName");
    expect(model.getValue("customerName")).toBeUndefined();
  });
});

describe("chatQuestionRegistry", () => {
  test("allows custom question registration", () => {
    const registry = new ChatQuestionRegistry();
    const DummyComponent = defineComponent({ render: () => h("div", "dummy") });

    registry.register("myCustomType", {
      component: DummyComponent,
      placement: "inline",
      formatHistoryDisplay: (val) => `custom: ${val}`,
    });

    expect(registry.has("mycustomtype")).toBe(true);
    expect(registry.get("mycustomtype")?.placement).toBe("inline");

    const q = { getType: () => "mycustomtype", displayValue: "" } as any;
    expect(registry.formatValue("123", q)).toBe("custom: 123");
  });

  test("has built-in types registered in global registry", () => {
    expect(chatQuestionRegistry.has("radiogroup")).toBe(true);
    expect(chatQuestionRegistry.has("checkbox")).toBe(true);
    expect(chatQuestionRegistry.has("rating")).toBe(true);
    expect(chatQuestionRegistry.has("matrix")).toBe(true);
    expect(chatQuestionRegistry.has("file")).toBe(true);
    expect(chatQuestionRegistry.has("signaturepad")).toBe(true);
  });
});

describe("SurveyChat components", () => {
  const i18n = createTestI18n();
  const simpleSurvey = {
    pages: [
      {
        name: "p1",
        elements: [
          { type: "text", name: "q1", title: "Question 1" },
        ],
      },
    ],
  };

  test("SurveyChat renders header and messages", async () => {
    const wrapper = mount(SurveyChat, {
      props: {
        json: simpleSurvey,
        persona: { name: "Test Bot", typingSpeedMs: 0 },
      },
      global: { plugins: [i18n] },
    });

    await flush();
    expect(wrapper.text()).toContain("Test Bot");
    expect(wrapper.text()).toContain("Question 1");
  });

  test("SurveyChatWidget opens and closes on button click", async () => {
    const wrapper = mount(SurveyChatWidget, {
      props: {
        json: simpleSurvey,
        defaultOpen: false,
        persona: { typingSpeedMs: 0 },
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.find(".survey-chat-container").exists()).toBe(false);

    // Click launcher button
    await wrapper.find("button").trigger("click");
    expect(wrapper.find(".survey-chat-container").exists()).toBe(true);

    // Toggle close
    await wrapper.find("button").trigger("click");
    expect(wrapper.find(".survey-chat-container").exists()).toBe(false);
  });

  test("SurveyChatModal emits close on escape key", async () => {
    const wrapper = mount(SurveyChatModal, {
      props: {
        open: true,
        json: simpleSurvey,
        persona: { typingSpeedMs: 0 },
      },
      global: { plugins: [i18n] },
    });

    await flush();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  test("SurveyChatInline mounts container with chat view", async () => {
    const wrapper = mount(SurveyChatInline, {
      props: {
        json: simpleSurvey,
        persona: { typingSpeedMs: 0 },
      },
      global: { plugins: [i18n] },
    });

    await flush();
    expect(wrapper.find(".survey-chat-inline-wrapper").exists()).toBe(true);
    expect(wrapper.find(".survey-chat-container").exists()).toBe(true);
  });
});
