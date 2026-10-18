<script setup lang="ts">
import { useSurveyCreator } from "../provider/surveyCreator";
import { surveyResultEditor } from "../locales/index.ts";
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import type {
  ResultAction,
  ResultBlock,
  ResultBlockType,
  ResultImage,
  ScoreDisplayVariant,
  SurveyResultProps,
  TableRow,
} from "../types/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import ImageSourceField from "./ImageSourceField.vue";
import ResultActionsEditor from "./ResultActionsEditor.vue";
import ResultImagesEditor from "./ResultImagesEditor.vue";
import ResultLayoutEditor from "./ResultLayoutEditor.vue";
import { resolveLayout } from "../utils/resultLayout.ts";

const props = defineModel<SurveyResultProps>("props", { required: true });
// Shared with the preview, where a block can be clicked too
const selectedBlock = defineModel<string | null>("selectedBlock", { default: null });
const { t } = useLocalI18n(surveyResultEditor);
const creator = useSurveyCreator();
const uid = useId();

const inputClass =
  "w-full min-w-0 box-border rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent focus-visible:ring-2 focus-visible:ring-fb-accent-soft";
const labelClass = "text-[12px] font-semibold text-fb-fg-secondary";
const headingClass = "m-0 text-[13px] font-semibold text-fb-fg";
const helpClass = "m-0 text-xs leading-snug text-fb-fg-muted";
const addButtonClass =
  "w-full cursor-pointer rounded-lg border border-dashed border-fb-border-strong bg-fb-surface-muted/40 px-3 py-2.5 text-sm font-semibold text-fb-fg hover:bg-fb-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fb-accent";
const smallButtonClass =
  "shrink-0 cursor-pointer rounded-md border border-fb-border bg-fb-surface-muted px-2 py-1 text-[11px] font-semibold text-fb-fg-muted hover:bg-fb-border disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fb-accent";

const modifiedTick = ref(0);
const onModified = () => {
  modifiedTick.value++;
};
creator.onModified.add(onModified);
onBeforeUnmount(() => creator.onModified.remove(onModified));

const calculatedVariableNames = computed<string[]>(() => {
  modifiedTick.value;
  const cvs = (creator.JSON as { calculatedValues?: { name?: string }[] })
    ?.calculatedValues;
  if (!Array.isArray(cvs)) return [];
  return cvs
    .map((c) => (typeof c?.name === "string" ? c.name.trim() : ""))
    .filter((n): n is string => !!n);
});

const questionNames = computed<string[]>(() => {
  modifiedTick.value;
  const questions = creator.survey?.getAllQuestions?.() ?? [];
  return questions
    .map((q) => (typeof q?.name === "string" ? q.name.trim() : ""))
    .filter((n): n is string => !!n);
});

const hasScoreSources = computed(
  () => questionNames.value.length + calculatedVariableNames.value.length > 0,
);

function focusSurveyProperties() {
  creator.selectElement(creator.survey);
}

const scoreDisplayOptions: { value: ScoreDisplayVariant }[] = [
  { value: "default" },
  { value: "linear" },
  { value: "radial" },
  { value: "temperature" },
  { value: "donut" },
  { value: "bullet" },
  { value: "thermometer" },
  { value: "pills" },
  { value: "table" },
];

const showScoreChartFields = computed(
  () => props.value.scoreDisplay !== "table",
);

const statusLabels = computed<string[]>({
  get: () => {
    const v = props.value.statusLabels;
    return Array.isArray(v) ? (v as string[]) : [];
  },
  set: (next) => {
    props.value.statusLabels = next;
  },
});

function ensureStatusLabels() {
  if (!Array.isArray(props.value.statusLabels)) {
    props.value.statusLabels = [];
  }
}

function addStatusLabel() {
  ensureStatusLabels();
  statusLabels.value.push("");
}

function removeStatusLabel(index: number) {
  ensureStatusLabels();
  statusLabels.value.splice(index, 1);
}

function updateStatusLabel(index: number, raw: string) {
  ensureStatusLabels();
  const labels = statusLabels.value;
  if (index >= labels.length) return;
  labels[index] = raw;
}

const logoSrc = computed<string>({
  get: () => props.value.logoSrc ?? "",
  set: (next) => {
    props.value.logoSrc = next;
  },
});

const images = computed<ResultImage[]>({
  get: () => (Array.isArray(props.value.images) ? props.value.images : []),
  set: (next) => {
    props.value.images = next;
  },
});

