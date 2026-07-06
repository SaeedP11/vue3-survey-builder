import type { SurveyCreatorModel } from "survey-creator-core";
import type { ComputedRef, Ref } from "vue";
import type { Question } from "survey-core";
import type { Component } from "vue";

export enum ThemeModes {
  dark = "dark",
  light = "light",
}

export enum Locales {
  fa = "fa",
  en = "en",
}
export interface ColorModeInstance {
  preference: string;
  unknown: boolean;
  forced: boolean;
  value: string;
}

export type Locale = Ref<string> | ComputedRef<string>;
export type ColorMode =
  | ColorModeInstance
  | Ref<ThemeModes>
  | ComputedRef<ThemeModes>;

export type JsonGeneratorParams = {
  stream: boolean;
  cssVariable: CssVariables;
  colorMode: ColorMode;
  locale: Locale;
};

export type Theme = {
  cssVariable?: CssVariables;
  colorMode: string;
};

export type SurveyConfig = {
  cssVariable?: CssVariables;
  colorMode: ColorMode;
  locale: Locale;
};

export type SurveyAiAssitantConfig = {
  onSubmit: (prompt: string) => SurveyCreatorModel["JSON"];
};

export type CssVariables = {
  DarkSsecondaryBackground?: string;
  DarkPrimaryBackground?: string;
  questionFontSize?: string;
  creatorRadius?: string;
  primaryColor?: string;
  errorColor?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string;
  radius?: string;
};

export type ItemType = { value: string; text: string };

export interface AsyncDropdownHandlers {
  items: Ref<ItemType[]>;
  currentPage: Ref<number>;
  totalPages: Ref<number>;
  handleSearch: (query: string) => void;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  onSelect?: (question: Question, item: ItemType) => void;
}

export interface AdvancedTextInput extends AsyncDropdownHandlers {
  onSelect?: (question: Question, item: ItemType) => void;
}

export interface TemplateDefinition<P = Record<string, unknown>> {
  id: string;
  name?: string;
  component: Component;
  props?: P;
  /** Optional editor component. Defaults to SurveyResultEditor when omitted. */
  editor?: Component;
}

export type ScoreDisplayVariant =
  | "default"
  | "linear"
  | "radial"
  | "temperature"
  | "donut"
  | "bullet"
  | "thermometer"
  | "pills"
  | "table";

export interface TableRow {
  id?: string | number;
  metric: string;
  /** Variable name resolved against survey result, or a literal number. */
  value: string | number;
  min: number;
  max: number;
  unit?: string;
}

export interface SurveyResultProps {
  score?: number | string;
  min?: number;
  max?: number;
  scoreDisplay?: ScoreDisplayVariant;
  tableRows?: TableRow[];

  logoSrc?: string;
  brandName?: string;
  brandTagline?: string;
  categoryChip?: string;

  title?: string;
  subtitle?: string;
  description?: string;
  noteText?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  closeLabel?: string;

  /** Status labels shared across all widgets. Drives the per-tier status text. */
  statusLabels?: string[];
}

export interface RecurringSurveyData {
  id: string | number;
  createdAt: string | number;
  [key: string]: string | number | null;
}

export interface RecurringSurveyHandlers {
  data: Ref<RecurringSurveyData[]>;
  loading: Ref<boolean>;
  currentPage: Ref<number>;
  totalPages: Ref<number>;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  refresh: () => void;
}
