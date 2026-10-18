<script setup lang="ts">
import { useId } from "vue";
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
import ResultActionIconView from "./templates/ResultActionIcon.vue";

const MAX_ACTIONS = 6;

const actions = defineModel<ResultAction[]>({ default: () => [] });
const props = defineProps<{
  statusLabels?: string[];
  /** The score's range, which a new score range starts from. */
  min?: number;
  max?: number;
}>();

const { t } = useLocalI18n(surveyResultEditor);
const uid = useId();

const types: ResultActionType[] = ["link", "restart", "close", "print", "custom"];
const variants: ResultActionVariant[] = ["primary", "secondary", "text"];
const icons: ResultActionIcon[] = [
  "none",
  "arrow",
  "external",
  "download",
  "print",
  "calendar",
  "phone",
  "message",
  "share",
  "restart",
];
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

type ShowFor = "always" | "range" | `tier-${number}`;

function showFor(action: ResultAction): ShowFor {
  if (typeof action.tier === "number") return `tier-${action.tier}`;
  if (typeof action.scoreMin === "number" || typeof action.scoreMax === "number")
    return "range";
  return "always";
}

/** Limits the button to a tier or a score range (starting at the whole range), or lifts the limit. */
function setShowFor(index: number, value: ShowFor) {
  const { tier: _t, scoreMin: _min, scoreMax: _max, ...rest } = actions.value[index];
  const next: ResultAction = { ...rest };
  if (value === "range") {
    next.scoreMin = props.min ?? 0;
    next.scoreMax = props.max ?? 100;
  } else if (value !== "always") {
    next.tier = Number(value.slice("tier-".length));
  }
  const all = [...actions.value];
  all[index] = next;
  actions.value = all;
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
          <div class="relative">
            <select
              :id="`${uid}-icon-${index}`"
              :value="action.icon ?? 'none'"
              :class="[inputClass, 'w-full ps-9']"
              @change="
                update(index, {
                  icon: ($event.target as HTMLSelectElement)
                    .value as ResultActionIcon,
                })
              "
            >
              <option v-for="icon in icons" :key="icon" :value="icon">
                {{ t(`actions.icons.${icon}`) }}
              </option>
            </select>
            <span
              class="pointer-events-none absolute inset-y-0 start-3 flex items-center text-fb-fg-secondary"
            >
              <ResultActionIconView :name="action.icon" />
            </span>
          </div>
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
        </select>
        <p
          :id="`${uid}-show-help-${index}`"
          class="text-[11px] leading-snug text-fb-fg-muted"
        >
          {{ t("actions.showForHelp") }}
        </p>
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
  </div>
</template>
