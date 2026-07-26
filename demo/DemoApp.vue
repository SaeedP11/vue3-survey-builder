<script setup lang="ts">
import FormBuilder from "../src/components/FormBuilder.vue";
import { ref } from "vue";

const json = ref<object>({});
</script>

<template>
  <FormBuilder v-model:json="json" />
</template>
