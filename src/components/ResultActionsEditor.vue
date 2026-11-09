<script setup lang="ts">
import { ref, useId } from "vue";
import { ConditionRunner } from "survey-core";
import type {
  ResultAction,
  ResultActionIcon,
  ResultActionType,
  ResultActionVariant,
} from "../types/index.ts";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { newId, safeLinkUrl } from "../utils/resultContent.ts";
import ListItemControls from "./ListItemControls.vue";
import IconPickerField from "./IconPickerField.vue";

const MAX_ACTIONS = 6;

const actions = defineModel<ResultAction[]>({ default: () => [] });
const props = defineProps<{
  statusLabels?: string[];
  /** The score's range, which a new score range starts from. */
  min?: number;
  max?: number;
  knownVariables?: string[];
}>();

const { t } = useLocalI18n(surveyResultEditor);
const uid = useId();

const types: ResultActionType[] = ["link", "restart", "close", "print", "custom"];
const variants: ResultActionVariant[] = ["primary", "secondary", "text"];
// A new type's natural icon, while the button still has none or the old type's
const TYPE_ICON: Record<ResultActionType, ResultActionIcon> = {
  link: "external",
  restart: "restart",
  close: "none",
  print: "print",
  custom: "none",
};

const inputClass =
  "rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent";

function update(index: number, patch: Partial<ResultAction>) {
  const next = [...actions.value];
  next[index] = { ...next[index], ...patch };
  actions.value = next;
}

type ShowFor = "always" | "range" | "condition" | `tier-${number}`;

function showFor(action: ResultAction): ShowFor {
  if (action.visibleIf || action.condition) return "condition";
  if (typeof action.tier === "number") return `tier-${action.tier}`;
  if (typeof action.scoreMin === "number" || typeof action.scoreMax === "number")
    return "range";
  return "always";
}

/** Limits the button to a tier or a score range (starting at the whole range), or lifts the limit. */
function setShowFor(index: number, value: ShowFor) {
  const { tier: _t, scoreMin: _min, scoreMax: _max, visibleIf: _v, condition: _c, ...rest } = actions.value[index];
  const next: ResultAction = { ...rest };
  if (value === "range") {
    next.scoreMin = props.min ?? 0;
    next.scoreMax = props.max ?? 100;
  } else if (value === "condition") {
    next.visibleIf = "{role} = 'doctor'";
  } else if (value !== "always") {
    next.tier = Number(value.slice("tier-".length));
  }
  const all = [...actions.value];
  all[index] = next;
  actions.value = all;
}

const conditionOperators = [
  { value: "=", labelKey: "equals" },
  { value: "!=", labelKey: "notEquals" },
  { value: "contains", labelKey: "contains" },
  { value: "notcontains", labelKey: "notContains" },
  { value: "anyof", labelKey: "anyOf" },
  { value: "empty", labelKey: "empty" },
  { value: "notempty", labelKey: "notEmpty" },
  { value: ">", labelKey: "greater" },
  { value: "<", labelKey: "less" },
  { value: ">=", labelKey: "greaterOrEqual" },
  { value: "<=", labelKey: "lessOrEqual" },
] as const;

interface ParsedCondition {
  variable: string;
  operator: string;
  value: string;
  isSimple: boolean;
}

function parseCondition(expr: string | undefined): ParsedCondition {
  if (!expr || !expr.trim()) {
    return { variable: "role", operator: "=", value: "doctor", isSimple: true };
  }
  const trimmed = expr.trim();
  const match = trimmed.match(
    /^\{\s*([a-zA-Z0-9_.-]+)\s*\}\s*(=|!=|<=|>=|<|>|contains|notcontains|anyof|allof|empty|notempty)\s*(.*)$/i,
  );
  if (match) {
    let val = match[3]?.trim() ?? "";
    if (
      (val.startsWith("'") && val.endsWith("'")) ||
      (val.startsWith('"') && val.endsWith('"'))
    ) {
      val = val.slice(1, -1);
    } else if (val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .join(", ");
    }
    return {
      variable: match[1],
      operator: match[2].toLowerCase(),
      value: val,
      isSimple: true,
    };
  }
  return { variable: "", operator: "=", value: "", isSimple: false };
}

