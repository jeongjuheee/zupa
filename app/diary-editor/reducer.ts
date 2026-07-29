import { DIARY_CANVAS, type CanvasElement, type EditorState } from "./types";

export type EditorAction =
  | { type: "select"; id: string | null }
  | { type: "update"; id: string; patch: Partial<CanvasElement> }
  | { type: "add"; element: CanvasElement }
  | { type: "remove"; id: string }
  | { type: "duplicate"; id: string }
  | { type: "reorder"; id: string; direction: "front" | "back" }
  | { type: "set-background"; color: string }
  | { type: "hydrate"; state: EditorState };

const stamp = () => new Date().toISOString();
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

function constrain(element: CanvasElement): CanvasElement {
  const scaleX = clamp(element.scaleX, -3, 3);
  const scaleY = clamp(element.scaleY, 0.15, 3);
  const visibleWidth = Math.max(48, element.width * Math.abs(scaleX));
  const visibleHeight = Math.max(48, element.height * Math.abs(scaleY));
  return { ...element, scaleX, scaleY, x: clamp(element.x, -visibleWidth + 32, DIARY_CANVAS.width - 32), y: clamp(element.y, -visibleHeight + 32, DIARY_CANVAS.height - 32) };
}

function sceneWith(state: EditorState, elements: CanvasElement[]) {
  return { ...state, scene: { ...state.scene, elements: elements.sort((a, b) => a.zIndex - b.zIndex), updatedAt: stamp() } };
}

export function diaryEditorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === "select") return { ...state, selectedId: action.id };
  if (action.type === "hydrate") return action.state;
  if (action.type === "set-background") return { ...state, scene: { ...state.scene, canvas: { ...state.scene.canvas, background: action.color }, updatedAt: stamp() } };
  if (action.type === "add") {
    if (state.scene.elements.length >= DIARY_CANVAS.maxElements) return state;
    return { ...sceneWith(state, [...state.scene.elements, constrain(action.element)]), selectedId: action.element.id };
  }
  if (action.type === "remove") return { ...sceneWith(state, state.scene.elements.filter((element) => element.id !== action.id)), selectedId: state.selectedId === action.id ? null : state.selectedId };
  if (action.type === "update") return sceneWith(state, state.scene.elements.map((element) => element.id === action.id ? constrain({ ...element, ...action.patch } as CanvasElement) : element));
  if (action.type === "duplicate") {
    const source = state.scene.elements.find((element) => element.id === action.id);
    if (!source || state.scene.elements.length >= DIARY_CANVAS.maxElements) return state;
    const copy = constrain({ ...source, id: `${source.id}-copy-${Date.now()}`, x: source.x + 28, y: source.y + 28, zIndex: Math.max(...state.scene.elements.map((element) => element.zIndex)) + 1 });
    return { ...sceneWith(state, [...state.scene.elements, copy]), selectedId: copy.id };
  }
  const source = state.scene.elements.find((element) => element.id === action.id);
  if (!source) return state;
  const zIndex = action.direction === "front" ? Math.max(...state.scene.elements.map((element) => element.zIndex)) + 1 : Math.min(...state.scene.elements.map((element) => element.zIndex)) - 1;
  return sceneWith(state, state.scene.elements.map((element) => element.id === action.id ? { ...element, zIndex } : element));
}
