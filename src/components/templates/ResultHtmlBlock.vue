<script setup lang="ts">
import { computed } from "vue";
import { sanitizeResultHtml } from "../../utils/resultHtml.ts";
import useLocalI18n from "../../composables/useLocalI18n.ts";
import { surveyResult } from "../../locales/index.ts";

const props = defineProps<{
  /** The block's markup, its placeholders already filled. */
  html?: string;
  /** In the editor: an empty block says how to fill it. */
  preview?: boolean;
}>();

const { t } = useLocalI18n(surveyResult);

const safe = computed(() => sanitizeResultHtml(props.html));
</script>

<template>
  <!-- Sanitized above: no script, form controls, frames or unsafe links get through -->
  <div v-if="safe" class="fb-result-html" v-html="safe" />
  <p
    v-else-if="preview"
    class="m-0 rounded-xl border border-dashed border-[var(--sjs-border-default)] px-4 py-5 text-center text-[13px] text-[var(--sjs-general-forecolor-light)]"
  >
    {{ t("canvas.emptyHtml") }}
  </p>
</template>

<style scoped>
.fb-result-html {
  /* Contained: a fixed or absolute element stays inside the block, and
     nothing paints outside it */
  contain: content;
  overflow: hidden;
  overflow-wrap: anywhere;
  font-size: 15px;
  line-height: 1.75;
  color: var(--sjs-general-forecolor);
}
.fb-result-html :deep(:where(h1, h2, h3, h4, h5, h6)) {
  margin: 0 0 0.4em;
  line-height: 1.3;
  font-weight: 800;
}
.fb-result-html :deep(h1) {
  font-size: 1.6em;
}
.fb-result-html :deep(h2) {
  font-size: 1.35em;
}
.fb-result-html :deep(h3) {
  font-size: 1.15em;
}
.fb-result-html :deep(:where(p, ul, ol, blockquote, table, figure)) {
  margin: 0 0 0.75em;
}
.fb-result-html :deep(:where(p, ul, ol, blockquote, table, figure):last-child) {
  margin-block-end: 0;
}
.fb-result-html :deep(:where(ul, ol)) {
  padding-inline-start: 1.4em;
}
.fb-result-html :deep(ul) {
  list-style: disc;
}
.fb-result-html :deep(ol) {
  list-style: decimal;
}
.fb-result-html :deep(a) {
  color: var(--sjs-primary-backcolor);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.fb-result-html :deep(a:focus-visible) {
  outline: 2px solid var(--sjs-primary-backcolor);
  outline-offset: 2px;
  border-radius: 2px;
}
.fb-result-html :deep(:where(img, svg, video)) {
  max-width: 100%;
  height: auto;
}
.fb-result-html :deep(blockquote) {
  padding-inline-start: 1em;
  border-inline-start: 3px solid var(--sjs-border-default);
  color: var(--sjs-general-forecolor-light);
}
.fb-result-html :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}
.fb-result-html :deep(:where(th, td)) {
  padding: 0.45em 0.6em;
  border-bottom: 1px solid var(--sjs-border-light);
  text-align: start;
}
.fb-result-html :deep(hr) {
  border: 0;
  border-top: 1px solid var(--sjs-border-light);
  margin: 1em 0;
}
</style>
