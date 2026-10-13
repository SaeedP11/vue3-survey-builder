import SurveyResultEditorModal from "./components/SurveyResultEditorModal.vue";
import registerAdvancedTextInput from "./utils/registerAdvancedTextInput";
import SurveyResultEditor from "./components/SurveyResultEditor.vue";
import registerAsyncDropdown from "./utils/registerAsyncDropdown";
import registerCustomLogic from "./utils/registerCustomLogic";
import useScrollToError from "./composables/useScrollToError";
import { SurveySchemaPrompt } from "./utils/prefixPrompts";
import FormBuilder from "./components/FormBuilder.vue";
import registerChartQuestion from "./utils/registerChartQuestion";
import registerChartQuestionDesigner from "./utils/registerChartQuestionDesigner";

// Built in: the chart question needs nothing from the host, so the designer
// and every survey rendered with this library know it from import
registerChartQuestion();
registerChartQuestionDesigner();

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
  AsyncDropdownHandlers,
  ItemType,
  ResultAction,
  ResultActionIcon,
  ResultActionType,
  ResultActionVariant,
  ResultBlock,
  ResultBlockType,
  ResultImage,
  ResultImagePlacement,
  ScoreDisplayVariant,
  SurveyAiAssitantConfig,
  SurveyResultProps,
  TableRow,
  TemplateDefinition,
} from "./types";

export {
  ChartItemValue,
  QuestionChartModel,
  type ChartType,
} from "./utils/registerChartQuestion";

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
