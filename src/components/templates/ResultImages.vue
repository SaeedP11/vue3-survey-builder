<script setup lang="ts">
import { computed, ref } from "vue";
import type { ResultImage } from "../../types/index.ts";
import { safeImageSrc } from "../../utils/resultContent.ts";
import useLocalI18n from "../../composables/useLocalI18n.ts";
import { surveyResult } from "../../locales/index.ts";

const props = defineProps<{
  images: ResultImage[];
  /** Full-bleed images at the top of the card, rather than framed in the content. */
  banner?: boolean;
  /** In the editor: a broken image shows a placeholder, and a tier's image its tier. */
  preview?: boolean;
  statusLabels: string[];
}>();

const { t } = useLocalI18n(surveyResult);

const failed = ref(new Set<string>());

const shown = computed(() =>
  props.images
    .map((image) => ({ image, src: safeImageSrc(image.src) }))
    .filter(
      ({ image, src }) =>
        props.preview || (src && !failed.value.has(image.id)),
    ),
);

function onError(id: string) {
  failed.value = new Set(failed.value).add(id);
}

function tierLabel(tier: number | undefined) {
  if (tier === undefined || tier === null) return "";
  return props.statusLabels[tier] ?? `${tier + 1}`;
}
</script>

<template>
  <div
    v-if="shown.length"
    :class="
      banner
        ? 'flex flex-col'
        : ['grid gap-3', shown.length > 1 ? 'sm:grid-cols-2' : '']
    "
  >
    <figure
      v-for="{ image, src } in shown"
      :key="image.id"
      class="relative m-0"
      :class="
        banner
          ? ''
          : 'overflow-hidden rounded-xl border border-[var(--sjs-border-light)] bg-[var(--sjs-general-backcolor-dim)]'
      "
    >
      <img
        v-if="src && !failed.has(image.id)"
        :src="src"
        :alt="image.alt ?? ''"
        loading="lazy"
        decoding="async"
        class="block w-full"
        :class="[
          banner ? 'aspect-[16/7]' : 'max-h-80',
          image.fit === 'contain'
            ? 'object-contain bg-[var(--sjs-general-backcolor-dim)]'
            : 'object-cover',
          !banner && image.fit !== 'contain' ? 'aspect-[4/3]' : '',
        ]"
        @error="onError(image.id)"
      />
      <div
        v-else
        class="flex w-full flex-col items-center justify-center gap-2 bg-[var(--sjs-general-backcolor-dim)] text-[12px] font-semibold text-[var(--sjs-general-forecolor-light)]"
        :class="banner ? 'aspect-[16/7]' : 'aspect-[4/3]'"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 6a1 1 0 011-1h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V6zm0 10l4.5-4.5L13 16m-1-1l2.5-2.5L20 18M15.5 9.5h.01"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {{ src ? t("images.failed") : t("images.empty") }}
      </div>
      <span
        v-if="preview && tierLabel(image.tier)"
        class="absolute top-2.5 start-2.5 rounded-full bg-[var(--sjs-general-backcolor)]/90 px-2.5 py-1 text-[11px] font-bold text-[var(--sjs-general-forecolor)] shadow-sm"
      >
        {{ t("images.onlyFor", { tier: tierLabel(image.tier) }) }}
      </span>
      <figcaption
        v-if="image.caption && image.caption.trim()"
        class="px-3.5 py-2.5 text-center text-[12.5px] leading-relaxed text-[var(--sjs-general-forecolor-light)]"
        :class="banner ? 'border-b border-[var(--sjs-border-light)]' : 'bg-[var(--sjs-general-backcolor)]'"
      >
        {{ image.caption }}
      </figcaption>
    </figure>
  </div>
</template>
