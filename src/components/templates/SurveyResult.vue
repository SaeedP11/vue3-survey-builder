<script setup lang="ts">
import { computed, ref, type Component } from "vue";

defineOptions({ inheritAttrs: false });
import LinearHealthGauge from "../widgets/LinearHealthGauge.vue";
import RadialGauge from "../widgets/RadialGauge.vue";
import TemperatureGauge from "../widgets/TemperatureGauge.vue";
import DonutGauge from "../widgets/DonutGauge.vue";
import BulletChart from "../widgets/BulletChart.vue";
import VerticalThermometer from "../widgets/VerticalThermometer.vue";
import SegmentedPills from "../widgets/SegmentedPills.vue";
import Table from "../widgets/Table.vue";
import type {
  ResultAction,
  ResultBlock,
  ResultImage,
  ResultImagePlacement,
  SurveyResultProps,
  TableRow,
} from "../../types/index.ts";
import DefaultScoreCard from "../widgets/DefaultScoreCard.vue";
import HideableSection from "./HideableSection.vue";
import ResultActionIcon from "./ResultActionIcon.vue";
import ResultCanvasBlock from "./ResultCanvasBlock.vue";
import ResultHtmlBlock from "./ResultHtmlBlock.vue";
import ResultImages from "./ResultImages.vue";
import { useSurveyCreator } from "../../provider/surveyCreator.ts";
import useBlockDrag from "../../composables/useBlockDrag.ts";
import useLocalI18n from "../../composables/useLocalI18n.ts";
import { surveyResult } from "../../locales/index.ts";
import {
  actionHasCondition,
  actionShownFor,
  imagesForScore,
  resolveActions,
  safeLinkUrl,
} from "../../utils/resultContent.ts";
import {
  blockShownFor,
  dropBlock,
  htmlBlockName,
  moveBlock,
  resolveLayout,
  type BlockDrag,
} from "../../utils/resultLayout.ts";
import {
  fillHtmlPlaceholders,
  isTemplateVariable,
  sanitizeResultHtml,
} from "../../utils/resultHtml.ts";
import { pickLabel, tierIndex } from "../../utils/statusTiers.ts";

// A template without scoreDisplay (hand-written or older JSON) still shows its score
const props = withDefaults(
  defineProps<
    SurveyResultProps & {
      /**
       * In the result editor: links do not navigate, every block and image
       * shows, and the blocks can be selected, dragged and hidden.
       */
      preview?: boolean;
      /** The block selected in the editor. */
      selectedBlock?: string | null;
    }
  >(),
  { scoreDisplay: "default" },
);

const emit = defineEmits<{
  /** Every button click, with the button. */
  action: [action: ResultAction];
  restart: [];
  close: [];
  /** @deprecated Listen to `action`; a button with the id `primary` also emits this. */
  primary: [];
  /** @deprecated Listen to `action`; a button with the id `secondary` also emits this. */
  secondary: [];
  /** In the preview: the layout after a drag, a move or a hide. */
  "update:layout": [layout: ResultBlock[]];
  /** In the preview: the block clicked, dragged or dropped. */
  "update:selectedBlock": [id: string | null];
}>();

const { t, tm, rt, locale } = useLocalI18n(surveyResult);

const ui = computed(() => {
  const or = (v: string | undefined, fallback: string) =>
    v && v.trim().length > 0 ? v : fallback;

  return {
    brandName: or(props.brandName, t("brandName")),
    brandTagline: or(props.brandTagline, t("brandTagline")),
    categoryChip: or(props.categoryChip, t("categoryChip")),
    title: or(props.title, t("title")),
    subtitle: or(props.subtitle, t("subtitle")),
    description: or(props.description, t("description")),
    noteText: or(props.noteText, t("noteText")),
  };
});

