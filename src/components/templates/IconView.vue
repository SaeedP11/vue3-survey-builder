<script setup lang="ts">
import { computed } from "vue";
import { useIconPicker } from "../../provider/iconPickerKey.ts";
import ResultActionIcon from "./ResultActionIcon.vue";

const props = defineProps<{ name?: string }>();

const { icon } = useIconPicker();

// The built in names keep their own drawing; anything else goes to the host
const BUILT_IN = new Set([
  "arrow", "external", "download", "print", "calendar",
  "phone", "message", "share", "restart",
]);

const hosted = computed(() =>
  !!icon && !!props.name && props.name !== "none" && !BUILT_IN.has(props.name),
);
</script>

<template>
  <component :is="icon" v-if="hosted" :name="name" class="flex-none" aria-hidden="true" />
  <ResultActionIcon v-else :name="name" />
</template>
