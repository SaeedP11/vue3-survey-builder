import immediateWatch from "../utils/immediateWatch";
import useScrollToError from "./useScrollToError";
import { Model, SurveyModel } from "survey-core";
import useColorMode from "./useColorMode";
import { useI18n } from "vue-i18n";
import {
  DefaultDarkPanelless,
  DefaultLightPanelless,
} from "survey-core/themes";

export function useSurveyModel(jsonObj?: object): SurveyModel {
  const survey = new Model(jsonObj);
  const { isDark } = useColorMode();
  const { locale } = useI18n();

  useScrollToError(survey);

  immediateWatch([locale], () => (survey.locale = locale.value));
  immediateWatch([isDark], () => {
    survey.applyTheme(
      isDark.value ? DefaultDarkPanelless : DefaultLightPanelless,
    );
  });

  return survey;
}