// The editor shows every button; a respondent sees those their score allows
const actions = computed(() =>
  resolveActions(props, {
    primaryLabel: t("primaryLabel"),
    secondaryLabel: t("secondaryLabel"),
    close: t("close"),
  }).filter(
    (a) =>
      a.label &&
      a.label.trim().length > 0 &&
      (props.preview || actionShownFor(a, numericScore.value, scoreTier.value)),
  ),
);
// Filled buttons share a row; text buttons sit under it, as the close button did
const buttonActions = computed(() =>
  actions.value.filter((a) => (a.variant ?? "primary") !== "text"),
);
// Two filled buttons share a row; with more, the primary ones get a row of their own
// above the rest, so the main call to action never shrinks
const buttonRows = computed<ResultAction[][]>(() => {
  const filled = buttonActions.value;
  if (filled.length <= 2) return filled.length ? [filled] : [];
  const primary = filled.filter((a) => (a.variant ?? "primary") === "primary");
  const rest = filled.filter((a) => (a.variant ?? "primary") !== "primary");
  return [primary, rest].filter((row) => row.length > 0);
});
const textActions = computed(() =>
  actions.value.filter((a) => a.variant === "text"),
);

/** A link button's address, when it has a safe one. */
const hrefOf = (action: ResultAction) =>
  action.type === "link" ? safeLinkUrl(action.url) : undefined;

function onAction(action: ResultAction, event: MouseEvent) {
  // The editor's preview stays put
  if (props.preview && action.type === "link") event.preventDefault();
  emit("action", action);
  if (action.type === "close") emit("close");
  else if (action.type === "restart") emit("restart");
  else if (action.type === "print" && !props.preview) window.print();
  else if (action.type === "custom" && action.id === "primary") emit("primary");
  else if (action.type === "custom" && action.id === "secondary")
    emit("secondary");
}

const buttonClass = (action: ResultAction) => {
  const base =
    "flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-[15px] font-bold no-underline cursor-pointer font-fb transition-[filter,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sjs-primary-backcolor)]";
  switch (action.variant ?? "primary") {
    case "secondary":
      return `${base} flex-[1_1_11rem] min-w-0 bg-[var(--sjs-general-backcolor)] text-[var(--sjs-general-forecolor)] border-[1.5px] border-[var(--sjs-border-default)] hover:bg-[var(--sjs-general-backcolor-dim)]`;
    case "text":
      return `${base} w-full min-h-11 bg-transparent text-[var(--sjs-general-forecolor-light)] text-sm font-semibold border-0 hover:text-[var(--sjs-general-forecolor)]`;
    default:
      return `${base} flex-[1_1_11rem] min-w-0 bg-[var(--sjs-primary-backcolor)] text-[var(--sjs-primary-forecolor)] border-0 hover:brightness-95`;
  }
};

const hasText = (v: string | undefined) => !!v && v.trim().length > 0;

const numericScore = computed(() =>
  typeof props.score === "number" ? props.score : undefined,
);
const chartValue = computed(() => numericScore.value ?? 0);

const statusLabels = computed<string[]>(() => {
  if (Array.isArray(props.statusLabels) && props.statusLabels.length) {
    return props.statusLabels;
  }
  // t() returns the key for an array message; tm() gives the array. It is
  // cast because its generic key typing recurses too deep for vue-tsc here.
  const i18nLabels = (tm as (key: string) => unknown)("statusLabels");
  if (Array.isArray(i18nLabels) && i18nLabels.length) {
    return i18nLabels.map((m) => rt(m));
  }
  return ["Mild", "Moderate", "Severe", "Critical"];
});

/** The tier the score falls in; undefined without a score. */
const scoreTier = computed(() =>
  numericScore.value === undefined
    ? undefined
    : tierIndex(
        numericScore.value,
        props.min ?? 0,
        props.max ?? 100,
        statusLabels.value.length,
      ),
);

// The editor shows every image; a respondent sees those for their score's tier
const visibleImages = computed<ResultImage[]>(() => {
  const images = Array.isArray(props.images) ? props.images : [];
  if (props.preview) return images;
  return imagesForScore(
    images,
    numericScore.value,
    props.min ?? 0,
    props.max ?? 100,
    statusLabels.value.length,
  );
});
const imagesAt = (placement: ResultImagePlacement | undefined) =>
  visibleImages.value.filter(
    (image) => (image.placement ?? "afterScore") === placement,
  );

