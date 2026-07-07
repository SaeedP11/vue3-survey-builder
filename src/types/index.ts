import type { SurveyCreatorModel } from "survey-creator-core";
import type { Question } from "survey-core";
import type { Component } from "vue";
import type { Ref } from "vue";

export type SurveyAiAssitantConfig = {
  onSubmit: (prompt: string) => SurveyCreatorModel["JSON"];
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
