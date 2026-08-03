"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import { BottomSheet, Button, ErrorMessage } from "../ui";
import { STICKER_ASSETS } from "../stickers";
import {
  clearDecorationDraft,
  loadDecorationDraft,
  saveDecorationDraft,
} from "../../lib/diary-decoration-draft";
import { saveDiaryDecoration } from "../../lib/diary-decoration-service";
import { diaryEditorReducer } from "./reducer";
import { DIARY_CANVAS, type CanvasElement, type EditorState } from "./types";

type SourcePhoto = { id: string; sourceUrl: string; name: string };
type Sheet = "sticker" | "text" | "background" | null;
const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

function photoLayout(count: number, index: number) {
  const layouts =
    count === 1
      ? [[90, 150, 900, 1050]]
      : count === 2
        ? [
            [70, 180, 470, 780],
            [540, 390, 470, 780],
          ]
        : count === 3
          ? [
              [80, 110, 560, 710],
              [540, 220, 440, 590],
              [270, 780, 560, 430],
            ]
          : [
              [70, 110, 450, 540],
              [560, 150, 450, 540],
              [100, 740, 430, 500],
              [560, 690, 430, 500],
            ];
  const [x, y, width, height] = layouts[index] ?? layouts[0];
  return { x, y, width, height };
}

function createInitialState(photos: SourcePhoto[]): EditorState {
  return {
    selectedId: photos[0]?.id ?? null,
    scene: {
      version: DIARY_CANVAS.sceneVersion,
      canvas: {
        width: DIARY_CANVAS.width,
        height: DIARY_CANVAS.height,
        background: "#fff8f1",
      },
      updatedAt: new Date().toISOString(),
      elements: photos
        .slice(0, 4)
        .map((photo, index) => ({
          id: photo.id,
          type: "photo",
          sourceUrl: photo.sourceUrl,
          originalWidth: 1,
          originalHeight: 1,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          zIndex: index + 1,
          locked: false,
          ...photoLayout(photos.length, index),
        })),
    },
  };
}

function useLoadedImage(url: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const item = new window.Image();
    item.crossOrigin = "anonymous";
    item.onload = () => setImage(item);
    item.src = url;
    return () => {
      item.onload = null;
    };
  }, [url]);
  return image;
}

function CanvasImage({
  element,
  onSelect,
  onChange,
}: {
  element: CanvasElement;
  onSelect: () => void;
  onChange: (patch: Partial<CanvasElement>) => void;
}) {
  const image = useLoadedImage(
    element.type === "text" ? "" : element.sourceUrl,
  );
  const ref = useRef<Konva.Image>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.getLayer()?.batchDraw();
  }, [image]);
  if (element.type === "text" || !image) return null;
  const aspect = image.naturalWidth / image.naturalHeight || 1;
  // Keep the source's natural ratio. Element width is the logical editing size.
  const renderedHeight = element.width / aspect;
  return (
    <KonvaImage
      id={element.id}
      ref={ref}
      image={image}
      x={element.x}
      y={element.y}
      width={element.width}
      height={renderedHeight}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(event) =>
        onChange({ x: event.target.x(), y: event.target.y() })
      }
      onTransformEnd={() => {
        const node = ref.current;
        if (node)
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
          });
      }}
    />
  );
}

function CanvasText({
  element,
  onSelect,
  onChange,
}: {
  element: CanvasElement;
  onSelect: () => void;
  onChange: (patch: Partial<CanvasElement>) => void;
}) {
  if (element.type !== "text") return null;
  return (
    <Text
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      text={element.text}
      fontSize={element.fontSize}
      fontFamily={element.fontFamily}
      fill={element.color}
      align={element.align}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(event) =>
        onChange({ x: event.target.x(), y: event.target.y() })
      }
      onTransformEnd={(event) =>
        onChange({
          x: event.target.x(),
          y: event.target.y(),
          rotation: event.target.rotation(),
          scaleX: event.target.scaleX(),
          scaleY: event.target.scaleY(),
        })
      }
    />
  );
}

