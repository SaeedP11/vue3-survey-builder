<script setup lang="ts">
import { useSurveyCreator } from "../provider/surveyCreator.ts";
import useCreatorEvent from "../composables/useCreatorEvent";
import {
  ref,
  computed,
  shallowRef,
  onScopeDispose,
  type Ref,
  createApp,
  type App,
  type Component,
} from "vue";
import * as LucideIcons from "lucide-vue-next";
import type { SurveyModel } from "survey-core";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { general } from "../locales/index.ts";
import Modal from "./Modal.vue";

const { t } = useLocalI18n(general);

const search = ref("");
const isOpen = ref(false);

const creator = useSurveyCreator();
const logoPickerContainer: Ref<HTMLElement | undefined> = ref();

const onLogoPickerClick = (e: Event) => {
  e.preventDefault();
  isOpen.value = !isOpen.value;
};

const onAfterRenderHeader = (survey: SurveyModel, options: any) => {
  const logoPicker: HTMLElement | null = options.htmlElement?.children?.[1];
  if (logoPicker) {
    // remove file input
    logoPickerContainer.value = logoPicker;
    const fileInput = logoPicker.firstChild;
    if (fileInput) logoPicker.removeChild(fileInput);

    logoPicker.addEventListener("click", onLogoPickerClick);

    // Draw the icon saved in the survey JSON, e.g. after a reload.
    const saved =
      survey.icon && LucideIcons[survey.icon as keyof typeof LucideIcons];
    if (saved) mountIcon(saved as Component);
  }
};

// The designer survey is replaced whenever creator.JSON is set, so follow
// each new one as well as the current one.
creator.survey.onAfterRenderHeader.add(onAfterRenderHeader);
useCreatorEvent(creator.onSurveyInstanceCreated, (_: any, options: any) => {
  if (options.area === "designer-tab") {
    options.survey.onAfterRenderHeader.add(onAfterRenderHeader);
  }
});

onScopeDispose(() => {
  creator.survey?.onAfterRenderHeader.remove(onAfterRenderHeader);
  logoPickerContainer.value?.removeEventListener("click", onLogoPickerClick);
});

const ALL_ICONS = shallowRef(LucideIcons);
const filteredIcons: Ref<[string, object][]> = computed(() => {
  const query = search.value.toLowerCase();
  return Object.entries(ALL_ICONS.value)
    .filter(
      ([name, component]) =>
        typeof component !== "undefined" && name.toLowerCase().includes(query),
    )
    .slice(0, 80);
});

let mountedIconApp: App | null = null;

function mountIcon(Component: Component) {
  const iconPlaceholder = logoPickerContainer.value?.firstElementChild;
  if (iconPlaceholder) {
    mountedIconApp?.unmount();
    mountedIconApp = createApp(Component);
    mountedIconApp.mount(iconPlaceholder);
  }
}

const selectIcon = (name: string, Component: Component) => {
  creator.survey.icon = name;
  mountIcon(Component);
  isOpen.value = false;
};

onScopeDispose(() => {
  mountedIconApp?.unmount();
  mountedIconApp = null;
});
</script>

<template>
  <Modal v-model="isOpen">
    <div v-if="isOpen" class="modal-container">
      <input
        v-model.trim="search"
        class="search-input"
        :placeholder="t('iconSearchPlaceholder')"
        autofocus
      />
      <div class="icon-grid">
        <button
          v-for="[name, IconComp] in filteredIcons"
          @click.prevent="selectIcon(name, IconComp)"
          class="icon-button"
          :title="name"
          :key="name"
        >
          <component :is="IconComp" />
        </button>
      </div>
    </div>
  </Modal>
</template>

<style>
.icon-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  max-height: 40vh;
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: 1.5rem;
  justify-items: center;
  gap: 1em;
}

.icon-button {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0.75rem;
  background-color: #27262b;
  padding: 1rem;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  background-color: #26bba8;
}

.icon-button:active {
  transform: scale(0.98);
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
