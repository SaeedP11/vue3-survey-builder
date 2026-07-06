import type {
  ICreatorOptions,
  SurveyCreatorModel as SurveyCreatorModelType,
} from "survey-creator-core";
import { inject, provide, type InjectionKey } from "vue";
import { getServeyCreatorTheme, getServeyTheme } from "../themes/factory";
import { SurveyCreatorModel } from "survey-creator-core";
import immediateWatch from "../utils/immediateWatch";
import { useSurveyConfig } from "./surveyConfig";

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
  creator.toolbox.showSubitems = false
  const config = useSurveyConfig();

  immediateWatch([config.locale], () => (creator.locale = config.locale.value));
  immediateWatch([config.colorMode], () => {
    const themeArgs = {
      colorMode: config.colorMode.value,
      cssVariable: config.cssVariable,
    };

    creator.applyCreatorTheme(getServeyCreatorTheme(themeArgs));
    creator.applyTheme(getServeyTheme(themeArgs));
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
