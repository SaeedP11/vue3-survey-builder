import { Serializer } from "survey-core";

// The survey's own properties, which a survey needs to load its JSON with
// them intact, and the designer to edit them. No survey-creator-core here,
// so the runtime entry can import it.
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