export function DiaryEditorPage({
  recordId,
  photos,
  onCancel,
  onComplete,
  completeLabel = "완료하기",
}: {
  recordId: string;
  photos: SourcePhoto[];
  onCancel: () => void;
  onComplete: (imageUrl: string) => void;
  completeLabel?: string;
}) {
  const [state, dispatch] = useReducer(
    diaryEditorReducer,
    photos,
    createInitialState,
  );
  const [sheet, setSheet] = useState<Sheet>(null);
  const stickerPacks = useMemo(
    () => Array.from(new Set(STICKER_ASSETS.map((asset) => asset.pack))),
    [],
  );
  const [selectedStickerPack, setSelectedStickerPack] = useState(
    () => stickerPacks[0] ?? "",
  );
  const [textValue, setTextValue] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDecorations, setEditingDecorations] = useState(false);
  const [error, setError] = useState("");
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const addPhotoInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const pinchRef = useRef<{
    distance: number;
    angle: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  } | null>(null);
  const [stageWidth, setStageWidth] = useState(320);
  const selected =
    state.scene.elements.find((element) => element.id === state.selectedId) ??
    null;
  const photoCount = state.scene.elements.filter(
    (element) => element.type === "photo",
  ).length;
  const visibleStickerAssets = STICKER_ASSETS.filter(
    (asset) => asset.pack === selectedStickerPack,
  );
  useEffect(() => {
    const draft = loadDecorationDraft(recordId);
    if (
      draft?.scene.version === DIARY_CANVAS.sceneVersion &&
      draft.scene.elements.some((element) => element.type === "photo")
    )
      dispatch({ type: "hydrate", state: draft });
  }, [recordId]);
  useEffect(() => {
    const timeout = window.setTimeout(
      () => saveDecorationDraft(recordId, state),
      450,
    );
    return () => window.clearTimeout(timeout);
  }, [recordId, state]);
  useEffect(() => {
    const resize = () =>
      setStageWidth(Math.min(hostRef.current?.clientWidth ?? 320, 520));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    const node = selected?.id
      ? stageRef.current?.findOne(`#${selected.id}`)
      : undefined;
    if (transformerRef.current) {
      transformerRef.current.nodes(node ? [node] : []);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected?.id, state.scene.elements]);
  const scale = stageWidth / DIARY_CANVAS.width;
  const sorted = useMemo(
    () => [...state.scene.elements].sort((a, b) => a.zIndex - b.zIndex),
    [state.scene.elements],
  );
  const updateSelected = (patch: Partial<CanvasElement>) =>
    selected && dispatch({ type: "update", id: selected.id, patch });
  const addSticker = (assetId: string) => {
    const asset = STICKER_ASSETS.find((item) => item.id === assetId);
    if (!asset) return;
    const stickerWidth = asset.width ? Math.min(340, asset.width / 2.65) : 200;
    const stickerHeight = asset.width && asset.height
      ? Math.round(stickerWidth * (asset.height / asset.width))
      : 200;
    dispatch({
      type: "add",
      element: {
        id: createId(),
        type: "sticker",
        stickerId: asset.id,
        sourceUrl: asset.src,
        x: 440,
        y: 550,
        width: stickerWidth,
        height: stickerHeight,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        zIndex:
          Math.max(0, ...state.scene.elements.map((item) => item.zIndex)) + 1,
        locked: false,
      },
    });
  };
  const addText = () => {
    const text = textValue.trim();
    if (!text) return;
    dispatch({
      type: "add",
      element: {
        id: createId(),
        type: "text",
        text,
        x: 180,
        y: 640,
        width: 720,
        height: 100,
        fontSize: 54,
        fontFamily: "system-ui",
        color: "#203555",
        align: "center",
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        zIndex:
          Math.max(0, ...state.scene.elements.map((item) => item.zIndex)) + 1,
        locked: false,
      },
    });
    setTextValue("");
    setSheet(null);
  };
  async function finish() {
    const stage = stageRef.current;
    if (!stage || isSaving) return;
    if (photoCount < 1) {
      setError("완성하려면 사진을 1장 이상 추가해 주세요.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const canvas = stage.toCanvas({ pixelRatio: 2 });
      const image = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) =>
            blob
              ? resolve(blob)
              : reject(new Error("이미지를 만들지 못했어요.")),
          "image/png",
        ),
      );
      const saved = await saveDiaryDecoration({
        recordId,
        sceneVersion: state.scene.version,
        sceneData: state.scene,
        renderedImage: image,
      });
      clearDecorationDraft(recordId);
      onComplete(saved.imageUrl);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "저장하지 못했어요. 다시 시도해 주세요.",
      );
      setIsSaving(false);
    }
  }
  const beginPinch = (event: { evt: TouchEvent }) => {
    const touches = event.evt.touches;
    if (!selected || touches.length !== 2) return;
    const [a, b] = [touches[0], touches[1]];
    pinchRef.current = {
      distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
      angle: Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX),
      scaleX: selected.scaleX,
      scaleY: selected.scaleY,
      rotation: selected.rotation,
    };
  };
  const movePinch = (event: { evt: TouchEvent }) => {
    const start = pinchRef.current;
    const touches = event.evt.touches;
    if (!selected || !start || touches.length !== 2) return;
    event.evt.preventDefault();
    const [a, b] = [touches[0], touches[1]];
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const angle = Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX);
    const ratio = distance / start.distance;
    dispatch({
      type: "update",
      id: selected.id,
      patch: {
        scaleX: start.scaleX * ratio,
        scaleY: start.scaleY * ratio,
        rotation: start.rotation + ((angle - start.angle) * 180) / Math.PI,
      },
    });
  };
  const chooseReplacementPhoto = () => {
    replaceInputRef.current?.click();
  };
  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const remaining = Math.max(0, 4 - photoCount);
    Array.from(files)
      .slice(0, remaining)
      .filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type))
      .forEach((file, index) =>
        dispatch({
          type: "add",
          element: {
            id: createId(),
            type: "photo",
            sourceUrl: URL.createObjectURL(file),
            originalWidth: 1,
            originalHeight: 1,
            x: 150 + index * 55,
            y: 260 + index * 55,
            width: 720,
            height: 840,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            zIndex: Math.max(0, ...state.scene.elements.map((item) => item.zIndex)) + index + 1,
            locked: false,
          },
        }),
      );
  };
  return (
    <main className="diary-editor">
      <header className="diary-editor__header">
        <button onClick={onCancel}>취소</button>
        <strong>꾸미기</strong>
        <button
          disabled={isSaving}
          onClick={() =>
            editingDecorations
              ? setConfirming(true)
              : (dispatch({ type: "select", id: null }),
                setEditingDecorations(true))
          }
        >
          {editingDecorations ? "저장" : "다음"}
        </button>
      </header>
      <div className="diary-editor__photo-count">
        사진 {photoCount}/4 · 최소 1장, 최대 4장
      </div>
      <input
        ref={addPhotoInputRef}
        className="record-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(event) => {
          addPhotos(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={replaceInputRef}
        className="record-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file && selected?.type === "photo")
            updateSelected({ sourceUrl: URL.createObjectURL(file) });
          event.target.value = "";
        }}
      />
      <div
        className={`diary-editor__canvas${photoCount === 0 ? " is-empty" : ""}`}
        ref={hostRef}
      >
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={DIARY_CANVAS.height * scale}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={(event) => {
            if (event.target === event.target.getStage())
              dispatch({ type: "select", id: null });
          }}
          onTouchStart={(event) => {
            if (event.target === event.target.getStage())
              dispatch({ type: "select", id: null });
            beginPinch(event);
          }}
          onTouchMove={movePinch}
          onTouchEnd={() => {
            pinchRef.current = null;
          }}
        >
          <Layer>
            <Rect
              width={DIARY_CANVAS.width}
              height={DIARY_CANVAS.height}
              fill={state.scene.canvas.background}
            />
            {sorted.map((element) =>
              element.type === "text" ? (
                <CanvasText
                  key={element.id}
                  element={element}
                  onSelect={() => dispatch({ type: "select", id: element.id })}
                  onChange={(patch) =>
                    dispatch({ type: "update", id: element.id, patch })
                  }
                />
              ) : (
                <CanvasImage
                  key={element.id}
                  element={element}
                  onSelect={() => dispatch({ type: "select", id: element.id })}
                  onChange={(patch) =>
                    dispatch({ type: "update", id: element.id, patch })
                  }
                />
              ),
            )}
            <Transformer
              ref={transformerRef}
              rotateEnabled
              keepRatio
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
              boundBoxFunc={(oldBox, newBox) =>
                Math.abs(newBox.width) < 48 || Math.abs(newBox.height) < 48
                  ? oldBox
                  : newBox
              }
            />
          </Layer>
        </Stage>
      </div>
      <div className="diary-editor__toolbar">
        {selected ? (
          <>
            {selected.type !== "photo" ? (
              <button
                onClick={() => dispatch({ type: "duplicate", id: selected.id })}
              >
                복제
              </button>
            ) : null}
            {selected.type === "photo" ? (
              <>
                <button onClick={chooseReplacementPhoto}>교체</button>
                <button disabled>자르기</button>
                <button
                  onClick={() =>
                    updateSelected({ rotation: selected.rotation + 90 })
                  }
                >
                  회전
                </button>
              </>
            ) : null}
            {selected.type === "sticker" ? (
              <button
                onClick={() => updateSelected({ scaleX: -selected.scaleX })}
              >
                좌우 반전
              </button>
            ) : null}
            <button
              onClick={() =>
                dispatch({
                  type: "reorder",
                  id: selected.id,
                  direction: "front",
                })
              }
            >
              앞으로
            </button>
            <button
              onClick={() =>
                dispatch({
                  type: "reorder",
                  id: selected.id,
                  direction: "back",
                })
              }
            >
              뒤로
            </button>
            <button
              className="is-danger"
              onClick={() => dispatch({ type: "remove", id: selected.id })}
            >
              삭제
            </button>
          </>
        ) : (
          <>
            <button disabled={photoCount >= 4} onClick={() => addPhotoInputRef.current?.click()}>
              사진
            </button>
            {editingDecorations ? (
              <>
                <button onClick={() => setSheet("sticker")}>스티커</button>
                <button onClick={() => setSheet("text")}>텍스트</button>
                <button onClick={() => setSheet("background")}>배경</button>
              </>
            ) : (
              <span className="diary-editor__hint">
                사진 배치가 끝나면 상단 다음을 눌러 꾸며 보세요.
              </span>
            )}
          </>
        )}
      </div>
      {error ? <div className="diary-editor__notice">{error}</div> : null}
      {sheet === "sticker" ? (
        <div className="diary-editor__sheet">
          <BottomSheet className="diary-editor__sticker-sheet">
            <div className="diary-editor__sheet-intro">
              <h2>내 스티커</h2>
              <p>스티커팩을 고른 뒤 원하는 스티커를 추가해 보세요.</p>
            </div>
            <div className="diary-editor__pack-tabs" role="tablist" aria-label="보유 스티커팩">
              {stickerPacks.map((pack) => (
                <button
                  key={pack}
                  type="button"
                  role="tab"
                  aria-selected={selectedStickerPack === pack}
                  className={selectedStickerPack === pack ? "is-active" : ""}
                  onClick={() => setSelectedStickerPack(pack)}
                >
                  {pack}
                </button>
              ))}
            </div>
            <div className="diary-editor__pack-meta">
              <strong>{selectedStickerPack}</strong>
              <span>{visibleStickerAssets.length}개 보유</span>
            </div>
            <div className="diary-editor__assets-scroll">
              <div className={`diary-editor__assets ${selectedStickerPack === "말랑 테이프" ? "is-tape-pack" : ""}`}>
                {visibleStickerAssets.map((asset) => (
                  <button key={asset.id} onClick={() => addSticker(asset.id)}>
                    <img src={asset.src} alt={asset.label} />
                    <span>{asset.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="diary-editor__sheet-actions">
              <Button variant="blue" onClick={() => setSheet(null)}>
                확인
              </Button>
              <Button variant="outline" onClick={() => setSheet(null)}>
                닫기
              </Button>
            </div>
          </BottomSheet>
        </div>
      ) : null}
      {sheet === "text" ? (
        <div className="diary-editor__sheet">
          <BottomSheet>
            <h2>텍스트 추가</h2>
            <input
              autoFocus
              value={textValue}
              maxLength={80}
              onChange={(event) => setTextValue(event.target.value)}
              placeholder="캔버스에 남길 문구"
            />
            <Button variant="blue" onClick={addText}>
              추가
            </Button>
            <Button variant="outline" onClick={() => setSheet(null)}>
              닫기
            </Button>
          </BottomSheet>
        </div>
      ) : null}
      {sheet === "background" ? (
        <div className="diary-editor__sheet">
          <BottomSheet>
            <h2>배경 색상</h2>
            <div className="diary-editor__backgrounds">
              {["#fff8f1", "#fbe2ed", "#dff2ea", "#e6ebfa", "#fff"].map(
                (color) => (
                  <button
                    key={color}
                    style={{ background: color }}
                    aria-label={`${color} 배경`}
                    onClick={() => dispatch({ type: "set-background", color })}
                  />
                ),
              )}
            </div>
            <Button variant="blue" onClick={() => setSheet(null)}>
              확인
            </Button>
            <Button variant="outline" onClick={() => setSheet(null)}>
              닫기
            </Button>
          </BottomSheet>
        </div>
      ) : null}
      {confirming ? (
        <div className="diary-editor__sheet">
          <BottomSheet>
            <h2>꾸미기를 완료할까요?</h2>
            <p>현재 배치가 기록에 저장됩니다.</p>
            {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            <Button
              variant="blue"
              disabled={isSaving}
              onClick={() => void finish()}
            >
              {isSaving ? "저장 중…" : completeLabel}
            </Button>
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={() => setConfirming(false)}
            >
              계속 꾸미기
            </Button>
          </BottomSheet>
        </div>
      ) : null}
    </main>
  );
}