const resolvedTableRows = computed<TableRow[]>(() => {
  const raw = props.tableRows;
  return Array.isArray(raw) ? (raw as TableRow[]) : [];
});

// ---- layout ----

const layout = computed(() => resolveLayout(props.layout));

/** `{$score}` and the other template values, once there is a score to fill them from. */
const templateValues = computed<Record<string, unknown> | undefined>(() => {
  const score = numericScore.value;
  if (score === undefined) return undefined;
  const number = new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: 2,
  });
  return {
    $score: number.format(score),
    $status: pickLabel(statusLabels.value, scoreTier.value ?? 0, ""),
    $min: number.format(props.min ?? 0),
    $max: number.format(props.max ?? 100),
  };
});

/** Each HTML block's markup, its template values filled and sanitized. */
const blockHtml = computed(() => {
  const values = templateValues.value;
  const out: Record<string, string> = {};
  for (const block of layout.value) {
    if (block.type !== "html") continue;
    const html = block.html ?? "";
    out[block.id] = sanitizeResultHtml(
      values ? fillHtmlPlaceholders(html, values, isTemplateVariable) : html,
    );
  }
  return out;
});

function hasContent(block: ResultBlock): boolean {
  switch (block.type) {
    case "note":
      return hasText(props.noteText);
    case "images":
      return imagesAt(block.placement).length > 0;
    case "actions":
      return actions.value.length > 0;
    case "html":
      // The editor shows an empty block, with a hint, so it can be found
      return props.preview || !!blockHtml.value[block.id];
    default:
      return true;
  }
}

// Respondents can hide a section from their own view (e.g. before printing)
const dismissed = ref(new Set<string>());
const HIDEABLE = ["hero", "score", "note", "actions"];

const rendered = computed(() =>
  layout.value.flatMap((block, index) => {
    if (!props.preview) {
      if (!blockShownFor(block, scoreTier.value)) return [];
      if (dismissed.value.has(block.id)) return [];
    }
    return hasContent(block) ? [{ block, index }] : [];
  }),
);

const isBanner = (block: ResultBlock) =>
  block.type === "images" && block.placement === "banner";

const blockLabel = (block: ResultBlock) => {
  if (block.type === "images") return t(`blocks.images.${block.placement}`);
  return (block.type === "html" && htmlBlockName(block.html)) || t(`blocks.${block.type}`);
};

/** In the preview: the scores a button shows for, as its tier's label or a range. */
function conditionLabel(action: ResultAction): string {
  if (!props.preview || !actionHasCondition(action)) return "";
  const number = new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 });
  const parts: string[] = [];
  if (typeof action.tier === "number") {
    parts.push(statusLabels.value[action.tier] || `${action.tier + 1}`);
  }
  const { scoreMin: min, scoreMax: max } = action;
  if (typeof min === "number" && typeof max === "number") {
    parts.push(`${number.format(min)}–${number.format(max)}`);
  } else if (typeof min === "number") {
    parts.push(`≥ ${number.format(min)}`);
  } else if (typeof max === "number") {
    parts.push(`≤ ${number.format(max)}`);
  }
  return t("images.onlyFor", { tier: parts.join(", ") });
}

const tierLabel = (block: ResultBlock) =>
  block.tier === undefined
    ? undefined
    : statusLabels.value[block.tier] || `${block.tier + 1}`;

function dismiss(id: string) {
  dismissed.value = new Set(dismissed.value).add(id);
}

const restoreSections = () => {
  dismissed.value = new Set();
};

// ---- editing in the preview ----

const drag = useBlockDrag();

function setLayout(next: ResultBlock[]) {
  if (next !== layout.value) emit("update:layout", next);
}

function select(id: string | null) {
  if (id !== props.selectedBlock) emit("update:selectedBlock", id);
}