function buildCondition(variable: string, operator: string, value: string): string {
  const v = variable.trim();
  if (!v) return "";
  const varRef = v.startsWith("{") && v.endsWith("}") ? v : `{${v}}`;
  const op = operator.trim();
  if (op === "empty" || op === "notempty") {
    return `${varRef} ${op}`;
  }
  const val = value.trim();
  if (op === "anyof" || op === "allof") {
    if (val.startsWith("[") && val.endsWith("]")) {
      return `${varRef} ${op} ${val}`;
    }
    const items = val.split(",").map((s) => s.trim()).filter(Boolean);
    const formatted = items.map((s) => `'${s.replace(/'/g, "\\'")}'`).join(", ");
    return `${varRef} ${op} [${formatted}]`;
  }
  if (/^-?\d+(\.\d+)?$/.test(val) || val === "true" || val === "false") {
    return `${varRef} ${op} ${val}`;
  }
  const unquoted =
    (val.startsWith("'") && val.endsWith("'")) ||
    (val.startsWith('"') && val.endsWith('"'))
      ? val.slice(1, -1)
      : val;
  return `${varRef} ${op} '${unquoted.replace(/'/g, "\\'")}'`;
}

const conditionModeOverride = ref<Record<string, "simple" | "advanced">>({});

function isConditionAdvanced(action: ResultAction): boolean {
  if (conditionModeOverride.value[action.id]) {
    return conditionModeOverride.value[action.id] === "advanced";
  }
  return !parseCondition(action.visibleIf ?? action.condition).isSimple;
}

function toggleConditionMode(action: ResultAction) {
  const current = isConditionAdvanced(action);
  conditionModeOverride.value[action.id] = current ? "simple" : "advanced";
}

function updateSimpleCondition(
  index: number,
  patch: Partial<{ variable: string; operator: string; value: string }>,
) {
  const action = actions.value[index];
  const parsed = parseCondition(action.visibleIf ?? action.condition);
  const next = { ...parsed, ...patch };
  const built = buildCondition(next.variable, next.operator, next.value);
  update(index, { visibleIf: built, condition: undefined });
}

function conditionInvalid(action: ResultAction): boolean {
  const expr = (action.visibleIf ?? action.condition)?.trim();
  if (!expr) return false;
  try {
    return !new ConditionRunner(expr).canRun();
  } catch {
    return true;
  }
}

/** Sets one end of the score range; empty leaves that end open. */
function setBound(index: number, key: "scoreMin" | "scoreMax", raw: string) {
  const value = raw.trim() === "" ? undefined : Number(raw);
  const next = { ...actions.value[index] };
  if (value === undefined || !Number.isFinite(value)) delete next[key];
  else next[key] = value;
  const all = [...actions.value];
  all[index] = next;
  actions.value = all;
}

const rangeInvalid = (action: ResultAction) =>
  typeof action.scoreMin === "number" &&
  typeof action.scoreMax === "number" &&
  action.scoreMin > action.scoreMax;

function setType(index: number, type: ResultActionType) {
  const current = actions.value[index];
  const keepIcon =
    current.icon && current.icon !== "none" && current.icon !== TYPE_ICON[current.type];
  update(index, {
    type,
    icon: keepIcon ? current.icon : TYPE_ICON[type],
    ...(type === "link" && current.newTab === undefined ? { newTab: true } : {}),
  });
}

function add() {
  // A second filled button reads as secondary next to the first
  const hasPrimary = actions.value.some(
    (a) => (a.variant ?? "primary") === "primary",
  );
  actions.value = [
    ...actions.value,
    {
      id: newId("action"),
      label: t("actions.newLabel"),
      type: "link",
      variant: hasPrimary ? "secondary" : "primary",
      icon: "external",
      url: "",
      newTab: true,
    },
  ];
}

