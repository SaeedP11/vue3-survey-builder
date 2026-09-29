import { Serializer, SurveyTrigger, type SurveyModel } from "survey-core";
import { SurveyLogic, editorLocalization } from "survey-creator-core";

export interface CustomLogicLocaleStrings {
  displayName: string;
  description?: string;
}

export type CustomLogicLocales = Record<string, CustomLogicLocaleStrings>;

export interface CustomLogicFireContext {
  survey: SurveyModel;
  expression: string;
  properties: Record<string, unknown>;
}

export interface RegisterCustomLogicOptions {
  type: string;
  locales: CustomLogicLocales;
  onFire?: (ctx: CustomLogicFireContext) => void;
}

const registered = new Map<string, (ctx: CustomLogicFireContext) => void>();

function mergeLgStrings(
  loc: string,
  entries: Record<string, string>,
): void {
  const target =
    loc === "en"
      ? (editorLocalization.getDefaultStrings() as Record<string, any>)
      : ((editorLocalization.locales as Record<string, any>)[loc] ??= {});
  const lg = (target.lg ??= {});
  Object.assign(lg, entries);
}

export default function registerCustomLogic(
  options: RegisterCustomLogicOptions,
): void {
  const { type, locales, onFire } = options;

  if (registered.has(type)) {
    if (onFire) registered.set(type, onFire);
    return;
  }
  if (onFire) registered.set(type, onFire);

  // SurveyJS writes a trigger as { type: "complete" } but reads it back as the
  // class "completetrigger" (the triggers property's classNamePart), so the
  // class needs the suffix or the trigger is dropped when JSON loads.
  const className = `${type}trigger`;

  class CustomTrigger extends SurveyTrigger {
    getType(): string {
      return className;
    }
    protected onSuccess(properties: Record<string, unknown>): void {
      const handler = registered.get(type);
      if (!handler) return;
      handler({
        survey: this.getSurvey() as unknown as SurveyModel,
        expression: this.expression,
        properties,
      });
    }
  }

  if (!Serializer.findClass(className)) {
    Serializer.addClass(className, [], () => new CustomTrigger(), "surveytrigger");
  }

  const logicTypeName = `trigger_${type}`;
  if (!SurveyLogic.types.some((t) => t.name === logicTypeName)) {
    SurveyLogic.types.push({
      name: logicTypeName,
      baseClass: className,
      propertyName: "expression",
    });
  }

  for (const [loc, strings] of Object.entries(locales)) {
    const entries: Record<string, string> = {
      [`${logicTypeName}Name`]: strings.displayName,
    };
    if (strings.description !== undefined) {
      entries[`${logicTypeName}Description`] = strings.description;
    }
    mergeLgStrings(loc, entries);
  }
}
