import { watch } from "vue";

export default function immediateWatch(val: any, callback: (val: any) => void) {
  watch(val, callback, { immediate: true });
}
