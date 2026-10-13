import {
  ElementFactory,
  ExpressionRunner,
  Helpers,
  ItemValue,
  Question,
  Serializer,
  SvgRegistry,
  type HashTable,
  type ISurvey,
} from "survey-core";
import { ComponentFactory } from "survey-vue3-ui";
import ChartQuestion from "../components/ChartQuestion.vue";

export const CHART_QUESTION_TYPE = "chart";
export const CHART_TYPES = ["bar", "horizontalBar", "line", "donut"] as const;
export type ChartType = (typeof CHART_TYPES)[number];

/** One bar, point or slice: a label (text) and the expression giving its number. */
export class ChartItemValue extends ItemValue {
  protected getBaseType(): string {
    return "chartitem";
  }

  get expression(): string {
    return this.getPropertyValue("expression", "");
  }
  set expression(val: string) {
    this.setPropertyValue("expression", val);
  }

  /** A CSS colour; empty to use the palette. */
  get color(): string {
    return this.getPropertyValue("color", "");
  }
  set color(val: string) {
    this.setPropertyValue("color", val);
  }
}

/**
 * A display-only question that charts numbers the form already holds: each
 * item is a label and an expression (`{weight}`, `{a} + {b}`, a constant),
 * evaluated against the answers as the respondent fills the form. It has no
 * value of its own, so nothing is added to the survey's data.
 */
export class QuestionChartModel extends Question {
  constructor(name: string) {
    super(name);
    this.createItemValues("items");
  }

  getType(): string {
    return CHART_QUESTION_TYPE;
  }

  get hasInput(): boolean {
    return false;
  }

  /** Items load as chartitem, so their expression and color serialize. */
  protected getItemValueType(): string {
    return "chartitem";
  }

  get items(): ChartItemValue[] {
    return this.getPropertyValue("items");
  }
  set items(val: ChartItemValue[]) {
    this.setPropertyValue("items", val);
  }

  get chartType(): ChartType {
    return this.getPropertyValue("chartType");
  }
  set chartType(val: ChartType) {
    this.setPropertyValue("chartType", val);
  }

  get unit(): string {
    return this.getPropertyValue("unit");
  }
  set unit(val: string) {
    this.setPropertyValue("unit", val);
  }

  /** The top of the value axis; empty to fit the largest value. */
  get maxValue(): number | undefined {
    return this.getPropertyValue("maxValue");
  }
  set maxValue(val: number | undefined) {
    this.setPropertyValue("maxValue", val);
  }

  /** Each item's result, by item value; null while its expression has no number. */
  get chartValues(): Record<string, number | null> {
    return this.getPropertyValue("chartValues", {});
  }

  protected runConditionCore(properties: HashTable<any>): void {
    super.runConditionCore(properties);
    this.runItemExpressions(properties);
  }

  private runItemExpressions(properties?: HashTable<any>) {
    const results: Record<string, number | null> = {};
    let pending = 0;
    const done = () => {
      if (pending === 0) this.setPropertyValue("chartValues", results);
    };
    for (const item of this.items) {
      const key = String(item.value);
      const expression = item.expression;
      results[key] = null;
      if (!expression) continue;
      const runner = new ExpressionRunner(expression);
      // SurveyJS reads an unanswered {q} as 0 in arithmetic; a chart would
      // then draw a zero the respondent never gave
      if (!runner.canRun() || runner.getVariables().some((v) => this.isUnset(v)))
        continue;
      pending++;
      // Synchronous for plain expressions; async functions complete later
      runner.onRunComplete = (value) => {
        results[key] = toNumber(value);
        pending--;
        done();
      };
      runner.runContext(this.getValueGetterContext(), properties);
    }
    done();
  }

  /** Whether {name} has neither an answer nor a variable/calculated value. */
  private isUnset(name: string): boolean {
    const survey = this.survey as
      | (ISurvey & { getVariable(name: string): unknown })
      | null;
    if (!survey) return false;
    // {panel.q} and {matrix[0].col} start with the question's own name
    const root = name.split(/[.[]/)[0];
    return (
      Helpers.isValueEmpty(this.data?.getValue(root)) &&
      Helpers.isValueEmpty(survey.getVariable(root))
    );
  }

  validateElementCore(): boolean {
    return true;
  }

  getAllErrors() {
    return [];
  }

  hasRequiredError(): boolean {
    return false;
  }

  supportAutoAdvance(): boolean {
    return false;
  }
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

const CHART_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 3V21H21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 17V13M12 17V8M17 17V11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

let registered = false;

/**
 * Registers the chart question: its JSON classes, toolbox icon and renderer,
 * everything a survey needs to show it. The designer's strings are separate
 * (registerChartQuestionDesigner), so rendering a survey does not load
 * survey-creator-core. Idempotent; the library calls it on
 * import, so a host never needs to.
 */
export default function registerChartQuestion() {
  if (registered) return;
  registered = true;

  Serializer.addClass(
    "chartitem",
    [
      { name: "expression:expression", category: "general" },
      { name: "color:color" },
    ],
    (value: unknown) => new ChartItemValue(value),
    "itemvalue",
  );

  Serializer.addClass(
    CHART_QUESTION_TYPE,
    [
      {
        name: "chartType",
        default: "bar",
        choices: [...CHART_TYPES],
        category: "general",
      },
      {
        name: "items:chartitem[]",
        category: "general",
        default: [],
      },
      { name: "unit", category: "general" },
      { name: "maxValue:number", category: "general" },
      // Nothing to answer, so the value and validation properties go
      { name: "valueName", visible: false },
      { name: "defaultValue", visible: false },
      { name: "correctAnswer", visible: false },
      { name: "clearIfInvisible", visible: false },
      { name: "isRequired", visible: false, isSerializable: false },
      { name: "requiredErrorText", visible: false },
      { name: "requiredIf", visible: false },
      { name: "readOnly", visible: false },
      { name: "enableIf", visible: false },
      { name: "validators", visible: false },
      { name: "showCommentArea", visible: false },
      { name: "resetValueIf", visible: false },
      { name: "setValueIf", visible: false },
      { name: "setValueExpression", visible: false },
      { name: "defaultValueExpression", visible: false },
    ],
    () => new QuestionChartModel(""),
    "question",
  );

  ElementFactory.Instance.registerElement(
    CHART_QUESTION_TYPE,
    (name) => new QuestionChartModel(name),
  );

  ComponentFactory.Instance.registerComponent(
    "survey-" + CHART_QUESTION_TYPE,
    ChartQuestion,
  );

  SvgRegistry.registerIcon("icon-" + CHART_QUESTION_TYPE, CHART_ICON);
}
