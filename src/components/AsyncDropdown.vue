<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { AsyncDropdownHandlers, ItemType } from "../types";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{ question: any }>();
const handlers = props.question.handlers as AsyncDropdownHandlers | null;

const show = ref(false);
const searchValue = ref("");

const items = computed<ItemType[]>(() => handlers?.items.value ?? []);
const currentPage = computed(() => handlers?.currentPage.value ?? 0);
const totalPages = computed(() => handlers?.totalPages.value ?? 0);

// Texts of every item seen so far: the selected one can be on a page or
// search result that is no longer loaded.
const seenTexts = new Map<string, string>();
watch(
  items,
  (list) => list.forEach((i) => seenTexts.set(i.value, i.text)),
  { immediate: true },
);

const selectedText = computed(() => {
  const v = props.question.value;
  if (v === undefined || v === null) return "";
  return (
    items.value.find((i) => i.value === v)?.text ?? seenTexts.get(v) ?? ""
  );
});

const inputDisplay = computed(() =>
  show.value ? searchValue.value : selectedText.value,
);

function onSearchInput(e: Event) {
  const query = (e.target as HTMLInputElement).value;
  searchValue.value = query;
  handlers?.handleSearch(query);
}

function onSelect(item: ItemType) {
  props.question.value = item.value;
  searchValue.value = "";
  show.value = false;
}

function onFocus() {
  show.value = true;
}

function onBlur() {
  setTimeout(() => {
    show.value = false;
    searchValue.value = "";
  }, 150);
}

function onNext() {
  if (currentPage.value >= totalPages.value) return;
  handlers?.handleNextPage();
}

function onPrev() {
  if (currentPage.value <= 1) return;
  handlers?.handlePrevPage();
}
</script>

<template>
  <div class="sd-selectbase">
    <div class="sv-dropdown_select-wrapper">
      <div
        class="sd-input sd-dropdown"
        :class="{ 'sd-dropdown--empty': !selectedText }"
      >
        <div class="sd-dropdown__value">
          <input
            type="text"
            class="sd-dropdown__filter-string-input"
            :value="inputDisplay"
            :aria-expanded="show ? 'true' : 'false'"
            @input="onSearchInput"
            @focus="onFocus"
            @blur="onBlur"
            placeholder="Select..."
            aria-required="false"
            aria-invalid="false"
            autocomplete="off"
            inputmode="text"
            role="combobox"
          />
        </div>
        <div
          class="sv-action-bar sv-action-bar--default-size-mode sd-dropdown-action-bar"
        >
          <div class="sv-action sd-editor-chevron-button">
            <div class="sv-action__content">
              <button
                class="sd-editor-button-item"
                :class="[show && 'sd-editor-button-item--pressed']"
                type="button"
                title="Select"
                role="button"
                tabindex="-1"
              >
                <svg
                  class="sv-svg-icon sv-editor-button-item__icon"
                  role="presentation"
                >
                  <use xlink:href="#icon-chevrondown-24x24"></use>
                  <title>Select</title>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div
          tabindex="-1"
          class="sv-popup sv-dropdown-popup sv-single-select-list sv-popup--menu-popup sv-popup--bottom"
          v-if="show"
        >
          <div class="sv-popup__container">
            <div class="sv-popup__body-content">
              <div class="sv-popup__scrolling-content">
                <div class="sv-popup__content">
                  <div class="sv-list__container sd-list">
                    <div class="sv-list__empty-container" v-if="!items.length">
                      <div
                        class="sv-list__empty-text"
                        aria-label="No data to display"
                      >
                        No data to display
                      </div>
                    </div>
                    <ul v-else class="sv-list" role="listbox">
                      <li
                        role="option"
                        class="sv-list__item sd-list__item sv-list__item-text--wrap"
                        :class="{
                          'sv-list__item--selected':
                            choice.value === props.question.value,
                        }"
                        v-for="choice in items"
                        :key="choice.value"
                        :aria-selected="
                          choice.value === props.question.value
                            ? 'true'
                            : 'false'
                        "
                        tabindex="-1"
                        @mousedown.prevent="onSelect(choice)"
                      >
                        <div
                          style="--sjs-list-item-level: 1"
                          class="sv-list__item-body sd-list__item-body"
                          :title="choice.text"
                        >
                          <span class="sv-string-viewer">
                            {{ choice.text }}
                          </span>
                        </div>
                      </li>
                    </ul>
                    <div class="pagination" v-if="totalPages > 0">
                      <button
                        type="button"
                        class="sd-editor-button-item sd-editor-button-item--pressed"
                        :disabled="currentPage >= totalPages"
                        @mousedown.prevent="onNext"
                      >
                        <svg
                          class="sv-svg-icon sv-editor-button-item__icon"
                          role="presentation"
                        >
                          <use xlink:href="#icon-chevronleft-24x24"></use>
                          <title>Next</title>
                        </svg>
                      </button>
                      <span>{{ currentPage }} / {{ totalPages }}</span>
                      <button
                        type="button"
                        class="sd-editor-button-item sd-editor-button-item--pressed"
                        :disabled="currentPage <= 1"
                        @mousedown.prevent="onPrev"
                      >
                        <svg
                          class="sv-svg-icon sv-editor-button-item__icon"
                          role="presentation"
                        >
                          <use xlink:href="#icon-chevronright-24x24"></use>
                          <title>Previous</title>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.sv-popup {
  position: absolute;
  top: 50px;
}

.sv-popup__container {
  width: 100%;
}

.pagination {
  border-top: 1px solid #ccc;
  justify-content: space-between;
  align-items: center;
  display: flex;
}

.pagination button {
  padding: 1em;
  display: flex;
  border: none;
  background: transparent;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination button:not(:disabled):hover {
  background-color: var(--sjs-general-backcolor-dim, rgba(0, 0, 0, 0.05));
}
</style>
