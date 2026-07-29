import type { EditorState } from "../app/diary-editor/types";

const key = (recordId: string) => `zupa:decoration-draft:v1:${recordId}`;
export function loadDecorationDraft(recordId: string): EditorState | null {
  if (typeof window === "undefined") return null;
  try { const raw = window.localStorage.getItem(key(recordId)); return raw ? JSON.parse(raw) as EditorState : null; } catch { return null; }
}
export function saveDecorationDraft(recordId: string, state: EditorState) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key(recordId), JSON.stringify(state)); } catch { /* storage is optional */ }
}
export function clearDecorationDraft(recordId: string) {
  if (typeof window !== "undefined") window.localStorage.removeItem(key(recordId));
}