/** Moves the block one place among the blocks the preview shows. */
function moveShown(position: number, by: -1 | 1) {
  const from = rendered.value[position]?.index;
  const neighbour = rendered.value[position + by]?.index;
  if (from === undefined || neighbour === undefined) return;
  setLayout(moveBlock(layout.value, from, by === -1 ? neighbour : neighbour + 1));
}

function dropOn(index: number, side: "before" | "after", dragged: BlockDrag) {
  setLayout(dropBlock(layout.value, dragged, side === "before" ? index : index + 1));
  select(dragged.kind === "add" ? dragged.block.id : dragged.id);
}

function dropAtEnd(event: DragEvent) {
  const dragged = drag.take(event);
  if (dragged) dropOn(layout.value.length - 1, "after", dragged);
}

function toggleHidden(id: string) {
  setLayout(
    layout.value.map((b) => {
      if (b.id !== id) return b;
      const { hidden, ...rest } = b;
      return hidden ? rest : { ...rest, hidden: true };
    }),
  );
}

/** What wraps a block: the editor's chrome, the respondent's hide button, or nothing. */
function wrapperOf(block: ResultBlock): Component | string {
  if (props.preview) return ResultCanvasBlock;
  return HIDEABLE.includes(block.type) ? HideableSection : "div";
}

function wrapperBindings(block: ResultBlock, index: number, position: number) {
  if (props.preview) {
    return {
      id: block.id,
      label: blockLabel(block),
      index: position,
      count: rendered.value.length,
      selected: props.selectedBlock === block.id,
      hidden: !!block.hidden,
      tierLabel: tierLabel(block),
      onSelect: () => select(block.id),
      onMove: (by: -1 | 1) => moveShown(position, by),
      onToggleHidden: () => toggleHidden(block.id),
      onDrop: (side: "before" | "after", dragged: BlockDrag) =>
        dropOn(index, side, dragged),
    };
  }
  return HIDEABLE.includes(block.type) ? { onHide: () => dismiss(block.id) } : {};
}

const first = computed(() => rendered.value[0]?.block);
const last = computed(() => rendered.value.at(-1)?.block);

const creator = useSurveyCreator();
const themeVars = computed<Record<string, string>>(
  () => ({ ...(creator.theme?.cssVariables ?? {}) }) as Record<string, string>,
);
</script>

