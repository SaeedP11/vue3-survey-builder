<script setup lang="ts">
import useCreatorToolbarAction from "../composables/useCreatorToolbarAction";
import { useSurveyResultTemplate } from "../provider/surveyResultTemplate";
import { surveyResultEditor } from "../locales/index.ts";
import { useSurveyCreator } from "../provider/surveyCreator";
import type { ResultBlock, SurveyResultProps } from "../types/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import SurveyResultEditor from "./SurveyResultEditor.vue";
import { editableProps, getDefaultProps } from "../schemas/templates";
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";

const emit = defineEmits<{
  apply: [props: SurveyResultProps];
  close: [];
}>();

const creator = useSurveyCreator();
const activeTemplate = useSurveyResultTemplate();
const { t, locale } = useLocalI18n(surveyResultEditor);
const isOpen = ref(false);
const dialog = ref<HTMLElement | null>(null);
const titleId = useId();
const descriptionId = useId();

const themeVars = computed<Record<string, string>>(() => {
  const vars = (creator.creatorTheme?.cssVariables ?? {}) as Record<
    string,
    string
  >;
  const pick = (key: string) => vars[key];
  return {
    ...vars,
    "--color-fb-overlay": pick("--sjs2-color-utility-overlay"),
    "--color-fb-shell": pick("--sjs2-color-bg-basic-primary"),
    "--color-fb-surface": pick("--sjs2-color-utility-surface-designer"),
    "--color-fb-surface-muted": pick("--sjs2-color-bg-basic-tertiary"),
    "--color-fb-fg": pick("--sjs2-color-fg-basic-primary"),
    "--color-fb-fg-secondary": pick("--sjs2-color-fg-basic-secondary"),
    "--color-fb-fg-muted": pick("--sjs2-color-fg-basic-tertiary"),
    "--color-fb-border": pick("--sjs2-color-border-basic-secondary"),
    "--color-fb-border-strong": pick("--sjs2-color-border-basic-primary"),
    "--color-fb-accent": pick("--sjs2-color-bg-brand-primary"),
    "--color-fb-accent-soft": pick("--sjs2-color-bg-brand-secondary"),
    "--color-fb-accent-on": pick("--sjs2-color-fg-brand-on-primary"),
  };
});

const editedProps = ref<SurveyResultProps>(getDefaultProps(locale.value));
// The block picked on the preview or in the Layout panel, shown in both
const selectedBlock = ref<string | null>(null);
// The template as it was loaded, to tell whether there is anything to lose
const loaded = ref("");
const dirty = computed(
  () => isOpen.value && JSON.stringify(editedProps.value) !== loaded.value,
);

function setLayout(layout: ResultBlock[]) {
  editedProps.value = { ...editedProps.value, layout };
}

function loadStored() {
  const stored = creator.JSON?.resultTemplate as SurveyResultProps | undefined;
  editedProps.value = editableProps(stored, locale.value);
  selectedBlock.value = null;
  loaded.value = JSON.stringify(editedProps.value);
}

function close() {
  isOpen.value = false;
  emit("close");
}

function save() {
  const config = JSON.parse(
    JSON.stringify(editedProps.value),
  ) as SurveyResultProps;
  try {
    creator.survey.setPropertyValue("resultTemplate", config);
  } catch (e) {
    console.error(
      "[SurveyResultEditorModal] failed to persist resultTemplate",
      e,
    );
  }
  emit("apply", config);
  close();
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable=true]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

// Tab and Shift+Tab cycle inside the dialog instead of reaching the page behind
function trapFocus(event: KeyboardEvent) {
  const root = dialog.value;
  if (!root) return;
  const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.checkVisibility?.() ?? true,
  );
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (!first || !last) {
    event.preventDefault();
    root.focus();
  } else if (!root.contains(active)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && (active === first || active === root)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

// On the document, so the keys work wherever focus is; a control inside that
// handles a key itself (preventDefault) keeps it
function onKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing) return;
  if (event.key === "Escape") {
    event.preventDefault();
    close();
  } else if (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    event.key.toLowerCase() === "s"
  ) {
    event.preventDefault();
    save();
  } else if (event.key === "Tab") {
    trapFocus(event);
  }
}

let returnFocus: HTMLElement | null = null;
let rootOverflow: string | null = null;

function lockPage() {
  const root = document.documentElement;
  rootOverflow = root.style.overflow;
  root.style.overflow = "hidden";
  document.addEventListener("keydown", onKeydown);
}

function unlockPage() {
  document.removeEventListener("keydown", onKeydown);
  if (rootOverflow === null) return;
  document.documentElement.style.overflow = rootOverflow;
  rootOverflow = null;
}

