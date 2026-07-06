<script setup lang="ts">
import useFormBuilderI18n from "../../composables/useFormBuilderI18n.ts";

defineEmits<{ hide: [] }>();

const { t } = useFormBuilderI18n();
</script>

<template>
  <div class="group relative">
    <slot />
    <div
      class="absolute inset-0 -m-0.5 border-2 border-dashed border-[var(--sjs-primary-backcolor)] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      aria-hidden="true"
    />
    <button
      type="button"
      class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--sjs-special-red)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 cursor-pointer"
      :title="t('surveyResult.hideSection')"
      :aria-label="t('surveyResult.hideSection')"
      @click="$emit('hide')"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0v12a1 1 0 001 1h10a1 1 0 001-1V7m-9 0h8"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>