<template>
  <div
    class="min-h-screen w-full flex items-center justify-center px-5 py-12 bg-[var(--sjs-general-backcolor-dim)] font-fb box-border"
    :style="themeVars"
  >
    <div
      class="w-4/5 max-w-155 bg-[var(--sjs-general-backcolor)] text-[var(--sjs-general-forecolor)]"
    >
      <header
        class="flex items-center justify-between px-7.5 py-5 border-b border-[var(--sjs-border-light)]"
      >
        <div class="flex items-center gap-3">
          <img
            v-if="logoSrc"
            :src="logoSrc"
            :alt="ui.brandName"
            class="block w-10.5 h-10.5 rounded-[11px] object-cover"
          />
          <div
            v-else
            class="block w-10.5 h-10.5 rounded-[11px] bg-[var(--sjs-primary-backcolor)]"
            aria-hidden="true"
          />
          <div class="flex flex-col gap-px">
            <span
              class="text-base font-extrabold tracking-[0.01em] text-[var(--sjs-general-forecolor)]"
              >{{ ui.brandName }}</span
            >
            <span
              class="text-[11.5px] font-medium text-[var(--sjs-general-forecolor-light)]"
              >{{ ui.brandTagline }}</span
            >
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="text-[11px] font-bold text-[var(--sjs-special-green)] bg-[var(--sjs-special-green-light)] border border-[var(--sjs-special-green-light)] px-3 py-1.5 rounded-full"
            >{{ ui.categoryChip }}</span
          >
          <button
            v-if="!preview && dismissed.size > 0"
            type="button"
            class="text-[11px] font-semibold text-[var(--sjs-general-forecolor-light)] bg-transparent border border-dashed border-[var(--sjs-border-default)] px-3 py-1.5 rounded-full cursor-pointer hover:text-[var(--sjs-primary-backcolor)] hover:border-[var(--sjs-primary-backcolor)]"
            @click="restoreSections"
          >
            {{ t("restoreHidden") }}
          </button>
        </div>
      </header>

      <div
        class="flex flex-col gap-7"
        :class="[
          first && !isBanner(first) ? 'pt-9.5' : '',
          !last || !isBanner(last) ? 'pb-8.5' : '',
        ]"
      >
        <div
          v-for="({ block, index }, position) in rendered"
          :key="block.id"
          :class="isBanner(block) ? '' : 'px-9.5'"
          :data-block="block.type"
        >
          <component
            :is="wrapperOf(block)"
            v-bind="wrapperBindings(block, index, position)"
          >
            <ResultImages
              v-if="block.type === 'images'"
              :banner="isBanner(block)"
              :images="imagesAt(block.placement)"
              :preview="preview"
              :status-labels="statusLabels"
            />

            <div
              v-else-if="block.type === 'hero'"
              class="flex flex-col items-center text-center gap-3.25"
            >
              <div
                class="w-15 h-15 rounded-full bg-(--sjs-special-green-light) border border-[var(--sjs-special-green-light)] flex items-center justify-center"
              >
                <svg width="29" height="29" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.5l4 4L19 7"
                    stroke="var(--sjs-special-green)"
                    stroke-width="2.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <h1
                class="mt-0.5 text-[28px] font-extrabold text-[var(--sjs-general-forecolor)] tracking-[-0.01em]"
                v-if="hasText(ui.title)"
              >
                {{ ui.title }}
              </h1>
              <div
                class="text-[12.5px] font-bold text-[var(--sjs-primary-backcolor)] tracking-[0.04em]"
                v-if="hasText(ui.subtitle)"
              >
                {{ ui.subtitle }}
              </div>
              <p
                v-if="hasText(props.description)"
                class="mt-1 text-[15px] leading-[1.85] text-[var(--sjs-general-forecolor)] max-w-107.5"
              >
                {{ ui.description }}
              </p>
            </div>

            <template v-else-if="block.type === 'score'">
              <DefaultScoreCard
                v-if="scoreDisplay === 'default'"
                :value="chartValue"
                :min="min"
                :max="max"
                :status-labels="statusLabels"
              />
              <div v-else class="flex justify-center" dir="ltr">
                <LinearHealthGauge
                  v-if="scoreDisplay === 'linear'"
                  :model-value="chartValue"
                  :min="min"
                  :max="max"
                  :status-labels="statusLabels"
                />
                <RadialGauge
                  v-else-if="scoreDisplay === 'radial'"
                  :value="chartValue"
                  :min="min"
                  :max="max"
                  :status-labels="statusLabels"
                />
                <TemperatureGauge
                  v-else-if="scoreDisplay === 'temperature'"
                  :model-value="chartValue"
                  :min="min"
                  :max="max"
                  :status-labels="statusLabels"
                />
                <DonutGauge
                  v-else-if="scoreDisplay === 'donut'"
                  :value="chartValue"
                  :min="min"
                  :max="max"
                  :status-labels="statusLabels"
                />
                <BulletChart
                  v-else-if="scoreDisplay === 'bullet'"
                  :value="chartValue"
                  :min="min"
                  :max="max"
                  :status-labels="statusLabels"
                />
                <VerticalThermometer
                  v-else-if="scoreDisplay === 'thermometer'"
                  :value="chartValue"
                  :min="min"
                  :max="max"
                  :status-labels="statusLabels"
                />
                <SegmentedPills
                  v-else-if="scoreDisplay === 'pills'"
                  :value="chartValue"
                  :min="min"
                  :max="max"
                  :status-labels="statusLabels"
                />
                <Table
                  v-else-if="scoreDisplay === 'table'"
                  :rows="resolvedTableRows"
                  :status-labels="statusLabels"
                />
              </div>
            </template>

            <div
              v-else-if="block.type === 'note'"
              class="flex items-start gap-2.5 px-0.5"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                class="flex-none mt-px"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  stroke="var(--sjs-general-forecolor-light)"
                  stroke-width="1.6"
                />
                <path
                  d="M12 11v5M12 7.6v.4"
                  stroke="var(--sjs-general-forecolor-light)"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
              <p
                class="m-0 text-[13.5px] leading-[1.75] text-[var(--sjs-general-forecolor-light)]"
              >
                {{ ui.noteText }}
              </p>
            </div>

            <ResultHtmlBlock
              v-else-if="block.type === 'html'"
              :html="blockHtml[block.id]"
              :preview="preview"
            />

            <hr
              v-else-if="block.type === 'divider'"
              class="m-0 border-0 border-t border-[var(--sjs-border-light)]"
            />

            <div v-else-if="block.type === 'actions'" class="flex flex-col gap-3">
              <div
                v-for="(row, r) in buttonRows"
                :key="r"
                class="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
              >
                <template v-for="action in row" :key="action.id">
                  <a
                    v-if="hrefOf(action)"
                    :href="hrefOf(action)"
                    :target="action.newTab ? '_blank' : undefined"
                    :rel="action.newTab ? 'noopener noreferrer' : undefined"
                    :class="buttonClass(action)"
                    @click="onAction(action, $event)"
                  >
                    <ResultActionIcon :name="action.icon" />
                    <span class="min-w-0 text-balance">{{ action.label }}</span>
                    <span
                      v-if="conditionLabel(action)"
                      class="shrink-0 rounded-full bg-current/15 px-2 py-0.5 text-[11px] font-semibold"
                      data-action-condition
                      >{{ conditionLabel(action) }}</span
                    >
                  </a>
                  <button
                    v-else
                    type="button"
                    :class="buttonClass(action)"
                    @click="onAction(action, $event)"
                  >
                    <ResultActionIcon :name="action.icon" />
                    <span class="min-w-0 text-balance">{{ action.label }}</span>
                    <span
                      v-if="conditionLabel(action)"
                      class="shrink-0 rounded-full bg-current/15 px-2 py-0.5 text-[11px] font-semibold"
                      data-action-condition
                      >{{ conditionLabel(action) }}</span
                    >
                  </button>
                </template>
              </div>
              <template v-for="action in textActions" :key="action.id">
                <a
                  v-if="hrefOf(action)"
                  :href="hrefOf(action)"
                  :target="action.newTab ? '_blank' : undefined"
                  :rel="action.newTab ? 'noopener noreferrer' : undefined"
                  :class="buttonClass(action)"
                  @click="onAction(action, $event)"
                >
                  <ResultActionIcon :name="action.icon" />
                  {{ action.label }}
                  <span
                    v-if="conditionLabel(action)"
                    class="shrink-0 rounded-full bg-current/15 px-2 py-0.5 text-[11px] font-semibold"
                    data-action-condition
                    >{{ conditionLabel(action) }}</span
                  >
                </a>
                <button
                  v-else
                  type="button"
                  :class="buttonClass(action)"
                  @click="onAction(action, $event)"
                >
                  <ResultActionIcon :name="action.icon" />
                  {{ action.label }}
                  <span
                    v-if="conditionLabel(action)"
                    class="shrink-0 rounded-full bg-current/15 px-2 py-0.5 text-[11px] font-semibold"
                    data-action-condition
                    >{{ conditionLabel(action) }}</span
                  >
                </button>
              </template>
            </div>
          </component>
        </div>

        <!-- In the editor: a place to drop after the last block, or on an empty page -->
        <div
          v-if="preview && (drag.dragging.value || rendered.length === 0)"
          class="mx-9.5 grid min-h-16 place-items-center rounded-xl border-2 border-dashed border-[var(--sjs-border-default)] px-4 py-3 text-center text-[13px] text-[var(--sjs-general-forecolor-light)]"
          data-drop-end
          @dragover="drag.over($event)"
          @drop="dropAtEnd"
        >
          {{ rendered.length ? t("canvas.dropHere") : t("canvas.emptyLayout") }}
        </div>
      </div>
    </div>
  </div>
</template>
