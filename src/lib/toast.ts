import { useSyncExternalStore } from "react";

export type ToastKind = "info" | "success" | "error";
export interface Toast { id: number; kind: ToastKind; text: string }

let toasts: Toast[] = [];
let seq = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, kind: ToastKind = "info") {
  if (!text) return;
  const id = seq++;
  toasts = [...toasts, { id, kind, text }];
  emit();
  setTimeout(() => dismissToast(id), 4500);
}
export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}
const EMPTY: Toast[] = [];
export function useToasts() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => toasts,
    () => EMPTY,
  );
}
