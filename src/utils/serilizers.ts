import { Serializer } from "survey-core";
import { editorLocalization } from "survey-creator-core";

Serializer.addProperty("survey", {
  isSerializable: true,
  name: "icon",
  type: "text",
});

Serializer.addProperty("survey", {
  name: "repetition:boolean",
  displayName: "Does the survey repeat?",
  category: "general",
  default: false,
  isSerializable: true,
});

Serializer.addProperty("survey", {
  name: "resultTemplate",
  default: null,
  isSerializable: true,
  visible: false,
});

editorLocalization.getLocale("en").pe.repetition = "Does the survey repeat?";
editorLocalization.getLocale("fa").pe.repetition = "آیا نظرسنجی تکرار می‌شود؟";
