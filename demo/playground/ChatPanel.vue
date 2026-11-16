<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  SurveyChatInline,
  SurveyChatWidget,
  SurveyChatModal,
  type ChatBotPersona,
} from "../../src/index.ts";
import { CHAT_SAMPLES, type ChatSample } from "./chatSamples.ts";
import { logEvent } from "./eventLog.ts";

const props = defineProps<{
  json: object;
}>();

const emit = defineEmits<{
  restart: [];
  "load-sample": [json: object];
}>();

type ViewMode = "inline-wide" | "inline-compact" | "widget" | "modal";
const mode = ref<ViewMode>("inline-wide");
const isModalOpen = ref(false);

// Active template selection
const selectedSampleId = ref<string>("customer-support");

const activeSample = computed<ChatSample | undefined>(() => {
  return CHAT_SAMPLES.find((s) => s.id === selectedSampleId.value);
});

// If props.json is provided and not empty, use it; otherwise fallback to active sample JSON
const effectiveJson = computed(() => {
  if (props.json && Object.keys(props.json).length > 0) {
    return props.json;
  }
  return activeSample.value?.json ?? {};
});

// Persona configuration: follows the selected sample or falls back
const currentPersona = computed<ChatBotPersona>(() => {
  if (activeSample.value) {
    return activeSample.value.persona;
  }
  return {
    name: "Survey Concierge",
    greeting: "Hello! 👋 Welcome to our conversational survey.",
  };
});

// Explicit direction control (auto-switches to RTL for Persian form, but user can override)
const direction = ref<"ltr" | "rtl">("ltr");

watch(
  () => props.json,
  (newJson: any) => {
    if (!newJson) return;
    const match = CHAT_SAMPLES.find((s) => s.json.title === newJson.title);
    if (match) {
      selectedSampleId.value = match.id;
      direction.value = match.id === "persian-support" ? "rtl" : "ltr";
    }
  },
  { immediate: true, deep: true },
);

function onSampleSelectChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  if (!target.value) return;
  selectedSampleId.value = target.value;
  const s = CHAT_SAMPLES.find((item) => item.id === target.value);
  if (s) {
    direction.value = s.id === "persian-support" ? "rtl" : "ltr";
    emit("load-sample", structuredClone(s.json));
  }
}

function onAnswer(name: string, val: unknown) {
  logEvent("logic", `Answered question "${name}"`, val);
}

