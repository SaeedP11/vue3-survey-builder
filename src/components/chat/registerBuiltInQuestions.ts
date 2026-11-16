import { chatQuestionRegistry } from "./registry";
import ChatInputRadio from "./questions/ChatInputRadio.vue";
import ChatInputCheckbox from "./questions/ChatInputCheckbox.vue";
import ChatInputBoolean from "./questions/ChatInputBoolean.vue";
import ChatInputRating from "./questions/ChatInputRating.vue";
import ChatInputDropdown from "./questions/ChatInputDropdown.vue";
import ChatInputFile from "./questions/ChatInputFile.vue";
import ChatInputSignature from "./questions/ChatInputSignature.vue";
import ChatInputMatrix from "./questions/ChatInputMatrix.vue";
import ChatInputRanking from "./questions/ChatInputRanking.vue";
import ChatInputImagePicker from "./questions/ChatInputImagePicker.vue";
import ChatWidgetAdapter from "./questions/ChatWidgetAdapter.vue";

let registered = false;

export function registerBuiltInChatQuestions(): void {
  if (registered) return;
  registered = true;

  // Single choice
  chatQuestionRegistry.register("radiogroup", {
    component: ChatInputRadio,
    placement: "inline",
  });
  chatQuestionRegistry.register("boolean", {
    component: ChatInputBoolean,
    placement: "inline",
    formatHistoryDisplay: (val) => (val ? "Yes" : "No"),
  });

  // Multiple choice
  chatQuestionRegistry.register("checkbox", {
    component: ChatInputCheckbox,
    placement: "inline",
    formatHistoryDisplay: (val) => (Array.isArray(val) ? val.join(", ") : String(val)),
  });
  chatQuestionRegistry.register("tagbox", {
    component: ChatInputCheckbox,
    placement: "inline",
  });

  // Scales & Ratings
  chatQuestionRegistry.register("rating", {
    component: ChatInputRating,
    placement: "inline",
    formatHistoryDisplay: (val) => `⭐ ${val}`,
  });

  // Dropdowns & Async
  chatQuestionRegistry.register("dropdown", {
    component: ChatInputDropdown,
    placement: "inline",
  });
  chatQuestionRegistry.register("asyncdropdown", {
    component: ChatInputDropdown,
    placement: "inline",
  });

  // Rich inputs
  chatQuestionRegistry.register("file", {
    component: ChatInputFile,
    placement: "inline",
    formatHistoryDisplay: (val) => {
      if (Array.isArray(val)) {
        return val.map((f: any) => `📎 ${f.name || "file"}`).join(", ");
      }
      return "📎 1 file";
    },
  });
  chatQuestionRegistry.register("signaturepad", {
    component: ChatInputSignature,
    placement: "inline",
    formatHistoryDisplay: () => "✍️ Signed",
  });

  // Tabular & Structural
  chatQuestionRegistry.register("matrix", {
    component: ChatInputMatrix,
    placement: "inline",
    formatHistoryDisplay: (val) => {
      if (typeof val === "object" && val !== null) {
        return Object.entries(val)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" | ");
      }
      return String(val);
    },
  });
  chatQuestionRegistry.register("matrixdropdown", {
    component: ChatInputMatrix,
    placement: "inline",
  });

  // Ordering & Visuals
  chatQuestionRegistry.register("ranking", {
    component: ChatInputRanking,
    placement: "inline",
    formatHistoryDisplay: (val) => (Array.isArray(val) ? val.join(" → ") : String(val)),
  });
  chatQuestionRegistry.register("imagepicker", {
    component: ChatInputImagePicker,
    placement: "inline",
  });

  // Custom Widgets & Gauges
  const widgetTypes = [
    "chart",
    "chartquestion",
    "radialgauge",
    "radial",
    "bulletchart",
    "bullet",
    "donutgauge",
    "donut",
    "linearhealthgauge",
    "linear",
    "temperaturegauge",
    "temperature",
    "verticalthermometer",
    "thermometer",
    "segmentedpills",
    "pills",
    "scorecard",
    "score",
  ];

  for (const wType of widgetTypes) {
    chatQuestionRegistry.register(wType, {
      component: ChatWidgetAdapter,
      placement: "inline",
    });
  }
}

// Auto-register built-in question types on module load
registerBuiltInChatQuestions();

