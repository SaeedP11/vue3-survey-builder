import { useI18n } from "vue-i18n";

export default function useLocalI18n(messages: Record<string, any>) {
  return useI18n({
    useScope: "local",
    messages,
  });
}