const actions = computed<ResultAction[]>({
  get: () => (Array.isArray(props.value.actions) ? props.value.actions : []),
  set: (next) => {
    props.value.actions = next;
  },
});

const layout = computed<ResultBlock[]>({
  get: () => resolveLayout(props.value.layout),
  set: (next) => {
    props.value.layout = next;
  },
});

/** Variables an HTML block can put in braces. */
const variableNames = computed(() => [
  ...new Set([...questionNames.value, ...calculatedVariableNames.value]),
]);

/** Blocks that would show nothing on the page yet. */
const emptyBlockIds = computed(() =>
  layout.value
    .filter((block) => {
      if (block.type === "note") return !props.value.noteText?.trim();
      if (block.type === "actions") return actions.value.length === 0;
      if (block.type === "images") {
        return !images.value.some(
          (image) => (image.placement ?? "afterScore") === block.placement,
        );
      }
      if (block.type === "html") return !block.html?.trim();
      return false;
    })
    .map((block) => block.id),
);

const tableRows = computed<TableRow[]>({
  get: () => {
    const v = props.value.tableRows;
    return Array.isArray(v) ? (v as TableRow[]) : [];
  },
  set: (next) => {
    props.value.tableRows = next;
  },
});

function ensureTableRows() {
  if (!Array.isArray(props.value.tableRows)) {
    props.value.tableRows = [];
  }
}

function addTableRow() {
  ensureTableRows();
  tableRows.value.push({
    id: Date.now() + Math.random(),
    metric: "",
    value: "",
    min: 0,
    max: 100,
    unit: "",
  });
}

function removeTableRow(index: number) {
  ensureTableRows();
  tableRows.value.splice(index, 1);
}

function updateTableRow(
  index: number,
  key: "metric" | "value" | "min" | "max" | "unit",
  raw: unknown,
) {
  ensureTableRows();
  const rows = tableRows.value;
  if (!rows[index]) return;
  const val =
    raw === "" || raw == null
      ? key === "value"
        ? ""
        : undefined
      : (key === "min" || key === "max") && raw !== ""
        ? Number(raw)
        : raw;
  rows[index] = { ...rows[index], [key]: val };
}

// ---- tabs ----

type Tab = "layout" | "content" | "score" | "images" | "actions";
const TABS: Tab[] = ["layout", "content", "score", "images", "actions"];

const tab = ref<Tab>("layout");
const root = ref<HTMLElement>();
const tabButtons = ref<HTMLButtonElement[]>([]);

/** The tab that edits what a block shows; HTML and dividers are set in Layout. */
const BLOCK_TAB: Partial<Record<ResultBlockType, Tab>> = {
  hero: "content",
  note: "content",
  score: "score",
  images: "images",
  actions: "actions",
};

const counts = computed<Partial<Record<Tab, number>>>(() => ({
  images: images.value.length,
  actions: actions.value.length,
}));

/** A chart display with no variable to show. */
const scoreMissing = computed(
  () => showScoreChartFields.value && !props.value.score,
);

function selectTab(next: Tab, focus = false) {
  if (tab.value !== next) {
    tab.value = next;
    // Each tab starts at its top; the parent is the dialog's scrolling column
    root.value?.parentElement?.scrollTo?.({ top: 0 });
  }
  if (focus) nextTick(() => tabButtons.value[TABS.indexOf(next)]?.focus());
}

// Arrow keys move between the tabs (mirrored right to left), Home and End jump
function onTabKeydown(event: KeyboardEvent, index: number) {
  const rtl = getComputedStyle(event.currentTarget as Element).direction === "rtl";
  const step: Record<string, number> = {
    ArrowRight: rtl ? -1 : 1,
    ArrowLeft: rtl ? 1 : -1,
  };
  let next: number;
  if (event.key in step) next = (index + step[event.key] + TABS.length) % TABS.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = TABS.length - 1;
  else return;
  event.preventDefault();
  selectTab(TABS[next], true);
}

const blockTab = (block: ResultBlock) => BLOCK_TAB[block.type];

function editBlock(block: ResultBlock) {
  const target = blockTab(block);
  if (target) selectTab(target);
}

// A block picked on the preview opens where its content is edited, unless
// the layout is being arranged
watch(selectedBlock, (id) => {
  if (!id || tab.value === "layout") return;
  const block = layout.value.find((b) => b.id === id);
  selectTab((block && blockTab(block)) || "layout");
});
</script>

