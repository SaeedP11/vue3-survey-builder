/**
 * The result page's buttons and images: the legacy labels turned into buttons,
 * the addresses a page may use, answers put into link addresses, and the
 * images and buttons a score shows.
 */
import type {
  ResultAction,
  ResultImage,
  SurveyResultProps,
} from "../types/index.ts";
import { tierIndex } from "./statusTiers.ts";

/** A fresh id for a new button or image. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

interface LegacyCopy {
  primaryLabel: string;
  secondaryLabel: string;
  close: string;
}

const filled = (v: string | undefined, fallback: string) =>
  v && v.trim().length > 0 ? v : fallback;

/**
 * The buttons of a template saved before `actions` existed: its three labels
 * (or the locale's) as the buttons it showed. They keep the ids `primary`,
 * `secondary` and `close`, so a host listening for those events still works.
 */
export function legacyActions(
  props: SurveyResultProps,
  copy: LegacyCopy,
): ResultAction[] {
  return [
    {
      id: "primary",
      type: "custom",
      variant: "primary",
      icon: "none",
      label: filled(props.primaryLabel, copy.primaryLabel),
    },
    {
      id: "secondary",
      type: "custom",
      variant: "secondary",
      icon: "download",
      label: filled(props.secondaryLabel, copy.secondaryLabel),
    },
    {
      id: "close",
      type: "close",
      variant: "text",
      icon: "none",
      label: filled(props.closeLabel, copy.close),
    },
  ];
}

/** The template's buttons: its `actions`, or the legacy labels' when it has none. */
export function resolveActions(
  props: SurveyResultProps,
  copy: LegacyCopy,
): ResultAction[] {
  return Array.isArray(props.actions)
    ? props.actions
    : legacyActions(props, copy);
}

const isNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/** Whether the button shows only for some scores: a tier or a score range. */
export function actionHasCondition(action: ResultAction): boolean {
  return isNumber(action.tier) || isNumber(action.scoreMin) || isNumber(action.scoreMax);
}

/**
 * Whether a respondent with `score` (in `tier`) sees the button. A button
 * limited to some scores stays hidden without a score.
 */
export function actionShownFor(
  action: ResultAction,
  score: number | undefined,
  tier: number | undefined,
): boolean {
  if (!actionHasCondition(action)) return true;
  if (score === undefined) return false;
  if (isNumber(action.tier) && action.tier !== tier) return false;
  if (isNumber(action.scoreMin) && score < action.scoreMin) return false;
  if (isNumber(action.scoreMax) && score > action.scoreMax) return false;
  return true;
}

/** The address's scheme, read as a browser does: tabs, newlines and controls in it are dropped. */
function schemeOf(value: string): string | undefined {
  const probe = value.replace(/[\x00-\x20\x7f]+/g, "");
  return /^([a-z][a-z\d+.-]*):/i.exec(probe)?.[1]?.toLowerCase();
}

/** A link address the page may open: http(s), mailto:, tel:, or relative. */
export function safeLinkUrl(url: string | undefined): string | undefined {
  const value = url?.trim();
  if (!value) return undefined;
  const scheme = schemeOf(value);
  if (!scheme) return value;
  return ["http", "https", "mailto", "tel"].includes(scheme)
    ? value
    : undefined;
}

/** An image address the page may show: http(s), blob:, data:image, or relative. */
export function safeImageSrc(src: string | undefined): string | undefined {
  const value = src?.trim();
  if (!value) return undefined;
  if (/^data:image\/(?!svg)[a-z.+-]+[;,]/i.test(value)) return value;
  const scheme = schemeOf(value);
  if (!scheme) return value;
  return ["http", "https", "blob"].includes(scheme) ? value : undefined;
}

/** `{name}` in `template` replaced with that answer, URL-encoded; unknown names become empty. */
export function fillPlaceholders(
  template: string,
  values: Record<string, unknown>,
): string {
  return template.replace(/\{\s*([^{}\s]+)\s*\}/g, (_, name: string) => {
    const value = values[name];
    if (value === undefined || value === null) return "";
    const text =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    return encodeURIComponent(text);
  });
}

/**
 * The images for a result: those for every result, and those for the tier the
 * score falls in. Without a score, only the images for every result.
 */
export function imagesForScore(
  images: ResultImage[],
  score: number | undefined,
  min: number,
  max: number,
  tierCount: number,
): ResultImage[] {
  const tier =
    score === undefined ? undefined : tierIndex(score, min, max, tierCount);
  return images.filter(
    (image) => image.tier === undefined || image.tier === null || image.tier === tier,
  );
}
