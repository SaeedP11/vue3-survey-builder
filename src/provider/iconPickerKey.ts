import { inject, provide, type Component, type InjectionKey } from "vue";

/**
 * What the host brings to choose and draw icons. Both parts are optional:
 * without them the library offers its own small set of icons.
 */
export interface IconPickerConfig {
  /**
   * Chooses an icon. Gets `modelValue` (the icon's name, `""` for none) and
   * emits `update:modelValue`; also gets `label` (the field's accessible name).
   */
  picker?: Component;
  /** Draws an icon. Gets `name`, the same value the picker emits. */
  icon?: Component;
}

export const ICON_PICKER_KEY: InjectionKey<IconPickerConfig> = Symbol("iconPicker");

/** Lets a host app plug its own icon picker and icon renderer into the editors and the result page. */
export function provideIconPicker(config: IconPickerConfig): void {
  provide(ICON_PICKER_KEY, config);
}

/** The config a host provided, or an empty one. */
export function useIconPicker(): IconPickerConfig {
  return inject(ICON_PICKER_KEY, {});
}
