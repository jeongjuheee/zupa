"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BottomSheet, Button, ErrorMessage } from "./ui";
import { DiaryEditorPage } from "./diary-editor/DiaryEditorPage";
import {
  clearRecordDraft,
  loadRecordDraft,
  RECORD_LIMITS,
  saveRecordDraft,
  type DraftPhoto,
  type RecordStep,
} from "../lib/record-draft";

const STEPS: Array<{ id: RecordStep; label: string }> = [
  { id: "write", label: "기록" },
  { id: "decorate", label: "꾸미기" },
];

const WRITING_PROMPTS = [
  "그 순간, 무슨 일이 있었나요?",
  "그때 어떤 감정이 가장 컸나요?",
  "그 감정이 든 이유를 떠올려 볼까요?",
  "몸과 마음에는 어떤 변화가 있었나요?",
];

const PHOTO_TONES: DraftPhoto["tone"][] = ["pink", "mint", "lilac", "peach"];

type CompletedRecord = { body: string; photoCount: number; photoUrls: string[]; decoratedImageUrl?: string };

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function analysisStatus(characters: number) {
  if (characters < 20)
    return "기록을 시작해 보세요. 분석에 필요한 내용을 조금 더 적어 주세요.";
  if (characters < RECORD_LIMITS.minCharactersForAnalysis)
    return "기록은 임시 저장돼요. 마음 분석을 위해 조금 더 자세히 적어 주세요.";
  if (characters < RECORD_LIMITS.recommendedCharacters)
    return "AI 분석이 가능한 기록이에요.";
  return "분석에 필요한 내용이 충분해요.";
}