function onComplete(data: Record<string, unknown>) {
  logEvent("complete", "Survey completed in Chat Mode", data);
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
    <!-- Top Controls Header -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 shrink-0"
      dir="ltr"
    >
      <!-- Example Form Selector -->
      <div class="flex items-center gap-2 flex-wrap">
        <label for="chat-sample-select" class="font-semibold text-slate-800 dark:text-slate-200 shrink-0">
          Chat Form Example:
        </label>
        <select
          id="chat-sample-select"
          :value="selectedSampleId"
          class="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
          @change="onSampleSelectChange"
        >
          <optgroup label="Support & Service">
            <option value="customer-support">Customer Support & Incident Triage</option>
            <option value="persian-support">پشتیبانی و خدمات پس از فروش (فارسی / RTL)</option>
          </optgroup>
          <optgroup label="Feedback & Product">
            <option value="nps-feedback">Product Feedback & Net Promoter Score (NPS)</option>
            <option value="usability-matrix">Software Usability Matrix & Feature Roadmap</option>
          </optgroup>
          <optgroup label="HR & Sales">
            <option value="employee-onboarding">Employee Onboarding & Equipment Setup</option>
            <option value="sales-qualification">Enterprise Lead Qualification & Solution Match</option>
          </optgroup>
          <optgroup label="Healthcare & Events">
            <option value="telehealth-intake">Telehealth Patient Intake & Clinical Triage</option>
            <option value="tech-summit-rsvp">Tech Summit & Hackathon Registration</option>
          </optgroup>
          <optgroup label="Widgets & Micro Surveys">
            <option value="wellbeing-scorecard">Daily Wellbeing Tracker (Live Chart & Scorecard)</option>
            <option value="micro-pulse-poll">Quick 60-Second Pulse Check</option>
          </optgroup>
        </select>

        <!-- RTL / LTR Toggle -->
        <div class="flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 ml-1">
          <button
            type="button"
            class="px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer"
            :class="direction === 'ltr' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-500'"
            @click="direction = 'ltr'"
          >
            LTR
          </button>
          <button
            type="button"
            class="px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer"
            :class="direction === 'rtl' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-500'"
            @click="direction = 'rtl'"
          >
            RTL
          </button>
        </div>
      </div>

      <!-- Container Size & Mode Selector -->
      <div class="flex items-center gap-2">
        <span class="font-medium text-slate-700 dark:text-slate-300">Container Mode:</span>
        <div class="flex rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
          <button
            type="button"
            class="px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
            :class="mode === 'inline-wide' ? 'bg-white dark:bg-slate-700 font-semibold text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-700'"
            @click="mode = 'inline-wide'"
          >
            Wide (680px)
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
            :class="mode === 'inline-compact' ? 'bg-white dark:bg-slate-700 font-semibold text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-700'"
            @click="mode = 'inline-compact'"
          >
            Compact (380px)
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
            :class="mode === 'widget' ? 'bg-white dark:bg-slate-700 font-semibold text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-700'"
            @click="mode = 'widget'"
          >
            Floating Widget
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
            :class="mode === 'modal' ? 'bg-white dark:bg-slate-700 font-semibold text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-700'"
            @click="mode = 'modal'"
          >
            Modal Dialog
          </button>
        </div>

        <button
          type="button"
          class="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-2xs"
          @click="emit('restart')"
        >
          Restart Chat
        </button>
      </div>
    </div>

    <!-- Active Form Metadata Banner -->
    <div
      v-if="activeSample"
      class="border-b border-slate-200/80 bg-slate-50/70 px-4 py-2 text-xs text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 shrink-0"
      dir="ltr"
    >
      <div class="flex items-center gap-2 flex-wrap">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          {{ activeSample.category }}
        </span>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
          {{ activeSample.badge }}
        </span>
        <span class="text-slate-500 dark:text-slate-400 hidden sm:inline">
          {{ activeSample.description }}
        </span>
      </div>

      <!-- Input Types Pill List -->
      <div class="flex items-center gap-1 flex-wrap">
        <span class="text-[10px] text-slate-400 font-mono">Types:</span>
        <span
          v-for="t in activeSample.typesUsed"
          :key="t"
          class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
        >
          {{ t }}
        </span>
      </div>
    </div>

    <!-- Playground Container Area -->
    <div class="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center">
      <!-- 1. Wide Desktop Inline Mode (680px) -->
      <div
        v-if="mode === 'inline-wide'"
        class="w-full max-w-2xl h-[640px] shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all"
      >
        <SurveyChatInline
          :json="effectiveJson"
          :persona="currentPersona"
          :direction="direction"
          @answer="onAnswer"
          @complete="onComplete"
          @restart="emit('restart')"
        />
      </div>

      <!-- 2. Compact Mobile / Sidebar Mode (380px) -->
      <div
        v-else-if="mode === 'inline-compact'"
        class="w-[380px] h-[600px] shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all flex flex-col"
      >
        <!-- Mobile status bar simulation -->
        <div class="bg-slate-100 dark:bg-slate-800/80 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-400 font-mono border-b border-slate-200/50 dark:border-slate-700/50 select-none">
          <span>9:41 AM</span>
          <div class="flex items-center gap-1.5">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        <div class="flex-1 overflow-hidden">
          <SurveyChatInline
            :json="effectiveJson"
            :persona="currentPersona"
            :direction="direction"
            @answer="onAnswer"
            @complete="onComplete"
            @restart="emit('restart')"
          />
        </div>
      </div>

      <!-- 3. Floating Widget Mode -->
      <div v-else-if="mode === 'widget'" class="text-center p-8 max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
          💬
        </div>
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
          Floating Widget Active
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          The floating chat launcher button is rendered at the bottom-right corner of your viewport. Click the bubble to minimize or open.
        </p>
        <span class="inline-block text-[11px] px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
          Position: bottom-right &bull; Auto-opened
        </span>

        <SurveyChatWidget
          :json="effectiveJson"
          :default-open="true"
          position="bottom-right"
          :persona="currentPersona"
          :direction="direction"
          @answer="onAnswer"
          @complete="onComplete"
        />
      </div>

      <!-- 4. Modal Lightbox Dialog Mode -->
      <div v-else-if="mode === 'modal'" class="text-center p-8 max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl">
          🗔
        </div>
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
          Modal Dialog Mode
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Render the conversational survey as a full-screen or centered backdrop modal with keyboard Escape support.
        </p>

        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          @click="isModalOpen = true"
        >
          Open Conversational Modal
        </button>

        <SurveyChatModal
          :open="isModalOpen"
          :json="effectiveJson"
          :persona="currentPersona"
          :direction="direction"
          @close="isModalOpen = false"
          @answer="onAnswer"
          @complete="onComplete"
        />
      </div>
    </div>
  </div>
</template>
