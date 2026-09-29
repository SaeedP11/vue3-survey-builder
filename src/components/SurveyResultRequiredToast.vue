<script setup lang="ts">
import { useSurveyCreator } from "../provider/surveyCreator";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { computed } from "vue";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const creator = useSurveyCreator();
const { t } = useLocalI18n(surveyResultEditor);

const themeVars = computed<Record<string, string>>(() => {
  const vars = (creator.creatorTheme?.cssVariables ?? {}) as Record<
    string,
    string
  >;
  const pick = (key: string) => vars[key];
  return {
    ...vars,
    "--color-fb-shell": pick("--sjs2-color-bg-basic-primary"),
    "--color-fb-surface": pick("--sjs2-color-utility-surface-designer"),
    "--color-fb-surface-muted": pick("--sjs2-color-bg-basic-tertiary"),
    "--color-fb-fg": pick("--sjs2-color-fg-basic-primary"),
    "--color-fb-fg-secondary": pick("--sjs2-color-fg-basic-secondary"),
    "--color-fb-fg-muted": pick("--sjs2-color-fg-basic-tertiary"),
    "--color-fb-border": pick("--sjs2-color-border-basic-secondary"),
    "--color-fb-accent": pick("--sjs2-color-bg-brand-primary"),
    "--color-fb-accent-on": pick("--sjs2-color-fg-brand-on-primary"),
  };
});

function configure() {
  emit("close");
  const action = creator.toolbar.getActionById("ui") as
    | { action?: () => void }
    | undefined;
  action?.action?.();
}
</script>

<template>
  <Transition name="fb-toast">
    <div
      v-if="props.open"
      class="fixed bottom-5 right-5 z-9999 w-88 overflow-hidden rounded-xl bg-fb-shell shadow-2xl ring-1 ring-fb-border text-fb-fg font-['Plus_Jakarta_Sans',system-ui,sans-serif] antialiased"
      :style="themeVars"
    >
      <div class="flex items-start gap-3 px-4 pt-4 pb-3.5">
        <span
          class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base font-bold text-fb-accent-on bg-fb-accent"
          >!</span
        >
        <div class="min-w-0 flex-1">
          <p class="text-[13px] font-bold tracking-tight text-fb-fg">
            {{ t("resultTemplateRequired.title") }}
          </p>
          <p class="mt-1 text-[12px] leading-relaxed text-fb-fg-secondary">
            {{ t("resultTemplateRequired.message") }}
          </p>
        </div>
        <button
          class="h-6 w-6 shrink-0 cursor-pointer rounded-md border-0 bg-transparent text-sm leading-none text-fb-fg-muted hover:bg-fb-surface-muted"
          :aria-label="t('resultTemplateRequired.dismiss')"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="flex justify-end gap-2 border-t border-fb-border bg-fb-surface px-4 py-3">
        <button
          class="cursor-pointer rounded-lg border-0 bg-fb-accent px-3.5 py-2 text-[12px] font-semibold text-fb-accent-on transition-[filter] hover:brightness-90"
          @click="configure"
        >
          {{ t("resultTemplateRequired.configure") }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fb-toast-enter-active,
.fb-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fb-toast-enter-from,
.fb-toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>