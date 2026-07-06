import { useI18n } from "vue-i18n";

export default function useFormBuilderI18n(): any {
  const { t, tm, ...rest } = useI18n();

  return {
    t: (key: string) => t(`formBuilder.${key}`),
    tm: (key: string) => tm(`formBuilder.${key}`),
    ...rest,
  };
}
