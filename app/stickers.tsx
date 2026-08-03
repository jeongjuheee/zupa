"use client";

import { useRef, useState, type ReactNode } from "react";

export type StickerAsset = {
  id: string;
  label: string;
  src: string;
  pack: "Pastel Mood Pack" | "Fruit Characters Vol.1" | "말랑 테이프";
  /** Source artwork dimensions preserve the intended sticker aspect ratio. */
  width?: number;
  height?: number;
};

export type PlacedSticker = {
  id: string;
  assetId?: string;
  x: number;
  y: number;
  z: number;
  scale?: number;
  rotation?: number;
  text?: string;
};

export type PlacedPhoto = {
  id: string;
  src: string;
  alt: string;
  tone: string;
  x: number;
  y: number;
  z: number;
  scale?: number;
};

export const STICKER_ASSETS: StickerAsset[] = [
  { id: "pastel-lucky", label: "럭키한 하루", src: "/assets/stickers/free_pastel_mood_vol1/svgs/01_lucky_day.svg", pack: "Pastel Mood Pack" },
  { id: "pastel-candy", label: "사당행", src: "/assets/stickers/free_pastel_mood_vol1/svgs/02_sadang_haeng.svg", pack: "Pastel Mood Pack" },
  { id: "pastel-surprise", label: "경악스런 하루", src: "/assets/stickers/free_pastel_mood_vol1/svgs/03_shocking_day.svg", pack: "Pastel Mood Pack" },
  { id: "pastel-behind", label: "오늘의 비하인드", src: "/assets/stickers/free_pastel_mood_vol1/svgs/04_behind_today.svg", pack: "Pastel Mood Pack" },
  { id: "pastel-wow", label: "이건 못참지", src: "/assets/stickers/free_pastel_mood_vol1/svgs/05_cant_resist.svg", pack: "Pastel Mood Pack" },
  { id: "pastel-hot", label: "너무 더워", src: "/assets/stickers/free_pastel_mood_vol1/svgs/06_so_hot.svg", pack: "Pastel Mood Pack" },
  { id: "pastel-success", label: "오늘도 성공", src: "/assets/stickers/free_pastel_mood_vol1/svgs/07_success_today.svg", pack: "Pastel Mood Pack" },
  { id: "pastel-max", label: "행복 MAX", src: "/assets/stickers/free_pastel_mood_vol1/svgs/08_happy_max.svg", pack: "Pastel Mood Pack" },
  { id: "pastel-positive", label: "미쳤다..(Positive)", src: "/assets/stickers/free_pastel_mood_vol1/svgs/09_michyeossda_positive.svg", pack: "Pastel Mood Pack" },
  { id: "pastel-cute", label: "귀엽다...ㅋ", src: "/assets/stickers/free_pastel_mood_vol1/svgs/10_cute_kkk.svg", pack: "Pastel Mood Pack" },
  { id: "pastel-nice", label: "완.내.스", src: "/assets/stickers/free_pastel_mood_vol1/svgs/11_wannaes.svg", pack: "Pastel Mood Pack" },
  { id: "fruit-peach", label: "복숭아", src: "/assets/stickers/fruit_characters_vol1/svgs/01_peach.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-apple", label: "사과", src: "/assets/stickers/fruit_characters_vol1/svgs/02_apple.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-banana", label: "바나나", src: "/assets/stickers/fruit_characters_vol1/svgs/03_banana.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-blueberry", label: "블루베리", src: "/assets/stickers/fruit_characters_vol1/svgs/04_blueberry.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-mango", label: "망고", src: "/assets/stickers/fruit_characters_vol1/svgs/05_mango.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-strawberry", label: "딸기", src: "/assets/stickers/fruit_characters_vol1/svgs/06_strawberry.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-pineapple", label: "파인애플", src: "/assets/stickers/fruit_characters_vol1/svgs/07_pineapple.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-grape", label: "포도", src: "/assets/stickers/fruit_characters_vol1/svgs/08_grape.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-apricot", label: "살구", src: "/assets/stickers/fruit_characters_vol1/svgs/09_apricot.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-raspberry", label: "라즈베리", src: "/assets/stickers/fruit_characters_vol1/svgs/10_raspberry.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-watermelon", label: "수박", src: "/assets/stickers/fruit_characters_vol1/svgs/11_watermelon.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-kiwi", label: "키위", src: "/assets/stickers/fruit_characters_vol1/svgs/12_kiwi.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-lemon", label: "레몬", src: "/assets/stickers/fruit_characters_vol1/svgs/13_lemon.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-pear", label: "배", src: "/assets/stickers/fruit_characters_vol1/svgs/14_pear.svg", pack: "Fruit Characters Vol.1" },
  { id: "fruit-pomegranate", label: "석류", src: "/assets/stickers/fruit_characters_vol1/svgs/15_pomegranate.svg", pack: "Fruit Characters Vol.1" },
  // Free pack · 말랑 테이프 (transparent SVG source assets)
  { id: "soft-tape-01", label: "블루 체크", src: "/assets/stickers/soft-tape/svgs/soft-tape-01-blue-check.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-02", label: "코랄 스트라이프", src: "/assets/stickers/soft-tape/svgs/soft-tape-02-coral-stripe.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-03", label: "핑크 크링클", src: "/assets/stickers/soft-tape/svgs/soft-tape-03-pink-crinkle.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-04", label: "크림 페이퍼", src: "/assets/stickers/soft-tape/svgs/soft-tape-04-cream-paper.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-05", label: "틸 찢김", src: "/assets/stickers/soft-tape/svgs/soft-tape-05-teal-torn.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-06", label: "베리 패턴", src: "/assets/stickers/soft-tape/svgs/soft-tape-06-berry-pattern.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-07", label: "핑크 하트", src: "/assets/stickers/soft-tape/svgs/soft-tape-07-pink-heart.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-08", label: "라임 그리드", src: "/assets/stickers/soft-tape/svgs/soft-tape-08-lime-grid.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-09", label: "아이보리 사선", src: "/assets/stickers/soft-tape/svgs/soft-tape-09-ivory-diagonal.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-10", label: "옐로 도트", src: "/assets/stickers/soft-tape/svgs/soft-tape-10-yellow-dot.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-11", label: "코랄 페이퍼", src: "/assets/stickers/soft-tape/svgs/soft-tape-11-coral-paper.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-12", label: "민트 크링클", src: "/assets/stickers/soft-tape/svgs/soft-tape-12-mint-crinkle.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-13", label: "핑크 도트", src: "/assets/stickers/soft-tape/svgs/soft-tape-13-pink-dot.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-14", label: "빈티지 체크", src: "/assets/stickers/soft-tape/svgs/soft-tape-14-vintage-check.svg", pack: "말랑 테이프", width: 900, height: 220 },
  { id: "soft-tape-15", label: "투데이 크라프트", src: "/assets/stickers/soft-tape/svgs/soft-tape-15-today-kraft.svg", pack: "말랑 테이프", width: 900, height: 220 },
];

