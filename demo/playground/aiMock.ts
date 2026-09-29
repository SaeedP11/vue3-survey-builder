import { ref } from "vue";
import type { SurveyAiAssitantConfig } from "../../src/index.ts";
import { logEvent } from "./eventLog.ts";

/** When on, the mock answers like a failed request: undefined, form untouched. */
export const aiShouldFail = ref(false);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Stands in for the host's LLM call: async, like the real one, and returns a
 * survey built from the prompt so the round trip is visible.
 */
export const aiMockConfig: SurveyAiAssitantConfig = {
  onSubmit: async (prompt) => {
    logEvent("ai", "prompt sent", prompt);
    await delay(1500);

    if (aiShouldFail.value) {
      logEvent("error", "AI mock failed: returned undefined, form left as is");
      return undefined;
    }

    const topics = prompt
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    const json = {
      title: `Generated: ${prompt.slice(0, 60)}`,
      pages: [
        {
          name: "page1",
          elements: (topics.length ? topics : ["Your answer"]).map((topic, i) => ({
            type: i % 2 ? "comment" : "text",
            name: `question${i + 1}`,
            title: topic,
          })),
        },
      ],
    };
    logEvent("ai", `schema returned with ${json.pages[0].elements.length} questions`, json);
    return json;
  },
};
