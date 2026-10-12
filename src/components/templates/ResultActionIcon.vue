<script setup lang="ts">
import { computed } from "vue";
import type { ResultActionIcon } from "../../types/index.ts";

const props = defineProps<{ name?: ResultActionIcon }>();

// 24×24 stroke paths, drawn like the template's other icons
const PATHS: Record<Exclude<ResultActionIcon, "none">, string> = {
  arrow: "M5 12h14m0 0l-6-6m6 6l-6 6",
  external: "M14 4h6v6m0-6L10 14M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
  download: "M12 3v11m0 0l-4-4m4 4l4-4M5 19h14",
  print: "M7 9V4h10v5M7 17H5a1 1 0 01-1-1v-5a2 2 0 012-2h12a2 2 0 012 2v5a1 1 0 01-1 1h-2M7 14h10v6H7z",
  calendar: "M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1zm-1 4h16M8 3v5m8-5v5",
  phone:
    "M5 4h3l2 5-2.5 1.5a11 11 0 006 6L15 14l5 2v3a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z",
  message: "M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H9l-5 4V6a1 1 0 011-1z",
  share:
    "M8.6 13.5l6.8 4M15.4 6.5l-6.8 4M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zm12 7a3 3 0 11-6 0 3 3 0 016 0z",
  restart: "M4 4v6h6M4.6 15A8 8 0 104 10",
};

// Icons that point along the reading direction turn round in RTL
const MIRRORED = new Set<ResultActionIcon>(["arrow", "external"]);

const path = computed(() =>
  props.name && props.name !== "none" ? PATHS[props.name] : undefined,
);
</script>

<template>
  <svg
    v-if="path"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    class="flex-none"
    :class="{ 'rtl:-scale-x-100': MIRRORED.has(name!) }"
  >
    <path
      :d="path"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