export function StickerPreview({ assetId }: { assetId: string }) {
  const asset = STICKER_ASSETS.find((item) => item.id === assetId);
  if (!asset) return null;
  return (
    <img
      className="sticker-preview"
      src={asset.src}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

export function StickerPalette({
  onAdd,
}: {
  onAdd: (assetId: string) => void;
}) {
  const packs = ["Pastel Mood Pack", "Fruit Characters Vol.1", "말랑 테이프"] as const;
  return (
    <div className="sticker-palette" aria-label="스티커 선택">
      {packs.map((pack) => (
        <section className="sticker-palette__pack" key={pack}>
          <b>무료 · {pack}</b>
          <div className="sticker-palette__grid">
            {STICKER_ASSETS.filter((asset) => asset.pack === pack).map((asset) => (
              <button
                key={asset.id}
                onClick={() => onAdd(asset.id)}
                aria-label={`${asset.label} 스티커 추가`}
              >
                <StickerPreview assetId={asset.id} />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function StickerCanvas({
  stickers,
  onChange,
  background,
  photos = [],
  onPhotosChange,
}: {
  stickers: PlacedSticker[];
  onChange: (stickers: PlacedSticker[]) => void;
  background?: ReactNode;
  photos?: PlacedPhoto[];
  onPhotosChange?: (photos: PlacedPhoto[]) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const movePhoto = (id: string, clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !onPhotosChange) return;
    const x = Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
    const highest = Math.max(0, ...stickers.map((item) => item.z), ...photos.map((item) => item.z));
    onPhotosChange(photos.map((item) => item.id === id ? { ...item, x, y, z: highest + 1 } : item));
  };

  const resizePhoto = (id: string, delta: number) => {
    if (!onPhotosChange) return;
    onPhotosChange(photos.map((item) => item.id === id ? { ...item, scale: Math.max(0.55, Math.min(1.8, (item.scale ?? 1) + delta)) } : item));
  };

  const moveSticker = (id: string, clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
    const y = Math.max(
      0,
      Math.min(100, ((clientY - rect.top) / rect.height) * 100),
    );
    const highest = Math.max(0, ...stickers.map((item) => item.z));
    onChange(
      stickers.map((item) =>
        item.id === id ? { ...item, x, y, z: highest + 1 } : item,
      ),
    );
  };

  const removeSelected = () =>
    onChange(stickers.filter((item) => item.id !== selectedId));
  const duplicateSelected = () => {
    const source = stickers.find((item) => item.id === selectedId);
    if (!source) return;
    const copy = {
      ...source,
      id: crypto.randomUUID(),
      x: Math.min(92, source.x + 9),
      y: Math.min(92, source.y + 9),
      z: Math.max(...stickers.map((item) => item.z)) + 1,
    };
    onChange([...stickers, copy]);
    setSelectedId(copy.id);
  };

  return (
    <div className="sticker-canvas-wrap">
      <div className="sticker-canvas" ref={canvasRef}>
        {background ? <div className="sticker-canvas__background">{background}</div> : null}
        {photos.map((photo) => (
          <div key={photo.id} className={`placed-photo is-${photo.tone} ${selectedId === photo.id ? "is-selected" : ""}`} style={{ left: `${photo.x}%`, top: `${photo.y}%`, zIndex: photo.z, transform: `translate(-50%, -50%) scale(${photo.scale ?? 1})` }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setSelectedId(photo.id); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) movePhoto(photo.id, event.clientX, event.clientY); }} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}>
            <img src={photo.src} alt={photo.alt} draggable={false} />
            {selectedId === photo.id ? <div className="placed-photo__controls" onPointerDown={(event) => event.stopPropagation()}><button type="button" aria-label="사진 작게" onClick={() => resizePhoto(photo.id, -0.15)}>−</button><button type="button" aria-label="사진 크게" onClick={() => resizePhoto(photo.id, 0.15)}>＋</button></div> : null}
          </div>
        ))}
        {stickers.map((sticker) => (
          <button
            key={sticker.id}
            className={`placed-sticker ${selectedId === sticker.id ? "is-selected" : ""}`}
            style={{
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              zIndex: sticker.z,
              transform: `translate(-50%, -50%) scale(${sticker.scale ?? 1}) rotate(${sticker.rotation ?? 0}deg)`,
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setSelectedId(sticker.id);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                moveSticker(sticker.id, event.clientX, event.clientY);
            }}
            onPointerUp={(event) =>
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
            aria-label="배치한 스티커 이동"
          >
            {sticker.text ? (
              <span className="placed-sticker__text">{sticker.text}</span>
            ) : sticker.assetId ? (
              <StickerPreview assetId={sticker.assetId} />
            ) : null}
          </button>
        ))}
      </div>
      {selectedId ? (
        <div className="sticker-actions">
          <button onClick={duplicateSelected}>복제</button>
          <button onClick={removeSelected}>삭제</button>
        </div>
      ) : null}
    </div>
  );
}
