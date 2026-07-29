export const DIARY_CANVAS = { width: 1080, height: 1350, ratio: 4 / 5, sceneVersion: 1, maxElements: 24 } as const;

export type ElementType = "photo" | "sticker" | "text";

export interface CanvasElementBase {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
}

export interface PhotoElement extends CanvasElementBase {
  type: "photo";
  sourceUrl: string;
  originalWidth: number;
  originalHeight: number;
  crop?: { x: number; y: number; width: number; height: number };
}

export interface StickerElement extends CanvasElementBase {
  type: "sticker";
  stickerId: string;
  sourceUrl: string;
}

export interface TextElement extends CanvasElementBase {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: "left" | "center" | "right";
}

export type CanvasElement = PhotoElement | StickerElement | TextElement;

export interface DiaryScene {
  version: number;
  canvas: { width: number; height: number; background: string };
  elements: CanvasElement[];
  updatedAt: string;
}

export type EditorState = { scene: DiaryScene; selectedId: string | null };
