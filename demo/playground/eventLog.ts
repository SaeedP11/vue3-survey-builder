import { reactive } from "vue";

export type EventKind = "save" | "ai" | "logic" | "complete" | "sample" | "error";

export interface PlaygroundEvent {
  id: number;
  at: Date;
  kind: EventKind;
  message: string;
  detail?: unknown;
  /** How many times in a row it happened, for events logged with `coalesce`. */
  count: number;
}

let nextId = 1;

/** What the library called back with, newest first; shown in the Events panel. */
export const events = reactive<PlaygroundEvent[]>([]);

export function logEvent(
  kind: EventKind,
  message: string,
  detail?: unknown,
  { coalesce = false } = {},
) {
  const last = events[0];
  if (coalesce && last?.kind === kind && last.message === message) {
    last.count++;
    last.at = new Date();
    last.detail = detail;
    return;
  }
  events.unshift({ id: nextId++, at: new Date(), kind, message, detail, count: 1 });
  if (events.length > 200) events.pop();
}

export function clearEvents() {
  events.splice(0);
}
