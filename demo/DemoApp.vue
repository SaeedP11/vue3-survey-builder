<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { FormBuilder, provideAiAssistantConfig } from "../src/index.ts";
import registerPlaygroundTypes from "./playground/registerPlaygroundTypes.ts";
import { aiMockConfig, aiShouldFail } from "./playground/aiMock.ts";
import { events, logEvent } from "./playground/eventLog.ts";
import { SAMPLES } from "./playground/samples.ts";
import FillPanel from "./playground/FillPanel.vue";
import ChatPanel from "./playground/ChatPanel.vue";
import JsonPanel from "./playground/JsonPanel.vue";
import EventLog from "./playground/EventLog.vue";

// Before FormBuilder mounts: the samples use these types, and the question
// types need this component's app to register their Vue components on.
registerPlaygroundTypes();
provideAiAssistantConfig(aiMockConfig);

type Tab = "designer" | "fill" | "chat" | "json";
const TABS: { id: Tab; label: string; badge?: string }[] = [
  { id: "designer", label: "Designer" },
  { id: "fill", label: "Fill" },
  { id: "chat", label: "Chat Mode", badge: "NEW" },
  { id: "json", label: "JSON" },
];

// The playground's state survives a reload; storage may be unavailable
// (private windows), in which case it just starts fresh.
const STORAGE_KEY = "form-builder-playground";
type Saved = { json?: object; tab?: Tab; dark?: boolean; locale?: string };

function readSaved(): Saved {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Saved;
  } catch {
    return {};
  }
}

const saved = readSaved();
const json = ref<object>(saved.json ?? {});
const tab = ref<Tab>(saved.tab ?? "designer");
const dark = ref(saved.dark ?? false);
const showEvents = ref(true);
const fillKey = ref(0);
const { locale } = useI18n();
if (saved.locale) locale.value = saved.locale;

watch(
  [json, tab, dark, locale],
  () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          json: json.value,
          tab: tab.value,
          dark: dark.value,
          locale: locale.value,
        }),
      );
    } catch {
      // storage full or blocked: nothing to do
    }
  },
  { deep: true },
);

// The library follows the `dark` class on <html>, and its SurveyJS locale
// follows vue-i18n's.
watch(dark, (on) => document.documentElement.classList.toggle("dark", on), {
  immediate: true,
});
watch(
  locale,
  (l) => {
    document.documentElement.lang = l;
    document.documentElement.dir = l === "fa" ? "rtl" : "ltr";
  },
  { immediate: true },
);

function onSave(next: object | undefined) {
  if (!next) return;
  json.value = next;
  logEvent("save", "autosave (v-model:json updated)", next, { coalesce: true });
}

function loadSample(id: string) {
  const sample = SAMPLES.find((s) => s.id === id);
  if (!sample) return;
  json.value = structuredClone(sample.json);
  fillKey.value++;
  logEvent("sample", `loaded "${sample.name}"`);
}

function applyJson(next: object) {
  json.value = next;
  fillKey.value++;
  tab.value = "designer";
  logEvent("sample", "applied JSON from the JSON tab");
}

function switchToChat() {
  fillKey.value++;
  tab.value = "chat";
  logEvent("sample", "switched to chat mode to test current form");
}

function onChatLoadSample(next: object) {
  json.value = next;
  fillKey.value++;
  logEvent("sample", "loaded chat example form from Chat Mode");
}

const sampleChoice = ref("");
watch(sampleChoice, (id) => {
  if (!id) return;
  loadSample(id);
  sampleChoice.value = "";
});
</script>

<template>
  <div
    class="flex h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100"
  >
    <header
      class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800"
      dir="ltr"
    >
      <h1 class="text-sm font-bold tracking-tight">
        Form builder <span class="font-normal text-slate-500">playground</span>
      </h1>

      <nav class="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900">
        <button
          v-for="t in TABS"
          :key="t.id"
          type="button"
          class="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors"
          :class="
            tab === t.id
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          "
          @click="tab = t.id"
        >
          <span>{{ t.label }}</span>
          <span
            v-if="t.badge"
            class="rounded-full bg-indigo-500 px-1.5 py-0.2 text-[9px] font-bold text-white tracking-wide uppercase"
          >
            {{ t.badge }}
          </span>
        </button>
      </nav>

      <select
        v-model="sampleChoice"
        class="rounded-md border border-slate-300 bg-transparent px-2 py-1 text-xs dark:border-slate-700"
        aria-label="Load a sample survey"
      >
        <option value="">Load sample…</option>
        <option v-for="s in SAMPLES" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>

      <div class="ms-auto flex flex-wrap items-center gap-3 text-xs">
        <label class="flex items-center gap-1.5">
          <input v-model="aiShouldFail" type="checkbox" />
          AI mock fails
        </label>
        <div class="flex rounded-md border border-slate-300 dark:border-slate-700">
          <button
            v-for="l in ['en', 'fa']"
            :key="l"
            type="button"
            class="px-2 py-1 uppercase"
            :class="locale === l ? 'bg-slate-200 dark:bg-slate-700' : ''"
            @click="locale = l"
          >
            {{ l }}
          </button>
        </div>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
          @click="dark = !dark"
        >
          {{ dark ? "Light" : "Dark" }}
        </button>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
          @click="showEvents = !showEvents"
        >
          Events ({{ events.length }})
        </button>
      </div>
    </header>

    <div class="flex min-h-0 flex-1">
      <main class="min-h-0 min-w-0 flex-1">
        <!-- v-show keeps the creator (and its undo history) across tabs -->
        <div v-show="tab === 'designer'" class="relative h-full">
          <!-- Floating shortcut to test the form in Chat Mode -->
          <div class="absolute bottom-4 sm:bottom-5 end-4 sm:end-5 z-20">
            <button
              type="button"
              class="flex items-center gap-1.5 sm:gap-2 rounded-full bg-indigo-600 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white shadow-xl hover:bg-indigo-500 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-indigo-500/20"
              title="Test this form in Conversational Chat Mode"
              @click="switchToChat"
            >
              <span class="text-sm sm:text-base leading-none">💬</span>
              <span><span class="hidden sm:inline">Test in </span>Chat Mode</span>
              <span class="rounded-full bg-white/20 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-extrabold uppercase">Live</span>
            </button>
          </div>
          <FormBuilder :json="json" @update:json="onSave" />
        </div>
        <FillPanel
          v-if="tab === 'fill'"
          :key="fillKey"
          :json="json"
          @restart="fillKey++"
        />
        <ChatPanel
          v-if="tab === 'chat'"
          :key="fillKey"
          :json="json"
          @restart="fillKey++"
          @load-sample="onChatLoadSample"
        />
        <JsonPanel v-if="tab === 'json'" :json="json" @apply="applyJson" />
      </main>
      <aside
        v-if="showEvents"
        class="fixed inset-y-0 end-0 z-50 w-80 bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl lg:static lg:z-auto lg:shadow-none"
      >
        <EventLog />
      </aside>
    </div>
  </div>
</template>