export function RecordFlow({
  initialStep = "write",
  initialBody = "",
  initialPhotoUrls = [],
  isEditing = false,
  onClose,
  onAnalyze,
}: {
  initialStep?: RecordStep;
  initialBody?: string;
  initialPhotoUrls?: string[];
  isEditing?: boolean;
  onClose: () => void;
  onAnalyze: (record: CompletedRecord) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<RecordStep>(initialStep);
  const [photos, setPhotos] = useState<DraftPhoto[]>(() => initialPhotoUrls.slice(0, RECORD_LIMITS.maxPhotos).map((previewUrl, index) => ({ id: createId(), name: `기존 사진 ${index + 1}`, type: "image/png", size: 0, tone: PHOTO_TONES[index % PHOTO_TONES.length], previewUrl, status: "preview" })));
  const [body, setBody] = useState(initialBody);
  const [promptIndex, setPromptIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const [replacePhotoId, setReplacePhotoId] = useState<string | null>(null);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const availablePhotos = photos.filter((photo) => Boolean(photo.previewUrl));

  useEffect(() => {
    const draft = loadRecordDraft();
    if (draft) {
      // Object URLs are deliberately not persisted. A restored draft therefore
      // cannot safely pretend its old photo files still exist.
      const availablePhotos = draft.photos.filter((photo) => Boolean(photo.previewUrl));
      // Photos are now chosen inside the decoration editor, not before writing.
      setStep(draft.step === "photo" ? "write" : draft.step);
      setPhotos(availablePhotos);
      setBody(draft.body);
      if (!availablePhotos.length && draft.photos.length)
        setNotice("사진 파일은 새로고침 후 다시 선택해 주세요.");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveRecordDraft({ step, photos, body, updatedAt: new Date().toISOString() });
  }, [body, hydrated, photos, step]);

  const hasDraft = photos.length > 0 || body.trim().length > 0;
  useEffect(() => {
    const warnOnUnload = (event: BeforeUnloadEvent) => {
      if (!hasDraft) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnOnUnload);
    return () => window.removeEventListener("beforeunload", warnOnUnload);
  }, [hasDraft]);

  const characterCount = body.length;
  const progress = Math.min(
    100,
    Math.round((characterCount / RECORD_LIMITS.recommendedCharacters) * 100),
  );
  const canWrite = true;
  const canDecorate = characterCount >= RECORD_LIMITS.minCharactersForAnalysis;
  const currentStepIndex = STEPS.findIndex((item) => item.id === step);

  const photoTitle = useMemo(
    () =>
      photos.length
        ? `${photos.length}장의 사진을 골랐어요`
        : "오늘의 사진을 골라 주세요",
    [photos.length],
  );

  function requestPhotoSelection(replaceId?: string) {
    setReplacePhotoId(replaceId ?? null);
    fileInputRef.current?.click();
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const errors: string[] = [];
    const accepted: DraftPhoto[] = [];
    const existing = new Set(photos.map((photo) => `${photo.name}:${photo.size}`));
    const maxNewPhotos = replacePhotoId
      ? 1
      : Math.max(0, RECORD_LIMITS.maxPhotos - photos.length);

    incoming.forEach((file) => {
      const isSupported = RECORD_LIMITS.acceptedMimeTypes.includes(
        file.type as (typeof RECORD_LIMITS.acceptedMimeTypes)[number],
      );
      if (!isSupported) {
        errors.push("JPEG, PNG, WEBP 파일만 추가할 수 있어요.");
        return;
      }
      if (file.size > RECORD_LIMITS.maxFileBytes) {
        errors.push("사진 한 장은 10MB 이하로 선택해 주세요.");
        return;
      }
      if (existing.has(`${file.name}:${file.size}`)) {
        errors.push("같은 사진은 한 번만 추가할 수 있어요.");
        return;
      }
      if (accepted.length >= maxNewPhotos) {
        errors.push("사진은 최대 4장까지 추가할 수 있어요.");
        return;
      }
      accepted.push({
        id: createId(),
        name: file.name,
        type: file.type,
        size: file.size,
        tone: PHOTO_TONES[(photos.length + accepted.length) % PHOTO_TONES.length],
        previewUrl: URL.createObjectURL(file),
        status: "preview",
      });
    });

    if (accepted.length) {
      setPhotos((current) => {
        const withoutReplaced = replacePhotoId
          ? current.filter((photo) => photo.id !== replacePhotoId)
          : current;
        return [...withoutReplaced, ...accepted].slice(0, RECORD_LIMITS.maxPhotos);
      });
    }
    setReplacePhotoId(null);
    setNotice(errors[0] ?? (accepted.length ? "사진을 임시 저장했어요." : ""));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const photo = current.find((item) => item.id === id);
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function movePhoto(index: number, direction: -1 | 1) {
    setPhotos((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function goToStep(nextStep: RecordStep) {
    if (nextStep === "decorate" && !canDecorate) {
      setNotice("마음 분석을 위해 120자 이상 적어 주세요.");
      return;
    }
    setStep(nextStep);
  }

  function leaveFlow() {
    if (hasDraft) {
      setShowLeaveWarning(true);
      return;
    }
    onClose();
  }

  function discardAndClose() {
    photos.forEach((photo) => photo.previewUrl && URL.revokeObjectURL(photo.previewUrl));
    clearRecordDraft();
    onClose();
  }

  if (step === "decorate") {
    return <DiaryEditorPage recordId="draft-decoration" photos={photos.filter((photo) => photo.previewUrl).map((photo) => ({ id: photo.id, sourceUrl: photo.previewUrl!, name: photo.name }))} onCancel={() => setStep("write")} completeLabel={isEditing ? "수정하고 다시 분석하기" : "완료하기"} onComplete={(decoratedImageUrl) => onAnalyze({ body, photoCount: photos.length, photoUrls: [decoratedImageUrl], decoratedImageUrl })} />;
  }

  return (
    <main className="screen record-flow-screen">
      <header className="record-flow-header">
        <button aria-label="뒤로" onClick={leaveFlow}>‹</button>
        <strong>기록</strong>
        <span />
      </header>

      <nav className="record-step-nav" aria-label="기록 단계">
        {STEPS.map((item, index) => {
          const disabled =
            (item.id === "write" && !canWrite) ||
            (item.id === "decorate" && !canDecorate);
          return (
            <button
              key={item.id}
              className={step === item.id ? "is-active" : ""}
              disabled={disabled || index > currentStepIndex + 1}
              onClick={() => goToStep(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {step === "photo" ? (
        <section className="record-step record-photo-step">
          <div className="record-heading">
            <h1>{photoTitle}</h1>
            <p>사진은 1~4장까지 선택할 수 있어요. 다음 꾸미기 화면에서 자동으로 배치돼요.</p>
          </div>
          <input
            ref={fileInputRef}
            className="record-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={!replacePhotoId}
            onChange={(event) => addFiles(event.target.files)}
          />
          <div className="record-photo-grid" aria-label="선택한 사진">
            {photos.map((photo, index) => (
              <article key={photo.id} className={`record-photo-card is-${photo.tone}`}>
                {photo.previewUrl ? <img src={photo.previewUrl} alt={`${index + 1}번째 선택 사진`} /> : <span>{photo.name}</span>}
                <small>{index + 1}</small>
                <div className="record-photo-card__actions">
                  <button aria-label={`${index + 1}번째 사진 앞으로 이동`} disabled={index === 0} onClick={() => movePhoto(index, -1)}>‹</button>
                  <button aria-label={`${index + 1}번째 사진 뒤로 이동`} disabled={index === photos.length - 1} onClick={() => movePhoto(index, 1)}>›</button>
                  <button aria-label={`${index + 1}번째 사진 교체`} onClick={() => requestPhotoSelection(photo.id)}>교체</button>
                  <button aria-label={`${index + 1}번째 사진 삭제`} onClick={() => removePhoto(photo.id)}>삭제</button>
                </div>
              </article>
            ))}
            {photos.length < RECORD_LIMITS.maxPhotos ? (
              <button className="record-photo-add" onClick={() => requestPhotoSelection()}>
                <b>＋</b><span>사진 추가</span>
              </button>
            ) : null}
          </div>
          <p className="record-photo-count">{photos.length}/4장 선택 · JPEG, PNG, WEBP · 사진 한 장당 최대 10MB</p>
          {notice ? <ErrorMessage>{notice}</ErrorMessage> : null}
          <div className="record-bottom-action">
            <Button variant="blue" disabled={!canWrite} onClick={() => goToStep("write")}>
              {canWrite ? "다음" : "사진을 선택해 주세요"}
            </Button>
          </div>
        </section>
      ) : null}

      {step === "write" ? (
        <section className="record-step record-write-step">
          <div className="record-heading">
            <h1>오늘의 마음을 적어주세요</h1>
          </div>
          <button className="record-prompt-card" onClick={() => setPromptIndex((index) => (index + 1) % WRITING_PROMPTS.length)}>
            <span>✦</span>{WRITING_PROMPTS[promptIndex]}<b>다른 질문</b>
          </button>
          <textarea
            className="record-textarea"
            value={body}
            maxLength={RECORD_LIMITS.maxCharacters}
            onChange={(event) => setBody(event.target.value)}
            placeholder="오늘 있었던 일과 그때의 마음을 편하게 적어 보세요. 어떤 일이 있었고, 그때 어떤 생각과 기분이 들었는지 함께 남겨 주세요."
          />
          <div className="record-character-row"><span>{characterCount}/1,000</span><b>{characterCount >= 120 ? "분석 가능" : "분석 준비 중"}</b></div>
          <section className="record-readiness" aria-label="분석 준비도">
            <div><strong>분석 준비도</strong><span>{analysisStatus(characterCount)}</span></div>
            <i><b style={{ width: `${progress}%` }} /></i>
            <small>{characterCount < 120 ? `120자까지 ${120 - characterCount}자 더 적어 주세요.` : "분석에 필요한 최소 조건을 충족했어요."}</small>
          </section>
          {notice ? <ErrorMessage>{notice}</ErrorMessage> : null}
          <div className="record-bottom-action">
            <Button variant="blue" disabled={!canDecorate} onClick={() => goToStep("decorate")}>다음</Button>
          </div>
        </section>
      ) : null}


      {showLeaveWarning ? (
        <div className="record-unsaved-modal" role="dialog" aria-modal="true" aria-labelledby="record-leave-title">
          <BottomSheet>
            <span className="record-sheet-handle" />
            <h2 id="record-leave-title">작성 중인 기록이 있어요</h2>
            <p>지금 나가면 임시 저장된 내용을 다시 이어서 쓸 수 있어요.</p>
            <Button variant="blue" onClick={() => setShowLeaveWarning(false)}>기록 계속하기</Button>
            <Button variant="outline" onClick={discardAndClose}>변경 내용 버리기</Button>
          </BottomSheet>
        </div>
      ) : null}
    </main>
  );
}
