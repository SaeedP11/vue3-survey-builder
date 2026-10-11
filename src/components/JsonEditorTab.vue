<script setup lang="ts">
import {
  settings as creatorSettings,
  type TextareaJsonEditorModel,
} from "survey-creator-core";
import { SvComponent, useBase } from "survey-vue3-ui";
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { useJsonFormatter } from "../composables/useJsonFormatAction.ts";
import { formatJson, highlightJson } from "../utils/jsonHighlight.ts";
import { useSurveyCreator } from "../provider/surveyCreator.ts";

// Stands in for the creator's textarea JSON tab: the same model, textarea and
// error list, with the text coloured by a highlighted copy drawn behind it.
const props = defineProps<{ model: TextareaJsonEditorModel }>();

const creator = useSurveyCreator();
const input = useTemplateRef<HTMLTextAreaElement>("input");
const code = useTemplateRef<HTMLElement>("code");

useBase(() => props.model);
props.model.canShowErrors = false;
onMounted(() => (props.model.textElement = input.value!));

// A trailing newline would not get a line of its own in the <pre>
const highlighted = computed(() => highlightJson(props.model.text) + "\n");

const indentation = () => " ".repeat(creatorSettings.jsonEditor.indentation);

/**
 * Replaces the selection (or all the text) with `value` as typing would, so
 * the browser's undo keeps working; falls back to setting the text.
 */
function insert(value: string, all = false) {
  const el = input.value;
  if (!el || props.model.readOnly) return;
  el.focus();
  if (all) el.select();
  if (document.execCommand?.("insertText", false, value)) return;
  const start = all ? 0 : el.selectionStart;
  const end = all ? el.value.length : el.selectionEnd;
  props.model.text = el.value.slice(0, start) + value + el.value.slice(end);
  el.value = props.model.text;
  el.selectionStart = el.selectionEnd = start + value.length;
  scheduleApply();
}

// How long typing pauses before the text reaches the survey
const APPLY_DELAY = 400;
let applyTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Hands the text to the creator as leaving the tab would, so the designer and
 * the host's v-model:json follow the JSON tab while it stays open: a host
 * saving from the tab otherwise saved the survey as it was before the edits.
 * Text that does not parse or has errors waits for a fix.
 */
function apply() {
  clearTimeout(applyTimer);
  const model = props.model;
  if (model.isDisposed || model.readOnly || !model.isJSONChanged) return;
  if (!model.allowingDeactivate()) return;
  // As the creator does on deactivate; its typing does not allow the clear
  creator.selectedElement = undefined!;
  creator.changeText(model.text, false, true);
  creator.selectedElement = creator.survey;
  creator.setModified({ type: "JSON_EDITOR" });
  model.isJSONChanged = false;
}

function scheduleApply() {
  clearTimeout(applyTimer);
  applyTimer = setTimeout(apply, APPLY_DELAY);
}

function onInput(e: Event) {
  props.model.text = (e.target as HTMLTextAreaElement).value;
  scheduleApply();
}

// Leaving the tab applies the text itself (the creator's deactivate)
onBeforeUnmount(() => clearTimeout(applyTimer));

function format() {
  const formatted = formatJson(
    props.model.text,
    creatorSettings.jsonEditor.indentation,
  );
  // Text that does not parse is left as it is; the error list says why
  if (formatted !== null && formatted !== props.model.text) {
    insert(formatted, true);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    insert(indentation());
  } else if (e.code === "KeyF" && e.shiftKey && e.altKey) {
    e.preventDefault();
    format();
  }
}

function syncScroll() {
  const el = input.value;
  if (el && code.value) {
    code.value.style.transform = `translate(${-el.scrollLeft}px, ${-el.scrollTop}px)`;
  }
}

// The toolbar button is FormBuilder's (useJsonFormatAction); it formats through this
useJsonFormatter(creator, format);

defineExpose({ format });
</script>

<template>
  <div class="svc-creator-tab__content">
    <div class="svc-json-editor-tab__content">
      <div class="fb-json-editor" dir="ltr">
        <pre
          class="fb-json-editor__highlight svc-json-editor-tab__content-area"
          aria-hidden="true"
        ><code ref="code" v-html="highlighted"></code></pre>
        <textarea
          ref="input"
          class="fb-json-editor__input svc-json-editor-tab__content-area"
          :aria-label="model.ariaLabel"
          :disabled="model.readOnly"
          :value="model.text"
          wrap="off"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          @input="onInput"
          @blur="apply"
          @keydown="onKeydown"
          @scroll="syncScroll"
        ></textarea>
      </div>
      <div v-show="model.hasErrors" class="svc-json-editor-tab__errros_list">
        <SvComponent is="sv-list" :model="model.errorList" />
      </div>
    </div>
  </div>
</template>

<style>
/* Hosts recolour the tokens through these variables */
.fb-json-editor {
  --fb-json-key: var(--color-formbilder-json-key, #0451a5);
  --fb-json-string: var(--color-formbilder-json-string, #a31515);
  --fb-json-number: var(--color-formbilder-json-number, #098658);
  --fb-json-boolean: var(--color-formbilder-json-boolean, #0000ff);
  --fb-json-null: var(--color-formbilder-json-null, #af00db);
  --fb-json-punctuation: var(--color-formbilder-json-punctuation, #6b7280);
  --fb-json-comment: var(--color-formbilder-json-comment, #008000);

  position: relative;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  background: var(
    --ctr-code-viewer-background-color,
    var(--sjs-layer-1-background-500, white)
  );
}

.dark .fb-json-editor {
  --fb-json-key: var(--color-formbilder-json-key, #9cdcfe);
  --fb-json-string: var(--color-formbilder-json-string, #ce9178);
  --fb-json-number: var(--color-formbilder-json-number, #b5cea8);
  --fb-json-boolean: var(--color-formbilder-json-boolean, #569cd6);
  --fb-json-null: var(--color-formbilder-json-null, #c586c0);
  --fb-json-punctuation: var(--color-formbilder-json-punctuation, #9ca3af);
  --fb-json-comment: var(--color-formbilder-json-comment, #6a9955);
}

/* Both layers share the stock textarea's font and box, so they line up */
.fb-json-editor .fb-json-editor__highlight,
.fb-json-editor .fb-json-editor__input {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: var(--sjs-base-unit, 8px);
  border: 0;
  box-sizing: border-box;
  white-space: pre;
  tab-size: 2;
  letter-spacing: normal;
  word-spacing: normal;
  text-align: left;
}

.fb-json-editor .fb-json-editor__highlight {
  overflow: hidden;
  pointer-events: none;
}

.fb-json-editor__highlight code {
  display: block;
  font: inherit;
  will-change: transform;
}

.fb-json-editor .fb-json-editor__input {
  overflow: auto;
  resize: none;
  background: transparent;
  color: transparent;
  caret-color: var(
    --ctr-code-viewer-text-color,
    var(--sjs-code-gray-300, #505050)
  );
}

.fb-json-editor .fb-json-editor__input::selection {
  color: transparent;
  background: color-mix(in srgb, var(--fb-json-key) 25%, transparent);
}

.fb-json-key {
  color: var(--fb-json-key);
}
.fb-json-string {
  color: var(--fb-json-string);
}
.fb-json-number {
  color: var(--fb-json-number);
}
.fb-json-boolean {
  color: var(--fb-json-boolean);
}
.fb-json-null {
  color: var(--fb-json-null);
}
.fb-json-punctuation {
  color: var(--fb-json-punctuation);
}
.fb-json-comment {
  color: var(--fb-json-comment);
}
</style>
