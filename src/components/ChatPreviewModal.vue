<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { SvgRegistry } from "survey-core";
import { useSurveyCreator } from "../provider/surveyCreator.ts";
import useCreatorToolbarAction from "../composables/useCreatorToolbarAction.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { chatSurvey } from "../locales/index.ts";
import ChatSurvey from "./ChatSurvey.vue";
import { RotateCcw, Smartphone, Monitor, X } from "lucide-vue-next";

const CHAT_PREVIEW_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
  '<circle cx="8" cy="10" r="1" fill="currentColor"/>' +
  '<circle cx="12" cy="10" r="1" fill="currentColor"/>' +
  '<circle cx="16" cy="10" r="1" fill="currentColor"/>' +
  '</svg>';

SvgRegistry.registerIcon("icon-fb-chat-preview", CHAT_PREVIEW_ICON);

const creator = useSurveyCreator();
const { t } = useLocalI18n(chatSurvey);

const isOpen = ref(false);
const viewMode = ref<"mobile" | "desktop">("mobile");
const chatKey = ref(0);

useCreatorToolbarAction(
  creator,
  {
    id: "chat-preview",
    iconName: "icon-fb-chat-preview",
    action: () => {
      isOpen.value = true;
      chatKey.value++;
    },
  },
  () => t("chatPreview"),
);

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && isOpen.value) {
    isOpen.value = false;
  }
}

watch(isOpen, (open) => {
  if (open) {
    window.addEventListener("keydown", onKeyDown);
  } else {
    window.removeEventListener("keydown", onKeyDown);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});

const surveyJson = computed(() => creator.JSON ?? {});
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-9998 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6"
      @click.self="isOpen = false"
    >
      <!-- Modal container -->
      <div
        class="relative flex flex-col w-full h-full max-h-[92vh] max-w-4xl rounded-2xl bg-fb-surface border border-fb-border shadow-2xl overflow-hidden"
      >
        <!-- Modal Toolbar Header -->
        <header
          class="flex items-center justify-between border-b border-fb-border px-4 py-3 bg-fb-surface-muted shrink-0"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-fb-accent text-fb-accent-on shadow-xs"
            >
              <svg
                class="h-4.5 w-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <circle cx="8" cy="10" r="1" fill="currentColor" />
                <circle cx="12" cy="10" r="1" fill="currentColor" />
                <circle cx="16" cy="10" r="1" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h2 class="text-sm font-bold text-fb-fg leading-none">
                {{ t("chatPreview") }}
              </h2>
              <p class="text-xs text-fb-fg-muted mt-1">
                {{ t("chatPreviewSubtitle") }}
              </p>
            </div>
          </div>

          <!-- Controls: View mode & Actions -->
          <div class="flex items-center gap-2">
            <!-- View Mode Switcher -->
            <div
              class="flex items-center rounded-lg border border-fb-border bg-fb-surface p-0.5 text-xs"
            >
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer"
                :class="
                  viewMode === 'mobile'
                    ? 'bg-fb-accent text-fb-accent-on shadow-xs'
                    : 'text-fb-fg-muted hover:text-fb-fg'
                "
                @click="viewMode = 'mobile'"
              >
                <Smartphone class="h-3.5 w-3.5" />
                <span class="hidden sm:inline">Mobile</span>
              </button>
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer"
                :class="
                  viewMode === 'desktop'
                    ? 'bg-fb-accent text-fb-accent-on shadow-xs'
                    : 'text-fb-fg-muted hover:text-fb-fg'
                "
                @click="viewMode = 'desktop'"
              >
                <Monitor class="h-3.5 w-3.5" />
                <span class="hidden sm:inline">Full</span>
              </button>
            </div>

            <!-- Restart -->
            <button
              type="button"
              class="flex items-center gap-1 rounded-lg border border-fb-border bg-fb-surface px-2.5 py-1.5 text-xs font-medium text-fb-fg hover:bg-fb-surface-muted transition-colors cursor-pointer"
              :title="t('restart')"
              @click="chatKey++"
            >
              <RotateCcw class="h-3.5 w-3.5" />
              <span class="hidden sm:inline">{{ t("restart") }}</span>
            </button>

            <!-- Close button -->
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-fb-border bg-fb-surface text-fb-fg hover:bg-fb-surface-muted transition-colors cursor-pointer"
              :title="t('close')"
              @click="isOpen = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </header>

        <!-- Modal Body Content -->
        <div
          class="flex-1 min-h-0 bg-slate-100 dark:bg-slate-950 p-4 flex items-center justify-center overflow-auto"
        >
          <!-- Mobile Smartphone Mockup Frame -->
          <div
            v-if="viewMode === 'mobile'"
            class="w-full max-w-[390px] h-[640px] max-h-[100%] rounded-[2.5rem] border-[6px] border-slate-800 dark:border-slate-700 shadow-2xl bg-fb-surface flex flex-col relative overflow-hidden"
          >
            <!-- Phone Dynamic Island / Speaker -->
            <div
              class="absolute top-2 left-1/2 -translate-x-1/2 z-20 h-4 w-24 rounded-full bg-slate-800 dark:bg-slate-700 flex items-center justify-end px-2"
            >
              <div class="h-2 w-2 rounded-full bg-slate-900 border border-slate-700"></div>
            </div>

            <!-- Status bar space -->
            <div class="h-7 w-full shrink-0 bg-fb-surface"></div>

            <!-- Chat inside mobile frame -->
            <div class="flex-1 min-h-0">
              <ChatSurvey
                :key="`modal-chat-${chatKey}`"
                :json="surveyJson"
                :typing-delay="150"
                @restart="chatKey++"
              />
            </div>

            <!-- Bottom Home Indicator -->
            <div class="h-4 w-full shrink-0 bg-fb-surface flex items-center justify-center">
              <div class="h-1 w-28 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            </div>
          </div>

          <!-- Desktop / Full width frame -->
          <div
            v-else
            class="w-full h-full max-w-2xl rounded-xl border border-fb-border shadow-md bg-fb-surface overflow-hidden flex flex-col"
          >
            <ChatSurvey
              :key="`modal-full-${chatKey}`"
              :json="surveyJson"
              :typing-delay="150"
              @restart="chatKey++"
            />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
