import { inject, type InjectionKey } from "vue";

export const SURVEY_CREATOR_KEY: InjectionKey<any> =
  Symbol("survey_creator");

export function useOptionalCreatorTheme(): {
  theme?: { cssVariables?: Record<string, string> };
} | null {
  return inject(SURVEY_CREATOR_KEY, null);
}
