<script setup lang="ts">
import { useId } from "vue";
import type { ResultImage, ResultImagePlacement } from "../types/index.ts";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { newId } from "../utils/resultContent.ts";
import ImageSourceField from "./ImageSourceField.vue";
import ListItemControls from "./ListItemControls.vue";

const MAX_IMAGES = 8;

const images = defineModel<ResultImage[]>({ default: () => [] });
defineProps<{ statusLabels: string[] }>();

const { t } = useLocalI18n(surveyResultEditor);
const uid = useId();

const placements: ResultImagePlacement[] = [
  "banner",
  "afterScore",
  "beforeActions",
];

const inputClass =
  "rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent";

function update(index: number, patch: Partial<ResultImage>) {
  const next = [...images.value];
  next[index] = { ...next[index], ...patch };
  images.value = next;
}

function add() {
  images.value = [
    ...images.value,
    {
      id: newId("img"),
      src: "",
      alt: "",
      caption: "",
      placement: "afterScore",
      fit: "cover",
    },
  ];
}

function remove(index: number) {
  images.value = images.value.filter((_, i) => i !== index);
}

function move(index: number, by: -1 | 1) {
  const next = [...images.value];
  const [item] = next.splice(index, 1);
  next.splice(index + by, 0, item);
  images.value = next;
}

function onTier(index: number, raw: string) {
  update(index, { tier: raw === "" ? undefined : Number(raw) });
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs leading-snug text-fb-fg-muted">{{ t("images.help") }}</p>

    <div
      v-for="(image, index) in images"
      :key="image.id"
      class="rounded-lg border border-fb-border bg-fb-surface p-3 space-y-3"
    >
      <ListItemControls
        :title="t('images.item', { n: index + 1 })"
        :index="index"
        :count="images.length"
        @move="(by) => move(index, by)"
        @remove="remove(index)"
      />

      <ImageSourceField
        :model-value="image.src"
        :label="t('imageField.url')"
        @update:model-value="(src: string) => update(index, { src })"
      />

      <div class="flex flex-col gap-1">
        <label
          :for="`${uid}-alt-${index}`"
          class="text-[11.5px] font-semibold text-fb-fg-secondary"
          >{{ t("images.alt") }}</label
        >
        <input
          :id="`${uid}-alt-${index}`"
          :value="image.alt ?? ''"
          type="text"
          :aria-describedby="`${uid}-alt-help-${index}`"
          :class="inputClass"
          @input="update(index, { alt: ($event.target as HTMLInputElement).value })"
        />
        <p
          :id="`${uid}-alt-help-${index}`"
          class="text-[11px] leading-snug text-fb-fg-muted"
        >
          {{ t("images.altHelp") }}
        </p>
      </div>

      <div class="flex flex-col gap-1">
        <label
          :for="`${uid}-caption-${index}`"
          class="text-[11.5px] font-semibold text-fb-fg-secondary"
          >{{ t("images.caption") }}</label
        >
        <input
          :id="`${uid}-caption-${index}`"
          :value="image.caption ?? ''"
          type="text"
          :class="inputClass"
          @input="
            update(index, { caption: ($event.target as HTMLInputElement).value })
          "
        />
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <div class="flex flex-col gap-1">
          <label
            :for="`${uid}-placement-${index}`"
            class="text-[11.5px] font-semibold text-fb-fg-secondary"
            >{{ t("images.placement") }}</label
          >
          <select
            :id="`${uid}-placement-${index}`"
            :value="image.placement ?? 'afterScore'"
            :class="inputClass"
            @change="
              update(index, {
                placement: ($event.target as HTMLSelectElement)
                  .value as ResultImagePlacement,
              })
            "
          >
            <option v-for="p in placements" :key="p" :value="p">
              {{ t(`images.placements.${p}`) }}
            </option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label
            :for="`${uid}-tier-${index}`"
            class="text-[11.5px] font-semibold text-fb-fg-secondary"
            >{{ t("images.tier") }}</label
          >
          <select
            :id="`${uid}-tier-${index}`"
            :value="image.tier ?? ''"
            :class="inputClass"
            @change="onTier(index, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ t("images.everyResult") }}</option>
            <option
              v-for="(label, tier) in statusLabels"
              :key="tier"
              :value="tier"
            >
              {{ label || tier + 1 }}
            </option>
          </select>
        </div>
      </div>

      <fieldset class="flex flex-col gap-1">
        <legend class="mb-1 text-[11.5px] font-semibold text-fb-fg-secondary">
          {{ t("images.fit") }}
        </legend>
        <div
          class="grid grid-cols-2 gap-1 rounded-lg border border-fb-border bg-fb-surface-muted p-1"
        >
          <label
            v-for="fit in ['cover', 'contain'] as const"
            :key="fit"
            class="cursor-pointer rounded-md px-2 py-1.5 text-center text-xs font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-fb-accent"
            :class="
              (image.fit ?? 'cover') === fit
                ? 'bg-fb-surface text-fb-fg shadow-sm'
                : 'text-fb-fg-muted hover:text-fb-fg'
            "
          >
            <input
              type="radio"
              class="sr-only"
              :name="`${uid}-fit-${index}`"
              :value="fit"
              :checked="(image.fit ?? 'cover') === fit"
              @change="update(index, { fit })"
            />
            {{ fit === "cover" ? t("images.fitCover") : t("images.fitContain") }}
          </label>
        </div>
      </fieldset>
    </div>

    <p
      v-if="images.length === 0"
      class="rounded-lg border border-dashed border-fb-border px-3 py-4 text-center text-xs text-fb-fg-muted"
    >
      {{ t("images.empty") }}
    </p>

    <button
      v-if="images.length < MAX_IMAGES"
      type="button"
      class="w-full cursor-pointer rounded-lg border border-dashed border-fb-border-strong bg-fb-surface-muted/40 px-3 py-2.5 text-sm font-semibold text-fb-fg hover:bg-fb-surface-muted"
      @click="add"
    >
      {{ t("images.add") }}
    </button>
  </div>
</template>
