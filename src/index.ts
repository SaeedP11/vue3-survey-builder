import SurveyResultEditorModal from "./components/SurveyResultEditorModal.vue";
import registerAdvancedTextInput from "./utils/registerAdvancedTextInput";
import SurveyResultEditor from "./components/SurveyResultEditor.vue";
import registerAsyncDropdown from "./utils/registerAsyncDropdown";
import registerCustomLogic from "./utils/registerCustomLogic";
import useScrollToError from "./composables/useScrollToError";
import { SurveySchemaPrompt } from "./utils/prefixPrompts";
import FormBuilder from "./components/FormBuilder.vue";

export {
  provideSurveyResultTemplate,
  useSurveyResultTemplate,
} from "./provider/surveyResultTemplate.ts";

import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
import "./styles/style.css";

export { useSurveyCreator } from "./provider/surveyCreator";
export { SurveyComponent } from "survey-vue3-ui";
export * from "./composables/useSurveyModel.ts";
export * from "./provider/aiAssistantConfig.ts";
export * from "survey-core";

export type {
  CustomLogicFireContext,
  CustomLogicLocales,
  CustomLogicLocaleStrings,
  RegisterCustomLogicOptions,
} from "./utils/registerCustomLogic";

export {
  FormBuilder,
  SurveyResultEditor,
  SurveyResultEditorModal,
  SurveySchemaPrompt,
  registerAsyncDropdown,
  registerAdvancedTextInput,
  registerCustomLogic,
  useScrollToError,
};