watch(isOpen, async (open) => {
  if (open) {
    loadStored();
    const active = document.activeElement;
    returnFocus = active instanceof HTMLElement ? active : null;
    lockPage();
    await nextTick();
    dialog.value?.focus();
  } else {
    unlockPage();
    returnFocus?.focus();
    returnFocus = null;
  }
});

onBeforeUnmount(unlockPage);

useCreatorToolbarAction(
  creator,
  {
    id: "ui",
    iconName: "icon-desktop-24x24",
    action: () => {
      isOpen.value = !isOpen.value;
    },
  },
  () => t("title"),
);
</script>

<template>
  <Transition name="fb-dialog" :duration="{ enter: 200, leave: 150 }">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-9998 flex items-stretch justify-center box-border bg-fb-overlay backdrop-blur-sm text-fb-fg font-fb antialiased sm:items-center sm:p-6 lg:p-8"
      :style="themeVars"
    >
      <div
        ref="dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        tabindex="-1"
        class="fb-dialog-panel flex h-full w-full max-w-295 flex-col overflow-hidden bg-fb-shell shadow-2xl outline-none sm:rounded-2xl sm:ring-1 sm:ring-fb-border"
      >
        <header
          class="flex shrink-0 items-center gap-3 border-b border-fb-border bg-fb-surface px-4 py-3 sm:px-6"
        >
          <span
            class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-fb-accent-soft text-fb-accent"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2
                :id="titleId"
                class="m-0 truncate text-[15px] font-bold leading-tight tracking-tight text-fb-fg"
              >
                {{ t("title") }}
              </h2>
              <span
                v-if="dirty"
                class="inline-flex items-center gap-1.5 rounded-full bg-fb-surface-muted px-2 py-0.5 text-[11px] font-semibold text-fb-fg-secondary"
                data-testid="unsaved"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full bg-fb-accent"
                  aria-hidden="true"
                />
                {{ t("unsaved") }}
              </span>
            </div>
            <p
              :id="descriptionId"
              class="m-0 mt-0.5 truncate text-[12px] leading-snug text-fb-fg-secondary"
            >
              {{ t("description") }}
            </p>
          </div>
          <button
            type="button"
            class="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-fb-fg-secondary transition-colors hover:bg-fb-surface-muted hover:text-fb-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fb-accent"
            :aria-label="t('close')"
            :title="t('close')"
            @click="close"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div
          class="grid min-h-0 flex-1 grid-rows-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-1"
        >
          <div
            class="min-h-0 overflow-auto overscroll-contain border-b border-fb-border bg-fb-surface-muted lg:border-b-0 lg:border-e"
          >
            <component
              :is="activeTemplate.component"
              v-bind="editedProps"
              v-model:selected-block="selectedBlock"
              preview
              @update:layout="setLayout"
            />
          </div>

          <div class="flex min-h-0 flex-col bg-fb-surface">
            <!-- The built-in editor pads its own tabs, so their bar sticks to the top -->
            <div class="min-h-0 flex-1 overflow-auto overscroll-contain">
              <div v-if="activeTemplate.editor" class="px-4 py-5 sm:px-6">
                <component
                  :is="activeTemplate.editor"
                  v-model:props="editedProps"
                  v-model:selected-block="selectedBlock"
                />
              </div>
              <SurveyResultEditor
                v-else
                v-model:props="editedProps"
                v-model:selected-block="selectedBlock"
              />
            </div>

            <div
              class="flex shrink-0 gap-2.5 border-t border-fb-border bg-fb-surface px-4 py-3 sm:px-6 sm:py-4"
            >
              <button
                type="button"
                class="shrink-0 cursor-pointer rounded-lg border border-fb-border bg-fb-surface px-4 py-2.5 text-sm font-semibold text-fb-fg transition-colors hover:bg-fb-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fb-accent"
                @click="close"
              >
                {{ t("cancel") }}
              </button>
              <button
                type="button"
                class="flex-1 cursor-pointer rounded-lg border-0 bg-fb-accent px-4 py-2.5 text-sm font-semibold text-fb-accent-on transition-[filter] hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fb-accent"
                aria-keyshortcuts="Control+S Meta+S"
                @click="save"
              >
                {{ t("save") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fb-dialog-enter-active,
.fb-dialog-leave-active {
  transition: opacity 0.15s ease;
}
.fb-dialog-enter-active .fb-dialog-panel {
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fb-dialog-leave-active .fb-dialog-panel {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease-in;
}
.fb-dialog-enter-from,
.fb-dialog-leave-to {
  opacity: 0;
}
.fb-dialog-enter-from .fb-dialog-panel,
.fb-dialog-leave-to .fb-dialog-panel {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}
@media (prefers-reduced-motion: reduce) {
  .fb-dialog-enter-active,
  .fb-dialog-leave-active,
  .fb-dialog-enter-active .fb-dialog-panel,
  .fb-dialog-leave-active .fb-dialog-panel {
    transition: none;
  }
}
</style>