<template>
  <div ref="root" class="flex min-h-full flex-col">
    <div
      role="tablist"
      :aria-label="t('tabs.label')"
      class="sticky top-0 z-10 flex shrink-0 gap-1 overflow-x-auto border-b border-fb-border bg-fb-surface px-3 [scrollbar-width:none] sm:px-5"
    >
      <button
        v-for="(name, index) in TABS"
        :id="`${uid}-tab-${name}`"
        :key="name"
        :ref="(el) => { if (el) tabButtons[index] = el as HTMLButtonElement; }"
        type="button"
        role="tab"
        :aria-selected="tab === name ? 'true' : 'false'"
        :aria-controls="`${uid}-panel-${name}`"
        :tabindex="tab === name ? 0 : -1"
        :data-tab="name"
        class="relative -mb-px flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 border-0 border-b-2 border-solid bg-transparent px-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fb-accent"
        :class="
          tab === name
            ? 'border-fb-accent text-fb-fg'
            : 'border-transparent text-fb-fg-muted hover:text-fb-fg'
        "
        @click="selectTab(name)"
        @keydown="onTabKeydown($event, index)"
      >
        {{ t(`tabs.${name}`) }}
        <span
          v-if="counts[name]"
          class="min-w-4.5 rounded-full px-1.5 py-px text-center text-[10.5px] tabular-nums"
          :class="tab === name ? 'bg-fb-accent-soft text-fb-fg' : 'bg-fb-surface-muted text-fb-fg-muted'"
          >{{ counts[name] }}</span
        >
        <span
          v-if="name === 'score' && scoreMissing"
          class="h-1.5 w-1.5 rounded-full bg-fb-accent"
          data-testid="score-missing"
        >
          <span class="sr-only">{{ t("tabs.needsAttention") }}</span>
        </span>
      </button>
    </div>

    <!-- Layout -->
    <div
      v-show="tab === 'layout'"
      :id="`${uid}-panel-layout`"
      role="tabpanel"
      :aria-labelledby="`${uid}-tab-layout`"
      class="px-4 py-5 sm:px-6"
    >
      <ResultLayoutEditor
        v-model="layout"
        v-model:selected="selectedBlock"
        :status-labels="statusLabels"
        :variables="variableNames"
        :empty-ids="emptyBlockIds"
        :edit-label="(block) => { const target = blockTab(block); return target && t(`tabs.${target}`); }"
        @edit="editBlock"
      />
    </div>

    <!-- Content: the hero, the note and the brand -->
    <div
      v-show="tab === 'content'"
      :id="`${uid}-panel-content`"
      role="tabpanel"
      :aria-labelledby="`${uid}-tab-content`"
      class="flex flex-col gap-6 px-4 py-5 sm:px-6"
    >
      <section class="space-y-3.5" :aria-labelledby="`${uid}-copy`">
        <h3 :id="`${uid}-copy`" :class="headingClass">{{ t("groups.copy") }}</h3>
        <div class="flex flex-col gap-1.5">
          <label :for="`${uid}-title`" :class="labelClass">{{ t("fields.title.label") }}</label>
          <input :id="`${uid}-title`" v-model="props.title" type="text" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label :for="`${uid}-subtitle`" :class="labelClass">{{ t("fields.subtitle.label") }}</label>
          <input :id="`${uid}-subtitle`" v-model="props.subtitle" type="text" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label :for="`${uid}-description`" :class="labelClass">{{
            t("fields.description.label")
          }}</label>
          <textarea
            :id="`${uid}-description`"
            v-model="props.description"
            rows="3"
            class="resize-y leading-relaxed"
            :class="inputClass"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label :for="`${uid}-note`" :class="labelClass">{{ t("fields.noteText.label") }}</label>
          <textarea
            :id="`${uid}-note`"
            v-model="props.noteText"
            rows="3"
            class="resize-y leading-relaxed"
            :class="inputClass"
          />
        </div>
      </section>

      <section
        class="space-y-3.5 border-t border-fb-border pt-5"
        :aria-labelledby="`${uid}-brand`"
      >
        <h3 :id="`${uid}-brand`" :class="headingClass">{{ t("groups.brand") }}</h3>
        <ImageSourceField v-model="logoSrc" :label="t('fields.logoSrc.label')" />
        <div class="grid gap-3.5 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <label :for="`${uid}-brand-name`" :class="labelClass">{{
              t("fields.brandName.label")
            }}</label>
            <input :id="`${uid}-brand-name`" v-model="props.brandName" type="text" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label :for="`${uid}-chip`" :class="labelClass">{{
              t("fields.categoryChip.label")
            }}</label>
            <input :id="`${uid}-chip`" v-model="props.categoryChip" type="text" :class="inputClass" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label :for="`${uid}-tagline`" :class="labelClass">{{
            t("fields.brandTagline.label")
          }}</label>
          <input :id="`${uid}-tagline`" v-model="props.brandTagline" type="text" :class="inputClass" />
        </div>
      </section>
    </div>

    <!-- Score: its display and source, and the status tiers it falls into -->
    <div
      v-show="tab === 'score'"
      :id="`${uid}-panel-score`"
      role="tabpanel"
      :aria-labelledby="`${uid}-tab-score`"
      class="flex flex-col gap-6 px-4 py-5 sm:px-6"
    >
      <section class="space-y-3.5" :aria-labelledby="`${uid}-display`">
        <h3 :id="`${uid}-display`" :class="headingClass">{{ t("groups.display") }}</h3>
        <div class="flex flex-col gap-1.5">
          <label :for="`${uid}-score-display`" :class="labelClass">{{
            t("fields.scoreDisplay.label")
          }}</label>
          <select :id="`${uid}-score-display`" v-model="props.scoreDisplay" :class="inputClass">
            <option v-for="o in scoreDisplayOptions" :key="o.value" :value="o.value">
              {{ t(`options.scoreDisplay.${o.value}`) }}
            </option>
          </select>
        </div>

        <div v-if="showScoreChartFields" class="flex flex-col gap-1.5">
          <label :for="`${uid}-score`" :class="labelClass">{{ t("fields.score.label") }}</label>
          <select
            v-if="hasScoreSources"
            :id="`${uid}-score`"
            v-model="props.score"
            :class="inputClass"
            :aria-describedby="scoreMissing ? `${uid}-score-help` : undefined"
          >
            <option value="">
              {{ t("none") }}
            </option>
            <optgroup v-if="questionNames.length > 0" :label="t('questions')">
              <option v-for="name in questionNames" :key="`q:${name}`" :value="name">
                {{ name }}
              </option>
            </optgroup>
            <optgroup v-if="calculatedVariableNames.length > 0" :label="t('calculatedValues')">
              <option v-for="name in calculatedVariableNames" :key="`c:${name}`" :value="name">
                {{ name }}
              </option>
            </optgroup>
          </select>
          <p v-if="hasScoreSources && scoreMissing" :id="`${uid}-score-help`" :class="helpClass">
            {{ t("fields.score.help") }}
          </p>
          <div
            v-if="!hasScoreSources"
            class="flex flex-col gap-2 rounded-lg border border-dashed border-fb-border p-3"
          >
            <p :class="helpClass">
              {{ t("noSourcesYet") }}
            </p>
            <button
              type="button"
              class="self-start"
              :class="smallButtonClass"
              @click="focusSurveyProperties"
            >
              {{ t("openSurveyProperties") }}
            </button>
          </div>
        </div>

        <div v-if="showScoreChartFields" class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label :for="`${uid}-min`" :class="labelClass">{{ t("fields.min.label") }}</label>
            <input :id="`${uid}-min`" v-model.number="props.min" type="number" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label :for="`${uid}-max`" :class="labelClass">{{ t("fields.max.label") }}</label>
            <input
              :id="`${uid}-max`"
              v-model.number="props.max"
              type="number"
              :min="1"
              :class="inputClass"
            />
          </div>
        </div>

        <div v-if="props.scoreDisplay === 'table'" class="space-y-3">
          <span :class="labelClass" class="block">{{ t("fields.tableRows.label") }}</span>
          <div
            v-for="(row, index) in tableRows"
            :key="row.id as string | number"
            class="rounded-lg border border-fb-border bg-fb-surface p-3 space-y-2.5"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-[12px] font-semibold text-fb-fg-muted"
                >{{ t("row") }} {{ index + 1 }}</span
              >
              <button type="button" :class="smallButtonClass" @click="removeTableRow(index)">
                {{ t("remove") }}
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <label class="col-span-2 flex flex-col gap-1">
                <span class="text-[11.5px] font-semibold text-fb-fg-secondary">{{
                  t("fields.metric.label")
                }}</span>
                <input
                  :value="(row.metric as string) ?? ''"
                  type="text"
                  :class="inputClass"
                  @input="updateTableRow(index, 'metric', ($event.target as HTMLInputElement).value)"
                />
              </label>

              <label class="col-span-2 flex flex-col gap-1">
                <span class="text-[11.5px] font-semibold text-fb-fg-secondary">{{
                  t("fields.valueVariable.label")
                }}</span>
                <select
                  v-if="hasScoreSources"
                  :value="(row.value as string) ?? ''"
                  :class="inputClass"
                  @change="updateTableRow(index, 'value', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">
                    {{ t("pickQuestionOrCalculated") }}
                  </option>
                  <optgroup v-if="questionNames.length > 0" :label="t('questions')">
                    <option v-for="name in questionNames" :key="`q:${name}`" :value="name">
                      {{ name }}
                    </option>
                  </optgroup>
                  <optgroup v-if="calculatedVariableNames.length > 0" :label="t('calculatedValues')">
                    <option v-for="name in calculatedVariableNames" :key="`c:${name}`" :value="name">
                      {{ name }}
                    </option>
                  </optgroup>
                </select>
                <span v-else :class="helpClass">{{ t("noSourcesYet") }}</span>
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-[11.5px] font-semibold text-fb-fg-secondary">{{
                  t("fields.min.label")
                }}</span>
                <input
                  :value="row.min ?? ''"
                  type="number"
                  :class="inputClass"
                  @input="updateTableRow(index, 'min', ($event.target as HTMLInputElement).value)"
                />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-[11.5px] font-semibold text-fb-fg-secondary">{{
                  t("fields.max.label")
                }}</span>
                <input
                  :value="row.max ?? ''"
                  type="number"
                  :class="inputClass"
                  @input="updateTableRow(index, 'max', ($event.target as HTMLInputElement).value)"
                />
              </label>
              <label class="col-span-2 flex flex-col gap-1">
                <span class="text-[11.5px] font-semibold text-fb-fg-secondary">{{
                  t("fields.unit.label")
                }}</span>
                <input
                  :value="(row.unit as string) ?? ''"
                  type="text"
                  :class="inputClass"
                  @input="updateTableRow(index, 'unit', ($event.target as HTMLInputElement).value)"
                />
              </label>
            </div>
          </div>

          <button type="button" :class="addButtonClass" @click="addTableRow">
            {{ t("addRow") }}
          </button>
        </div>
      </section>

      <section
        class="space-y-3 border-t border-fb-border pt-5"
        :aria-labelledby="`${uid}-segments`"
      >
        <div class="space-y-1">
          <h3 :id="`${uid}-segments`" :class="headingClass">{{ t("fields.statusLabels.label") }}</h3>
          <p :class="helpClass">{{ t("fields.statusLabels.help") }}</p>
        </div>
        <ol class="m-0 list-none space-y-2 p-0">
          <li v-for="(label, index) in statusLabels" :key="index" class="flex items-center gap-2">
            <span
              class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fb-surface-muted text-[11px] font-semibold tabular-nums text-fb-fg-muted"
              aria-hidden="true"
              >{{ index + 1 }}</span
            >
            <input
              :value="label"
              type="text"
              :aria-label="`${t('fields.statusLabels.label')} ${index + 1}`"
              :class="inputClass"
              class="flex-1"
              @input="updateStatusLabel(index, ($event.target as HTMLInputElement).value)"
            />
            <button
              type="button"
              :disabled="statusLabels.length <= 1"
              :aria-label="`${t('remove')}: ${label || index + 1}`"
              :class="smallButtonClass"
              @click="removeStatusLabel(index)"
            >
              {{ t("remove") }}
            </button>
          </li>
        </ol>
        <button type="button" :class="addButtonClass" @click="addStatusLabel">
          {{ t("addStatusLabel") }}
        </button>
      </section>
    </div>

    <!-- Images -->
    <div
      v-show="tab === 'images'"
      :id="`${uid}-panel-images`"
      role="tabpanel"
      :aria-labelledby="`${uid}-tab-images`"
      class="px-4 py-5 sm:px-6"
    >
      <ResultImagesEditor v-model="images" :status-labels="statusLabels" />
    </div>

    <!-- Buttons -->
    <div
      v-show="tab === 'actions'"
      :id="`${uid}-panel-actions`"
      role="tabpanel"
      :aria-labelledby="`${uid}-tab-actions`"
      class="px-4 py-5 sm:px-6"
    >
      <ResultActionsEditor
        v-model="actions"
        :status-labels="statusLabels"
        :min="props.min"
        :max="props.max"
      />
    </div>
  </div>
</template>
