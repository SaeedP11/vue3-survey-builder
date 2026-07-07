import type {
  ICreatorOptions,
  SurveyCreatorModel as SurveyCreatorModelType,
} from "survey-creator-core";
import {
  DefaultDarkPanelless,
  DefaultLight,
  DefaultLightPanelless,
} from "survey-core/themes";
import { inject, provide, type InjectionKey } from "vue";
import { SurveyCreatorModel } from "survey-creator-core";
import { DefaultDark } from "survey-creator-core/themes";
import useColorMode from "../composables/useColorMode";
import immediateWatch from "../utils/immediateWatch";
import { useI18n } from "vue-i18n";

const SURVEY_CREATOR_KEY: InjectionKey<SurveyCreatorModelType> =
  Symbol("survey_creator");

export function initSurveyCreator(
  model?: SurveyCreatorModelType,
): SurveyCreatorModelType {
  if (model) {
    provide(SURVEY_CREATOR_KEY, model);
    return model;
  }

  const creatorOptions: ICreatorOptions = {
    showCreatorThemeSettings: false,
    showTranslationTab: true,
    autoSaveEnabled: true,
    collapseOnDrag: true,
    isRTL: false,
  };

  const creator = new SurveyCreatorModel(creatorOptions);
  creator.toolbox.showSubitems = false;
  const { isDark } = useColorMode();
  const { locale } = useI18n();

  immediateWatch(locale, () => (creator.locale = locale.value));
  immediateWatch(isDark, (dark) => {
    creator.applyCreatorTheme(dark ? DefaultDark : DefaultLight);
    creator.applyTheme(dark ? DefaultDarkPanelless : DefaultLightPanelless);
  });

  provide(SURVEY_CREATOR_KEY, creator);
  return creator;
}

export function useSurveyCreator() {
  const creator = inject(SURVEY_CREATOR_KEY);
  if (!creator) {
    throw new Error(
      "useSurveyCreator() called without provideSurveyCreator() in an ancestor",
    );
  }
  return creator;
}
