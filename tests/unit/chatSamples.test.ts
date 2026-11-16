import { describe, expect, test } from "vitest";
import { Model } from "survey-core";
import registerChartQuestion from "../../src/utils/registerChartQuestion";
import { CHAT_SAMPLES } from "../../demo/playground/chatSamples";
import { useSurveyChat } from "../../src/composables/useSurveyChat";
import { flush } from "./helpers";

registerChartQuestion();

describe("Chat Mode Example Forms (CHAT_SAMPLES)", () => {
  test("defines 10 distinct, fully documented example forms across domains", () => {
    expect(CHAT_SAMPLES.length).toBe(10);

    const ids = new Set<string>();
    for (const sample of CHAT_SAMPLES) {
      expect(sample.id).toBeTruthy();
      expect(sample.name).toBeTruthy();
      expect(sample.category).toBeTruthy();
      expect(sample.description).toBeTruthy();
      expect(sample.badge).toBeTruthy();
      expect(sample.typesUsed.length).toBeGreaterThan(0);
      expect(sample.persona.name).toBeTruthy();
      expect(sample.persona.greeting).toBeTruthy();
      expect(sample.json).toBeTypeOf("object");

      expect(ids.has(sample.id)).toBe(false);
      ids.add(sample.id);
    }
  });

  test.each(CHAT_SAMPLES)("validates SurveyJS schema for sample: $name ($id)", async (sample) => {
    // 1. SurveyJS Model instantiation succeeds without throwing
    const model = new Model(sample.json);
    expect(model).toBeDefined();

    const questions = model.getAllQuestions();
    expect(questions.length).toBeGreaterThanOrEqual(3);

    // 2. Chat mode initialization works and shows greeting + first question
    const chat = useSurveyChat(model, {
      persona: {
        ...sample.persona,
        typingSpeedMs: 0,
      },
    });

    chat.start();
    await flush();

    expect(chat.messages.value.length).toBeGreaterThanOrEqual(2);
    expect(chat.messages.value[0].sender).toBe("bot");
    expect(chat.messages.value[0].text).toBe(sample.persona.greeting);
    expect(chat.activeQuestion.value).toBeDefined();
    expect(chat.isCompleted.value).toBe(false);
  });

  test("verifies Customer Support sample includes file upload and branching", () => {
    const sample = CHAT_SAMPLES.find((s) => s.id === "customer-support")!;
    expect(sample).toBeDefined();

    const model = new Model(sample.json);
    const fileQ = model.getQuestionByName("errorScreenshots");
    expect(fileQ).toBeDefined();
    expect(fileQ?.getType()).toBe("file");

    const invoiceQ = model.getQuestionByName("invoiceNumber");
    expect(invoiceQ?.visibleIf).toContain("issueCategory");
  });

  test("verifies Employee Onboarding includes signaturepad and file upload", () => {
    const sample = CHAT_SAMPLES.find((s) => s.id === "employee-onboarding")!;
    expect(sample).toBeDefined();

    const model = new Model(sample.json);
    const sigQ = model.getQuestionByName("employeeSignature");
    expect(sigQ).toBeDefined();
    expect(sigQ?.getType()).toBe("signaturepad");

    const fileQ = model.getQuestionByName("idVerification");
    expect(fileQ?.getType()).toBe("file");

    const laptopQ = model.getQuestionByName("laptopChoice");
    expect(laptopQ?.getType()).toBe("radiogroup");
  });

  test("verifies Usability Matrix includes matrix and ranking questions", () => {
    const sample = CHAT_SAMPLES.find((s) => s.id === "usability-matrix")!;
    expect(sample).toBeDefined();

    const model = new Model(sample.json);
    const matrixQ = model.getQuestionByName("susMatrix");
    expect(matrixQ?.getType()).toBe("matrix");

    const rankingQ = model.getQuestionByName("featurePriorities");
    expect(rankingQ?.getType()).toBe("ranking");
  });

  test("verifies Lead Qualification includes imagepicker with imageLink cards", () => {
    const sample = CHAT_SAMPLES.find((s) => s.id === "sales-qualification")!;
    expect(sample).toBeDefined();

    const model = new Model(sample.json);
    const imgQ: any = model.getQuestionByName("primarySolution");
    expect(imgQ?.getType()).toBe("imagepicker");
    expect(imgQ.choices.length).toBe(4);
    expect(imgQ.choices[0].imageLink).toContain("data:image/svg+xml");
  });

  test("verifies Wellbeing Check-in includes chart question and scorecard result template", () => {
    const sample = CHAT_SAMPLES.find((s) => s.id === "wellbeing-scorecard")!;
    expect(sample).toBeDefined();

    const model = new Model(sample.json);
    const chartQ = model.getQuestionByName("dailyMetricsChart");
    expect(chartQ?.getType()).toBe("chart");

    expect(model.calculatedValues.length).toBeGreaterThan(0);
    expect((sample.json as any).resultTemplate).toBeDefined();
    expect((sample.json as any).resultTemplate.score).toBe("vitalityScore");
  });

  test("verifies Persian Customer Support sample has valid Persian titles and signature", () => {
    const sample = CHAT_SAMPLES.find((s) => s.id === "persian-support")!;
    expect(sample).toBeDefined();

    const model = new Model(sample.json);
    expect(model.title).toContain("پشتیبانی");

    const sigQ = model.getQuestionByName("digitalSignature");
    expect(sigQ?.getType()).toBe("signaturepad");
  });
});
