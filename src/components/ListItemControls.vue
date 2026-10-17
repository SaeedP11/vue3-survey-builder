<script setup lang="ts">
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";

defineProps<{ title: string; index: number; count: number }>();
defineEmits<{ move: [by: -1 | 1]; remove: [] }>();

const { t } = useLocalI18n(surveyResultEditor);

const iconButton =
  "grid h-8 w-8 cursor-pointer place-items-center rounded-md border border-fb-border bg-fb-surface-muted text-fb-fg-muted hover:bg-fb-border hover:text-fb-fg disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fb-accent";
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <span
      class="font-fb text-[10px] uppercase tracking-wider text-fb-fg-muted"
      >{{ title }}</span
    >
    <div class="flex items-center gap-1">
      <button
        type="button"
        :class="iconButton"
        :disabled="index === 0"
        :title="t('moveUp')"
        :aria-label="`${t('moveUp')}: ${title}`"
        @click="$emit('move', -1)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 19V5m0 0l-6 6m6-6l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        :class="iconButton"
        :disabled="index === count - 1"
        :title="t('moveDown')"
        :aria-label="`${t('moveDown')}: ${title}`"
        @click="$emit('move', 1)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14m0 0l6-6m-6 6l-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        :class="iconButton"
        :title="t('remove')"
        :aria-label="`${t('remove')}: ${title}`"
        @click="$emit('remove')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0v12a1 1 0 001 1h10a1 1 0 001-1V7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
