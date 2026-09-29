<script setup lang="ts">
import { clearEvents, events, type EventKind } from "./eventLog.ts";

const badge: Record<EventKind, string> = {
  save: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ai: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  logic: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  complete: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  sample: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  error: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

const time = (d: Date) => d.toLocaleTimeString([], { hour12: false });
</script>

<template>
  <div class="flex h-full flex-col" dir="ltr">
    <div
      class="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800"
    >
      <h2 class="text-sm font-semibold">Events</h2>
      <button
        type="button"
        class="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        @click="clearEvents"
      >
        Clear
      </button>
    </div>
    <p v-if="!events.length" class="p-3 text-xs text-slate-500">
      Autosaves, AI calls, fired triggers and completed surveys show up here.
    </p>
    <ol class="min-h-0 flex-1 overflow-auto">
      <li
        v-for="e in events"
        :key="e.id"
        class="border-b border-slate-100 px-3 py-2 text-xs dark:border-slate-900"
      >
        <div class="flex items-center gap-2">
          <span :class="badge[e.kind]" class="rounded px-1.5 py-0.5 font-mono text-[10px]">
            {{ e.kind }}
          </span>
          <span class="font-mono text-slate-400">{{ time(e.at) }}</span>
          <span v-if="e.count > 1" class="text-slate-400">×{{ e.count }}</span>
        </div>
        <details v-if="e.detail !== undefined" class="mt-1">
          <summary class="cursor-pointer">{{ e.message }}</summary>
          <pre
            class="mt-1 max-h-60 overflow-auto rounded bg-slate-100 p-2 text-[11px] dark:bg-slate-900"
            >{{ JSON.stringify(e.detail, null, 2) }}</pre
          >
        </details>
        <p v-else class="mt-1">{{ e.message }}</p>
      </li>
    </ol>
  </div>
</template>
