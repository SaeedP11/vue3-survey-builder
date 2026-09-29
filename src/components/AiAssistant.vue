<script setup lang="ts">
import { useSurveyCreator } from "../provider/surveyCreator.ts";
import useCreatorToolbarAction from "../composables/useCreatorToolbarAction.ts";
import { useSurveyAiAssistantConfig } from "../provider/aiAssistantConfig.ts";
import { ref, useTemplateRef } from "vue";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { general } from "../locales/index.ts";
import Modal from "./Modal.vue";

const { t } = useLocalI18n(general);

const textareaRef = useTemplateRef("chatbox");
const isLoading = ref(false);
const isOpen = ref(false);
const prompt = ref("");

const creator = useSurveyCreator();
const config = useSurveyAiAssistantConfig();

useCreatorToolbarAction(creator, {
  id: "chat-ai",
  iconName: "pg-specific-24x24",
  action: () => {
    isOpen.value = !isOpen.value;
  },
});

const onAfterEnter = () => {
  textareaRef.value?.focus();
};

const handleClick = async () => {
  if (!prompt.value || isLoading.value) return;

  try {
    isLoading.value = true;
    const schema = await config.onSubmit(prompt.value);
    if (schema) creator.JSON = schema;
  } catch (error) {
  } finally {
    isLoading.value = false;
    isOpen.value = false;
  }
};
</script>

<template>
  <Modal v-model="isOpen" @after-enter="onAfterEnter">
    <div v-if="isOpen" class="modal-container">
      <textarea
        rows="20"
        cols="80"
        v-model="prompt"
        :placeholder="t('aiPromptPlaceholder')"
        class="prompt-textarea"
        ref="chatbox"
      ></textarea>

      <div v-if="isLoading" class="loading-container">
        <div class="progress-line"></div>
      </div>

      <div class="action-wrapper">
        <button
          :disabled="isLoading"
          class="submit-button"
          @click.prevent="handleClick"
        >
          <span v-if="isLoading">{{ t("aiGenerating") }}</span>
          <span v-else>{{ t("aiCreate") }}</span>
        </button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.prompt-textarea {
  background-color: var(--sjs2-palette-gray-800);
  border: 1px solid #1a181e;
  border-radius: 1rem;
  padding: 1rem;
  color: white;
  outline: none;
  transition: all 0.2s;
  resize: vertical;
}

.prompt-textarea:focus {
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.3);
}

.action-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1rem;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  border-radius: 0.75rem;
  background-color: #2dd4bf;
  color: white;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.submit-button:hover {
  background-color: #26bba8;
}

.submit-button:active {
  transform: scale(0.98);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