function remove(index: number) {
  actions.value = actions.value.filter((_, i) => i !== index);
}

function move(index: number, by: -1 | 1) {
  const next = [...actions.value];
  const [item] = next.splice(index, 1);
  next.splice(index + by, 0, item);
  actions.value = next;
}

const urlInvalid = (action: ResultAction) =>
  !!action.url?.trim() && !safeLinkUrl(action.url);

const idDuplicate = (action: ResultAction) =>
  actions.value.filter((a) => a.id === action.id).length > 1;
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs leading-snug text-fb-fg-muted">{{ t("actions.help") }}</p>

    <div
      v-for="(action, index) in actions"
      :key="index"
      class="rounded-lg border border-fb-border bg-fb-surface p-3 space-y-3"
    >
      <ListItemControls
        :title="action.label?.trim() || t('actions.item', { n: index + 1 })"
        :index="index"
        :count="actions.length"
        @move="(by) => move(index, by)"
        @remove="remove(index)"
      />

      <div class="flex flex-col gap-1">
        <label
          :for="`${uid}-label-${index}`"
          class="text-[11.5px] font-semibold text-fb-fg-secondary"
          >{{ t("actions.label") }}</label
        >
        <input
          :id="`${uid}-label-${index}`"
          :value="action.label"
          type="text"
          :class="inputClass"
          @input="update(index, { label: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <fieldset class="flex flex-col gap-1">
        <legend class="mb-1 text-[11.5px] font-semibold text-fb-fg-secondary">
          {{ t("actions.style") }}
        </legend>
        <div
          class="grid grid-cols-3 gap-1 rounded-lg border border-fb-border bg-fb-surface-muted p-1"
        >
          <label
            v-for="variant in variants"
            :key="variant"
            class="cursor-pointer rounded-md px-2 py-1.5 text-center text-xs font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-fb-accent"
            :class="
              (action.variant ?? 'primary') === variant
                ? 'bg-fb-surface text-fb-fg shadow-sm'
                : 'text-fb-fg-muted hover:text-fb-fg'
            "
          >
            <input
              type="radio"
              class="sr-only"
              :name="`${uid}-variant-${index}`"
              :value="variant"
              :checked="(action.variant ?? 'primary') === variant"
              @change="update(index, { variant })"
            />
            {{ t(`actions.variants.${variant}`) }}
          </label>
        </div>
      </fieldset>

      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label
            :for="`${uid}-type-${index}`"
            class="text-[11.5px] font-semibold text-fb-fg-secondary"
            >{{ t("actions.type") }}</label
          >
          <select
            :id="`${uid}-type-${index}`"
            :value="action.type"
            :class="inputClass"
            @change="
              setType(
                index,
                ($event.target as HTMLSelectElement).value as ResultActionType,
              )
            "
          >
            <option v-for="type in types" :key="type" :value="type">
              {{ t(`actions.types.${type}`) }}
            </option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label
            :for="`${uid}-icon-${index}`"
            class="text-[11.5px] font-semibold text-fb-fg-secondary"
            >{{ t("actions.icon") }}</label
          >
          <IconPickerField
            :id="`${uid}-icon-${index}`"
            :model-value="action.icon"
            :label="t('actions.icon')"
            :input-class="inputClass"
            @update:model-value="update(index, { icon: $event })"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label
          :for="`${uid}-show-${index}`"
          class="text-[11.5px] font-semibold text-fb-fg-secondary"
          >{{ t("actions.showFor") }}</label
        >
        <select
          :id="`${uid}-show-${index}`"
          :value="showFor(action)"
          :aria-describedby="`${uid}-show-help-${index}`"
          :class="inputClass"
          @change="
            setShowFor(index, ($event.target as HTMLSelectElement).value as ShowFor)
          "
        >
          <option value="always">{{ t("actions.everyResult") }}</option>
          <optgroup v-if="statusLabels?.length" :label="t('actions.tiers')">
            <option
              v-for="(label, tier) in statusLabels"
              :key="tier"
              :value="`tier-${tier}`"
            >
              {{ label || tier + 1 }}
            </option>
          </optgroup>
          <option value="range">{{ t("actions.scoreRange") }}</option>
          <option value="condition">{{ t("actions.condition") }}</option>
        </select>
        <p
          :id="`${uid}-show-help-${index}`"
          class="text-[11px] leading-snug text-fb-fg-muted"
        >
          {{
            showFor(action) === "condition"
              ? t("actions.conditionHelp")
              : t("actions.showForHelp")
          }}
        </p>

        <!-- Condition on external variable/prop or expression -->
        <div
          v-if="showFor(action) === 'condition'"
          class="mt-2 space-y-2.5 rounded-lg border border-fb-border bg-fb-surface-muted/40 p-2.5"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-[11px] font-semibold text-fb-fg-secondary">
              {{ t("actions.condition") }}
            </span>
            <button
              type="button"
              class="cursor-pointer text-[11px] font-medium text-fb-accent hover:underline"
              @click="toggleConditionMode(action)"
            >
              {{
                isConditionAdvanced(action)
                  ? t("actions.conditionModeSimple")
                  : t("actions.conditionModeAdvanced")
              }}
            </button>
          </div>

          <!-- Presets -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              class="cursor-pointer rounded border border-fb-border bg-fb-surface px-2 py-0.5 text-[10.5px] font-medium text-fb-fg hover:bg-fb-surface-muted"
              @click="update(index, { visibleIf: `{role} = 'doctor'`, condition: undefined })"
            >
              {{ t("actions.conditionPresets.doctor") }} ({role} = 'doctor')
            </button>
            <button
              type="button"
              class="cursor-pointer rounded border border-fb-border bg-fb-surface px-2 py-0.5 text-[10.5px] font-medium text-fb-fg hover:bg-fb-surface-muted"
              @click="update(index, { visibleIf: `{role} = 'admin'`, condition: undefined })"
            >
              {{ t("actions.conditionPresets.admin") }} ({role} = 'admin')
            </button>
          </div>

          <!-- Simple rule builder -->
          <div v-if="!isConditionAdvanced(action)" class="space-y-2">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="flex flex-col gap-1">
                <label
                  :for="`${uid}-cond-var-${index}`"
                  class="text-[11px] font-semibold text-fb-fg-secondary"
                  >{{ t("actions.conditionVar") }}</label
                >
                <input
                  :id="`${uid}-cond-var-${index}`"
                  :value="parseCondition(action.visibleIf ?? action.condition).variable"
                  type="text"
                  dir="ltr"
                  :list="`${uid}-vars-list`"
                  :placeholder="t('actions.conditionVarPlaceholder')"
                  :class="inputClass"
                  @input="
                    updateSimpleCondition(index, {
                      variable: ($event.target as HTMLInputElement).value,
                    })
                  "
                />
              </div>

              <div class="flex flex-col gap-1">
                <label
                  :for="`${uid}-cond-op-${index}`"
                  class="text-[11px] font-semibold text-fb-fg-secondary"
                  >{{ t("actions.conditionOp") }}</label
                >
                <select
                  :id="`${uid}-cond-op-${index}`"
                  :value="parseCondition(action.visibleIf ?? action.condition).operator"
                  :class="inputClass"
                  @change="
                    updateSimpleCondition(index, {
                      operator: ($event.target as HTMLSelectElement).value,
                    })
                  "
                >
                  <option
                    v-for="op in conditionOperators"
                    :key="op.value"
                    :value="op.value"
                  >
                    {{ t(`actions.conditionOperators.${op.labelKey}`) }}
                  </option>
                </select>
              </div>

              <div
                v-if="
                  !['empty', 'notempty'].includes(
                    parseCondition(action.visibleIf ?? action.condition).operator,
                  )
                "
                class="flex flex-col gap-1"
              >
                <label
                  :for="`${uid}-cond-val-${index}`"
                  class="text-[11px] font-semibold text-fb-fg-secondary"
                  >{{ t("actions.conditionVal") }}</label
                >
                <input
                  :id="`${uid}-cond-val-${index}`"
                  :value="parseCondition(action.visibleIf ?? action.condition).value"
                  type="text"
                  dir="ltr"
                  :placeholder="t('actions.conditionValPlaceholder')"
                  :class="inputClass"
                  @input="
                    updateSimpleCondition(index, {
                      value: ($event.target as HTMLInputElement).value,
                    })
                  "
                />
              </div>
            </div>

            <!-- Preview of generated expression -->
            <div
              v-if="action.visibleIf ?? action.condition"
              class="flex items-center gap-1.5 text-[11px] text-fb-fg-muted font-mono"
              dir="ltr"
            >
              <span class="text-fb-fg-secondary font-medium text-[10.5px]">
                {{ t("actions.conditionExpr") }}:
              </span>
              <span>{{ action.visibleIf ?? action.condition }}</span>
            </div>
          </div>

          <!-- Advanced expression input -->
          <div v-else class="flex flex-col gap-1">
            <label
              :for="`${uid}-cond-expr-${index}`"
              class="text-[11px] font-semibold text-fb-fg-secondary"
              >{{ t("actions.conditionExpr") }}</label
            >
            <input
              :id="`${uid}-cond-expr-${index}`"
              :value="action.visibleIf ?? action.condition ?? ''"
              type="text"
              dir="ltr"
              placeholder="{role} = 'doctor'"
              :aria-invalid="conditionInvalid(action) || undefined"
              :class="[
                inputClass,
                'font-mono aria-invalid:border-[#d92d20]',
              ]"
              @input="
                update(index, {
                  visibleIf: ($event.target as HTMLInputElement).value,
                  condition: undefined,
                })
              "
            />
            <p class="text-[10.5px] leading-snug text-fb-fg-muted">
              {{ t("actions.conditionExprHelp") }}
            </p>
          </div>

          <p
            v-if="conditionInvalid(action)"
            role="alert"
            class="text-[11px] leading-snug text-[#d92d20]"
          >
            {{ t("actions.conditionInvalid") }}
          </p>
        </div>
        <div
          v-if="showFor(action) === 'range'"
          class="mt-1 grid grid-cols-2 gap-2"
        >
          <div class="flex flex-col gap-1">
            <label
              :for="`${uid}-score-min-${index}`"
              class="text-[11px] font-semibold text-fb-fg-secondary"
              >{{ t("actions.scoreMin") }}</label
            >
            <input
              :id="`${uid}-score-min-${index}`"
              :value="action.scoreMin ?? ''"
              type="number"
              inputmode="decimal"
              dir="ltr"
              :aria-invalid="rangeInvalid(action) || undefined"
              :class="[inputClass, 'min-w-0 aria-invalid:border-[#d92d20]']"
              @change="
                setBound(index, 'scoreMin', ($event.target as HTMLInputElement).value)
              "
            />
          </div>
          <div class="flex flex-col gap-1">
            <label
              :for="`${uid}-score-max-${index}`"
              class="text-[11px] font-semibold text-fb-fg-secondary"
              >{{ t("actions.scoreMax") }}</label
            >
            <input
              :id="`${uid}-score-max-${index}`"
              :value="action.scoreMax ?? ''"
              type="number"
              inputmode="decimal"
              dir="ltr"
              :aria-invalid="rangeInvalid(action) || undefined"
              :class="[inputClass, 'min-w-0 aria-invalid:border-[#d92d20]']"
              @change="
                setBound(index, 'scoreMax', ($event.target as HTMLInputElement).value)
              "
            />
          </div>
        </div>
        <p
          v-if="rangeInvalid(action)"
          role="alert"
          class="text-[11px] leading-snug text-[#d92d20]"
        >
          {{ t("actions.rangeInvalid") }}
        </p>
      </div>

      <div v-if="action.type === 'link'" class="flex flex-col gap-1">
        <label
          :for="`${uid}-url-${index}`"
          class="text-[11.5px] font-semibold text-fb-fg-secondary"
          >{{ t("actions.url") }}</label
        >
        <input
          :id="`${uid}-url-${index}`"
          :value="action.url ?? ''"
          type="text"
          inputmode="url"
          dir="ltr"
          placeholder="https://"
          :aria-invalid="urlInvalid(action) || undefined"
          :aria-describedby="`${uid}-url-help-${index}`"
          :class="[inputClass, 'aria-invalid:border-[#d92d20]']"
          @input="update(index, { url: ($event.target as HTMLInputElement).value })"
        />
        <p
          v-if="urlInvalid(action)"
          role="alert"
          class="text-[11px] leading-snug text-[#d92d20]"
        >
          {{ t("actions.urlInvalid") }}
        </p>
        <p
          :id="`${uid}-url-help-${index}`"
          class="text-[11px] leading-snug text-fb-fg-muted break-words"
        >
          {{ t("actions.urlHelp") }}
        </p>
        <label class="mt-1 flex cursor-pointer items-center gap-2 text-xs text-fb-fg">
          <input
            type="checkbox"
            class="h-4 w-4 accent-fb-accent"
            :checked="action.newTab ?? false"
            @change="
              update(index, { newTab: ($event.target as HTMLInputElement).checked })
            "
          />
          {{ t("actions.newTab") }}
        </label>
      </div>

      <div v-if="action.type === 'custom'" class="flex flex-col gap-1">
        <label
          :for="`${uid}-id-${index}`"
          class="text-[11.5px] font-semibold text-fb-fg-secondary"
          >{{ t("actions.id") }}</label
        >
        <input
          :id="`${uid}-id-${index}`"
          :value="action.id"
          type="text"
          dir="ltr"
          :aria-invalid="idDuplicate(action) || undefined"
          :aria-describedby="`${uid}-id-help-${index}`"
          :class="[inputClass, 'font-mono aria-invalid:border-[#d92d20]']"
          @change="
            update(index, {
              id:
                ($event.target as HTMLInputElement).value.trim() ||
                newId('action'),
            })
          "
        />
        <p
          v-if="idDuplicate(action)"
          role="alert"
          class="text-[11px] leading-snug text-[#d92d20]"
        >
          {{ t("actions.idDuplicate") }}
        </p>
        <p
          :id="`${uid}-id-help-${index}`"
          class="text-[11px] leading-snug text-fb-fg-muted"
        >
          {{ t("actions.idHelp") }}
        </p>
      </div>
    </div>

    <p
      v-if="actions.length === 0"
      class="rounded-lg border border-dashed border-fb-border px-3 py-4 text-center text-xs text-fb-fg-muted"
    >
      {{ t("actions.empty") }}
    </p>

    <button
      v-if="actions.length < MAX_ACTIONS"
      type="button"
      class="w-full cursor-pointer rounded-lg border border-dashed border-fb-border-strong bg-fb-surface-muted/40 px-3 py-2.5 text-sm font-semibold text-fb-fg hover:bg-fb-surface-muted"
      @click="add"
    >
      {{ t("actions.add") }}
    </button>

    <datalist :id="`${uid}-vars-list`">
      <option value="role" />
      <option value="roles" />
      <option value="user.role" />
      <option value="score" />
      <option
        v-for="v in props.knownVariables ?? []"
        :key="v"
        :value="v"
      />
    </datalist>
  </div>
</template>
