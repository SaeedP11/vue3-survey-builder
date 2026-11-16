<script setup lang="ts">
import { ref } from "vue";
import { SurveyChatInline, SurveyChatWidget } from "../../src/index.ts";
import { logEvent } from "./eventLog.ts";

const props = defineProps<{ json: object }>();
const emit = defineEmits<{ restart: [] }>();

type ViewMode = "inline-wide" | "inline-compact" | "widget";
const mode = ref<ViewMode>("inline-wide");

function onAnswer(name: string, val: unknown) {
  logEvent("logic", `Answered question "${name}"`, val);
}

function onComplete(data: Record<string, unknown>) {
  logEvent("complete", "Survey completed in Chat Mode", data);
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
    <!-- Controls Header -->
    <div
      class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 shrink-0"
      dir="ltr"
    >
      <div class="flex items-center gap-2">
        <span class="font-medium text-slate-800 dark:text-slate-200">Chat Container Size:</span>
        <div class="flex rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
          <button
            type="button"
            class="px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
            :class="mode === 'inline-wide' ? 'bg-white dark:bg-slate-700 font-semibold shadow-xs' : 'text-slate-500'"
            @click="mode = 'inline-wide'"
          >
            Wide (680px)
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
            :class="mode === 'inline-compact' ? 'bg-white dark:bg-slate-700 font-semibold shadow-xs' : 'text-slate-500'"
            @click="mode = 'inline-compact'"
          >
            Compact (380px)
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
            :class="mode === 'widget' ? 'bg-white dark:bg-slate-700 font-semibold shadow-xs' : 'text-slate-500'"
            @click="mode = 'widget'"
          >
            Floating Widget
          </button>
        </div>
      </div>

      <button
        type="button"
        class="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
        @click="emit('restart')"
      >
        Restart Chat
      </button>
    </div>

    <!-- Playground Container Area -->
    <div class="flex-1 overflow-auto p-6 flex items-center justify-center">
      <!-- Wide Mode -->
      <div
        v-if="mode === 'inline-wide'"
        class="w-full max-w-2xl h-[620px] shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
      >
        <SurveyChatInline
          :json="json"
          :persona="{ name: 'Support Concierge', greeting: 'Hello! 👋 How can we help you today?' }"
          @answer="onAnswer"
          @complete="onComplete"
          @restart="emit('restart')"
        />
      </div>

      <!-- Compact Mode (e.g. mobile or sidebar embed) -->
      <div
        v-else-if="mode === 'inline-compact'"
        class="w-[380px] h-[580px] shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
      >
        <SurveyChatInline
          :json="json"
          :persona="{ name: 'Feedback Bot', greeting: 'We would love your quick feedback!' }"
          @answer="onAnswer"
          @complete="onComplete"
          @restart="emit('restart')"
        />
      </div>

      <!-- Floating Widget Mode -->
      <div v-else class="text-center p-8 text-slate-500">
        <p class="text-sm mb-2">The floating widget launcher is located at the bottom right corner of this screen.</p>
        <p class="text-xs text-slate-400">Click the blue circular chat button to open/close the conversational survey.</p>

        <SurveyChatWidget
          :json="json"
          :default-open="true"
          position="bottom-right"
          :persona="{ name: 'Support Bot', greeting: 'Hi there! Need help?' }"
          @answer="onAnswer"
          @complete="onComplete"
        />
      </div>
    </div>
  </div>
</template>
