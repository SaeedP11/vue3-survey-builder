import { getCurrentScope, onScopeDispose, ref } from "vue";

export default function useColorMode() {
  const isDark = ref(document.documentElement.classList.contains("dark"));

  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains("dark");
  });

  observer.observe(document.documentElement, {
    attributeFilter: ["class"],
    attributes: true,
  });

  if (getCurrentScope()) onScopeDispose(() => observer.disconnect());

  return {
    isDark,
  };
}
