<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useSurveyCreator } from "../provider/surveyCreator";
import useFormBuilderI18n from "../composables/useFormBuilderI18n.ts";
import type {
  ScoreDisplayVariant,
  SurveyResultProps,
  TableRow,
} from "../types/index.ts";

const props = defineModel<SurveyResultProps>("props", { required: true });

const creator = useSurveyCreator();
const { t } = useFormBuilderI18n();

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
  if (!labels[index]) return;
  labels[index] = raw;
}

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
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Score -->
    <section>
      <h3
        class="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-wider text-fb-fg-muted"
      >
        {{ t("surveyResultEditor.groups.score") }}
      </h3>
      <div class="mt-3 space-y-3.5">
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.scoreDisplay.label")
          }}</label>
          <select
            v-model="props.scoreDisplay"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          >
            <option
              v-for="o in scoreDisplayOptions"
              :key="o.value"
              :value="o.value"
            >
              {{ t(`surveyResultEditor.options.scoreDisplay.${o.value}`) }}
            </option>
          </select>
        </div>

        <div v-if="showScoreChartFields" class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.score.label")
          }}</label>
          <select
            v-if="hasScoreSources"
            v-model="props.score"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          >
            <option value="">{{ t("surveyResultEditor.none") }}</option>
            <optgroup
              v-if="questionNames.length > 0"
              :label="t('surveyResultEditor.questions')"
            >
              <option
                v-for="name in questionNames"
                :key="`q:${name}`"
                :value="name"
              >
                {{ name }}
              </option>
            </optgroup>
            <optgroup
              v-if="calculatedVariableNames.length > 0"
              :label="t('surveyResultEditor.calculatedValues')"
            >
              <option
                v-for="name in calculatedVariableNames"
                :key="`c:${name}`"
                :value="name"
              >
                {{ name }}
              </option>
            </optgroup>
          </select>
          <div v-else class="flex flex-col gap-2">
            <p class="text-xs leading-snug text-fb-fg-muted">
              {{ t("surveyResultEditor.noSourcesYet") }}
            </p>
            <button
              type="button"
              class="self-start cursor-pointer rounded-lg border border-fb-border bg-fb-surface-muted px-3 py-1.5 text-xs font-semibold text-fb-fg hover:bg-fb-border"
              @click="focusSurveyProperties"
            >
              {{ t("surveyResultEditor.openSurveyProperties") }}
            </button>
          </div>
        </div>

        <div v-if="showScoreChartFields" class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.min.label")
          }}</label>
          <input
            v-model.number="props.min"
            type="number"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>

        <div v-if="showScoreChartFields" class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.max.label")
          }}</label>
          <input
            v-model.number="props.max"
            type="number"
            :min="1"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>

        <div
          v-if="props.scoreDisplay === 'table'"
          class="rounded-xl border border-fb-border bg-fb-surface-muted/40 p-3.5 space-y-3"
        >
          <span
            class="block font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-wider text-fb-fg-muted"
          >
            {{ t("surveyResultEditor.fields.tableRows.label") }}
          </span>
          <div class="space-y-4">
            <div
              v-for="(row, index) in tableRows"
              :key="row.id as string | number"
              class="rounded-lg border border-fb-border bg-fb-surface p-3 space-y-2.5"
            >
              <div class="flex items-center justify-between gap-2">
                <span
                  class="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-wider text-fb-fg-muted"
                  >{{ t("surveyResultEditor.row") }} {{ index + 1 }}</span
                >
                <button
                  type="button"
                  class="cursor-pointer rounded-md border border-fb-border bg-fb-surface-muted px-2 py-1 text-[11px] font-semibold text-fb-fg-muted hover:bg-fb-border"
                  @click="removeTableRow(index)"
                >
                  {{ t("surveyResultEditor.remove") }}
                </button>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <label class="flex flex-col gap-1 col-span-2">
                  <span
                    class="text-[11.5px] font-semibold text-fb-fg-secondary"
                    >{{ t("surveyResultEditor.fields.metric.label") }}</span
                  >
                  <input
                    :value="(row.metric as string) ?? ''"
                    type="text"
                    class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
                    @input="
                      updateTableRow(
                        index,
                        'metric',
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                  />
                </label>

                <label class="flex flex-col gap-1">
                  <span
                    class="text-[11.5px] font-semibold text-fb-fg-secondary"
                    >{{ t("surveyResultEditor.fields.unit.label") }}</span
                  >
                  <input
                    :value="(row.unit as string) ?? ''"
                    type="text"
                    class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
                    @input="
                      updateTableRow(
                        index,
                        'unit',
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                  />
                </label>

                <div class="grid grid-cols-2 gap-2.5">
                  <label class="flex flex-col gap-1">
                    <span
                      class="text-[11.5px] font-semibold text-fb-fg-secondary"
                      >{{ t("surveyResultEditor.fields.min.label") }}</span
                    >
                    <input
                      :value="row.min ?? ''"
                      type="number"
                      class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
                      @input="
                        updateTableRow(
                          index,
                          'min',
                          ($event.target as HTMLInputElement).value,
                        )
                      "
                    />
                  </label>
                  <label class="flex flex-col gap-1">
                    <span
                      class="text-[11.5px] font-semibold text-fb-fg-secondary"
                      >{{ t("surveyResultEditor.fields.max.label") }}</span
                    >
                    <input
                      :value="row.max ?? ''"
                      type="number"
                      class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
                      @input="
                        updateTableRow(
                          index,
                          'max',
                          ($event.target as HTMLInputElement).value,
                        )
                      "
                    />
                  </label>
                </div>
              </div>

              <label class="flex flex-col gap-1">
                <span
                  class="text-[11.5px] font-semibold text-fb-fg-secondary"
                  >{{
                    t("surveyResultEditor.fields.valueVariable.label")
                  }}</span
                >
                <select
                  v-if="hasScoreSources"
                  :value="(row.value as string) ?? ''"
                  class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
                  @change="
                    updateTableRow(
                      index,
                      'value',
                      ($event.target as HTMLSelectElement).value,
                    )
                  "
                >
                  <option value="">
                    {{ t("surveyResultEditor.pickQuestionOrCalculated") }}
                  </option>
                  <optgroup
                    v-if="questionNames.length > 0"
                    :label="t('surveyResultEditor.questions')"
                  >
                    <option
                      v-for="name in questionNames"
                      :key="`q:${name}`"
                      :value="name"
                    >
                      {{ name }}
                    </option>
                  </optgroup>
                  <optgroup
                    v-if="calculatedVariableNames.length > 0"
                    :label="t('surveyResultEditor.calculatedValues')"
                  >
                    <option
                      v-for="name in calculatedVariableNames"
                      :key="`c:${name}`"
                      :value="name"
                    >
                      {{ name }}
                    </option>
                  </optgroup>
                </select>
                <div v-else class="flex flex-col gap-2">
                  <p class="text-xs leading-snug text-fb-fg-muted">
                    {{ t("surveyResultEditor.noSourcesYet") }}
                  </p>
                  <button
                    type="button"
                    class="self-start cursor-pointer rounded-lg border border-fb-border bg-fb-surface-muted px-3 py-1.5 text-xs font-semibold text-fb-fg hover:bg-fb-border"
                    @click="focusSurveyProperties"
                  >
                    {{ t("surveyResultEditor.openSurveyProperties") }}
                  </button>
                </div>
              </label>
            </div>

            <button
              type="button"
              class="w-full cursor-pointer rounded-lg border border-dashed border-fb-border-strong bg-fb-surface-muted/40 px-3 py-2.5 text-sm font-semibold text-fb-fg hover:bg-fb-surface-muted"
              @click="addTableRow"
            >
              {{ t("surveyResultEditor.addRow") }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Brand -->
    <section>
      <h3
        class="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-wider text-fb-fg-muted"
      >
        {{ t("surveyResultEditor.groups.brand") }}
      </h3>
      <div class="mt-3 space-y-3.5">
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.logoSrc.label")
          }}</label>
          <input
            v-model="props.logoSrc"
            type="text"
            :placeholder="t('surveyResultEditor.fields.logoSrc.placeholder')"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.brandName.label")
          }}</label>
          <input
            v-model="props.brandName"
            type="text"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.brandTagline.label")
          }}</label>
          <input
            v-model="props.brandTagline"
            type="text"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.categoryChip.label")
          }}</label>
          <input
            v-model="props.categoryChip"
            type="text"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>
      </div>
    </section>

    <!-- Copy -->
    <section>
      <h3
        class="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-wider text-fb-fg-muted"
      >
        {{ t("surveyResultEditor.groups.copy") }}
      </h3>
      <div class="mt-3 space-y-3.5">
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.title.label")
          }}</label>
          <input
            v-model="props.title"
            type="text"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.subtitle.label")
          }}</label>
          <input
            v-model="props.subtitle"
            type="text"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.description.label")
          }}</label>
          <textarea
            v-model="props.description"
            rows="3"
            class="resize-y rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm leading-relaxed text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.noteText.label")
          }}</label>
          <textarea
            v-model="props.noteText"
            rows="3"
            class="resize-y rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm leading-relaxed text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.primaryLabel.label")
          }}</label>
          <input
            v-model="props.primaryLabel"
            type="text"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.secondaryLabel.label")
          }}</label>
          <input
            v-model="props.secondaryLabel"
            type="text"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-fb-fg-secondary">{{
            t("surveyResultEditor.fields.closeLabel.label")
          }}</label>
          <input
            v-model="props.closeLabel"
            type="text"
            class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
          />
        </div>
      </div>
    </section>

    <!-- Status labels -->
    <section>
      <h3
        class="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-wider text-fb-fg-muted"
      >
        {{ t("surveyResultEditor.groups.segments") }}
      </h3>
      <div class="mt-3 space-y-3.5">
        <div class="flex flex-col gap-1.5">
          <span
            class="text-[12px] font-semibold text-fb-fg-secondary"
            >{{ t("surveyResultEditor.fields.statusLabels.label") }}</span
          >
          <p class="text-xs leading-snug text-fb-fg-muted">
            {{ t("surveyResultEditor.fields.statusLabels.help") }}
          </p>
          <div class="space-y-2.5">
            <div
              v-for="(label, index) in statusLabels"
              :key="index"
              class="flex items-center gap-2"
            >
              <span
                class="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-wider text-fb-fg-muted w-6 shrink-0"
                >{{ index + 1 }}</span
              >
              <input
                :value="label"
                type="text"
                class="flex-1 rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
                @input="
                  updateStatusLabel(
                    index,
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
              <button
                type="button"
                :disabled="statusLabels.length <= 1"
                class="shrink-0 cursor-pointer rounded-md border border-fb-border bg-fb-surface-muted px-2 py-1 text-[11px] font-semibold text-fb-fg-muted hover:bg-fb-border disabled:cursor-not-allowed disabled:opacity-50"
                @click="removeStatusLabel(index)"
              >
                {{ t("surveyResultEditor.remove") }}
              </button>
            </div>
            <button
              type="button"
              class="w-full cursor-pointer rounded-lg border border-dashed border-fb-border-strong bg-fb-surface-muted/40 px-3 py-2.5 text-sm font-semibold text-fb-fg hover:bg-fb-surface-muted"
              @click="addStatusLabel"
            >
              {{ t("surveyResultEditor.addStatusLabel") }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
