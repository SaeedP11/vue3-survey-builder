import type { SurveyCreatorModel } from "survey-creator-core";
import type { Question } from "survey-core";
import type { Component } from "vue";
import type { Ref } from "vue";

export type SurveyAiAssitantConfig = {
  onSubmit: (
    prompt: string,
  ) =>
    | SurveyCreatorModel["JSON"]
    | Promise<SurveyCreatorModel["JSON"] | undefined>
    | undefined;
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

/** What clicking a result page button does. */
export type ResultActionType =
  /** Opens `url`; `{name}` in it becomes that answer or calculated value. */
  | "link"
  /** Asks the host to start the survey again (emits `restart`). */
  | "restart"
  /** Asks the host to close the result page (emits `close`). */
  | "close"
  /** Opens the browser's print dialog, which also saves as PDF. */
  | "print"
  /** Left to the host: emits `action` with the button, told apart by its `id`. */
  | "custom";

export type ResultActionVariant = "primary" | "secondary" | "text";

export type ResultActionIcon =
  | "none"
  | "arrow"
  | "external"
  | "download"
  | "print"
  | "calendar"
  | "phone"
  | "message"
  | "share"
  | "restart";

export interface ResultAction {
  /** Stable id; a `custom` button's id is what the host's handler sees. */
  id: string;
  label: string;
  type: ResultActionType;
  variant?: ResultActionVariant;
  icon?: ResultActionIcon;
  /** A `link` button's address: http(s), mailto:, tel: or a relative path. */
  url?: string;
  /** Opens a `link` button's address in a new tab. */
  newTab?: boolean;
}

/** Where an image sits on the result page. */
export type ResultImagePlacement = "banner" | "afterScore" | "beforeActions";

export interface ResultImage {
  id: string;
  /** An http(s), relative, blob: or data:image URL. */
  src: string;
  /** Read out by screen readers; empty marks the image as decorative. */
  alt?: string;
  caption?: string;
  placement?: ResultImagePlacement;
  /** `cover` fills the frame and crops; `contain` shows the whole image. */
  fit?: "cover" | "contain";
  /**
   * Shows the image only while the score falls in this status tier (an index
   * into `statusLabels`); unset shows it for every result.
   */
  tier?: number;
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

  /** The page's buttons, in order. When unset, the three legacy labels below make the buttons. */
  actions?: ResultAction[];
  images?: ResultImage[];

  /** @deprecated Use `actions`; read only while `actions` is unset. */
  primaryLabel?: string;
  /** @deprecated Use `actions`; read only while `actions` is unset. */
  secondaryLabel?: string;
  /** @deprecated Use `actions`; read only while `actions` is unset. */
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
