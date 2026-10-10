<script setup lang="ts">
import useCreatorToolbarAction from "../composables/useCreatorToolbarAction";
import { useSurveyResultTemplate } from "../provider/surveyResultTemplate";
import { surveyResultEditor } from "../locales/index.ts";
import { useSurveyCreator } from "../provider/surveyCreator";
import type { SurveyResultProps } from "../types/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import SurveyResultEditor from "./SurveyResultEditor.vue";
import { getDefaultProps } from "../schemas/templates";
import { computed, ref, watch } from "vue";

const emit = defineEmits<{
  apply: [props: SurveyResultProps];
  close: [];
}>();

const creator = useSurveyCreator();
const activeTemplate = useSurveyResultTemplate();
const { t, locale } = useLocalI18n(surveyResultEditor);
const isOpen = ref(false);

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

function loadStored() {
  const stored = creator.JSON?.resultTemplate as SurveyResultProps | undefined;
  editedProps.value = { ...getDefaultProps(locale.value), ...(stored ?? {}) };
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

watch(isOpen, (open) => {
  if (open) loadStored();
});

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
  <div
    class="fixed inset-0 z-9998 flex items-center justify-center p-8 box-border bg-fb-overlay backdrop-blur-sm text-fb-fg font-['Plus_Jakarta_Sans',system-ui,sans-serif] antialiased"
    :style="themeVars"
    style="animation: fb-fade 0.15s ease"
    v-if="isOpen"
  >
    <div
      class="flex h-full w-full max-w-295 flex-col overflow-hidden rounded-2xl bg-fb-shell shadow-2xl"
      style="animation: fb-pop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)"
      @click.stop
    >
      <header
        class="sticky top-0 z-10 flex h-15 items-center gap-4.5 border-b border-fb-border bg-fb-surface/80 px-6 backdrop-blur"
      >
        <div
          class="flex items-center gap-2.5 text-[15px] font-bold tracking-tight"
        >
          <span
            class="grid h-6.5 w-6.5 place-items-center rounded-md text-[13px] text-fb-accent-on bg-fb-accent"
            >◳</span
          >
          FormKit
        </div>
        <div class="flex items-center gap-2.5 text-[13px] text-fb-fg-secondary">
          <span class="font-semibold text-fb-fg">{{
            t("title")
          }}</span>
        </div>
        <div class="flex-1" />
        <button
          type="button"
          class="h-7.5 w-7.5 cursor-pointer rounded-lg border-0 bg-fb-surface-muted text-base leading-none text-fb-fg-muted hover:bg-fb-border"
          :aria-label="t('close')"
          @click="close"
        >
          ✕
        </button>
      </header>

      <div
        class="grid flex-1 overflow-hidden"
        style="grid-template-columns: 1fr 420px"
      >
        <div
          class="overflow-auto bg-fb-surface-muted border-e border-fb-border"
        >
          <component :is="activeTemplate.component" v-bind="editedProps" />
        </div>

        <div class="relative flex flex-col bg-fb-surface min-h-0">
          <div class="flex-1 overflow-auto px-6 py-5">
            <component
              :is="activeTemplate.editor ?? SurveyResultEditor"
              v-model:props="editedProps"
            />
          </div>

          <div
            class="sticky bottom-0 z-10 flex gap-2.5 border-t border-fb-border bg-fb-surface px-6 py-4"
          >
            <button
              type="button"
              class="shrink-0 cursor-pointer rounded-lg border border-fb-border bg-fb-surface px-4 py-2.5 text-sm font-semibold text-fb-fg hover:bg-fb-surface-muted"
              @click="close"
            >
              {{ t("cancel") }}
            </button>
            <button
              type="button"
              class="flex-1 cursor-pointer rounded-lg border-0 px-4 py-2.5 text-sm font-semibold text-fb-accent-on bg-fb-accent transition-[filter] hover:brightness-90"
              @click="save"
            >
              {{ t("save") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fb-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes fb-pop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
