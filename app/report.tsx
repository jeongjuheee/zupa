"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AppHeader, BottomSheet, Button, LoadingIndicator } from "./ui";
import type { ShareFormat } from "../lib/report-image-export";
import type { MetaSensingReportContent } from "../lib/metasensing/types";
import { FrequencyCharacter } from "./frequency-character";
import { hasFrequencyBgm, pickFrequencyBgm } from "../lib/frequency-bgm";

export type ReportViewData = {
  typeId: number;
  date: string;
  typeName: string;
  hz: number;
  keywords: string[];
  summary: string;
  timeline: Record<string, number>;
  photoUrls?: string[];
  fill?: string;
  ink?: string;
  visual?: {
    amplitude: number;
    speed: number;
    spacing: number;
    glow: number;
    direction: "inward" | "outward" | "steady" | "shifting";
  };
  content?: MetaSensingReportContent;
};

const levelLabel = { low: "낮음", medium: "보통", high: "높음" } as const;

export function ReportHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: { label: string; onClick: () => void } }) {
  return <div className="report-header"><AppHeader title={title} onBack={onBack} />{action ? <button onClick={action.onClick}>{action.label}</button> : null}</div>;
}

export function ReportSummaryCard({ report }: { report: ReportViewData }) {
  return (
    <section className="report-summary-card report-diary-collage">
      <div className="report-photo-stack" aria-label="오늘 기록 사진 미리보기">
        {report.photoUrls?.length
          ? report.photoUrls.slice(0, 3).map((url, index) => <img key={url} src={url} alt={`오늘 기록 사진 ${index + 1}`} />)
          : <><i /><i /><i /></>}
        <span>soft day</span>
      </div>
      <div className="report-summary-copy">
        <span>{report.date}</span>
        <b>오늘의 기록 요약</b>
        <p>{report.content?.recordSummary ?? report.summary}</p>
      </div>
    </section>
  );
}

export function FrequencyCard({ report }: { report: ReportViewData }) {
  return (
    <section className="frequency-card" style={{ "--report-fill": report.fill ?? "#FF9ED8", "--report-ink": report.ink ?? "#C93E9E" } as CSSProperties}>
      <span className="frequency-orb" aria-hidden="true">〰</span>
      <div>
        <strong>{report.hz} Hz</strong><b>{report.typeName} · {report.content?.direction.flow === "stay" ? "머무름" : report.content?.direction.flow === "entry" ? "진입" : report.content?.direction.flow === "amplify" ? "증폭" : "전환"}</b>
        <p>{report.content?.frequencyInterpretation ?? "기록 속 표현을 바탕으로 만든 오늘의 주파수예요."}</p>
        <span className="frequency-keywords">{(report.content?.keywords ?? report.keywords).slice(0, 3).join(" · ")}</span>
        <FrequencyBgmControl typeId={report.typeId} />
      </div>
    </section>
  );
}

function FrequencyBgmControl({ typeId }: { typeId: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const hasTrack = hasFrequencyBgm(typeId);

  useEffect(() => () => audioRef.current?.pause(), []);

  if (!hasTrack) return null;

  async function toggleBgm() {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    const source = pickFrequencyBgm(typeId);
    if (!source) return;
    const audio = new Audio(source);
    audio.volume = 0.55;
    audio.loop = true;
    audio.onerror = () => {
      setIsPlaying(false);
      setError("BGM을 재생하지 못했어요.");
    };
    audioRef.current = audio;
    try {
      await audio.play();
      setError("");
      setIsPlaying(true);
    } catch {
      setError("BGM을 재생하지 못했어요.");
    }
  }

  return (
    <span className="frequency-bgm">
      <button
        type="button"
        className={isPlaying ? "is-playing" : ""}
        aria-pressed={isPlaying}
        onClick={() => void toggleBgm()}
      >
        <span className="frequency-bgm__note" aria-hidden="true">♪</span>
        <span>{isPlaying ? "오늘의 BGM 재생 중" : "오늘의 BGM 듣기"}</span>
      </button>
      {error ? <small>{error}</small> : null}
    </span>
  );
}

export function EmotionChart({ report }: { report: ReportViewData }) {
  return (
    <section className="emotion-chart frequency-character-report">
      <div className="emotion-chart__title"><b>오늘의 메타센싱 파동</b><small>기록 속 감정의 강도와 흐름</small></div>
      <FrequencyCharacter typeId={Math.min(16, Math.max(1, report.typeId)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16} variant="report" resultHz={report.hz} />
    </section>
  );
}

export function ReportAccordion({ report }: { report: ReportViewData }) {
  const [open, setOpen] = useState("오늘 마음의 신호");
  const content = report.content;
  const rows = [
    { title: "오늘 마음의 신호", body: content?.mainSignal.body ?? [report.summary], expressions: content?.mainSignal.detectedExpressions },
    { title: "오늘의 에너지", body: content?.energy.summary ?? [`오늘의 주파수는 ${report.hz}Hz예요. ${report.typeName}의 흐름으로 정리했어요.`], metrics: content?.energy },
    { title: "마음의 방향", body: content?.direction.summary ?? ["오늘 기록 속에 반복해서 나타난 마음의 흐름을 정리했어요."] },
    ...(content?.emotionFlow ? [{ title: "감정의 흐름", body: content.emotionFlow.summary }] : []),
    { title: "내일을 위한 한 줄", body: [content?.tomorrowMessage ?? "오늘 기록에서 가장 기억하고 싶은 마음을 한 줄로 남겨 보세요."] },
  ];
  return (
    <div className="report-accordion">
      {rows.map(({ title, body, expressions, metrics }) => (
        <section key={title} className={open === title ? "is-open" : ""}>
          <button onClick={() => setOpen(open === title ? "" : title)}><b>{title}</b><span>{open === title ? "⌃" : "⌄"}</span></button>
          {open === title ? <div className="report-accordion__body">{body.map((line) => <p key={line}>{line}</p>)}{expressions?.length ? <div className="detected-expressions"><small>감지된 표현</small><span>{expressions.join(" · ")}</span></div> : null}{metrics ? <div className="energy-metrics"><span>에너지 활성도 <b>{levelLabel[metrics.level]}</b></span><span>감정 지속성 <b>{levelLabel[metrics.persistence]}</b></span><span>변화폭 <b>{levelLabel[metrics.variability]}</b></span></div> : null}</div> : null}
        </section>
      ))}
      {content?.analysisBasis && content.analysisBasis.informationScore < 4 ? <p className="report-recording-guide">다음 기록에서는 감정이 달라진 순간과 그 계기를 함께 적으면 흐름을 더 구체적으로 확인할 수 있어요.</p> : null}
    </div>
  );
}

export function ReportEditor({ value, onChange, onSave, onCancel, isSaving }: { value: string; onChange: (value: string) => void; onSave: () => void; onCancel: () => void; isSaving: boolean }) {
  return <section className="report-editor"><h1>오늘 마음의 신호</h1><p>기록을 바탕으로 정리한 문장을 직접 고칠 수 있어요.</p><textarea value={value} maxLength={500} onChange={(event) => onChange(event.target.value)} /><small>{value.length} / 500</small><div className="report-editor-actions"><Button className="report-cta" variant="blue" disabled={isSaving} onClick={onSave}>{isSaving ? "저장 중…" : "저장"}</Button><Button className="report-cta" variant="outline" disabled={isSaving} onClick={onCancel}>취소</Button></div></section>;
}

export function UnsavedChangesModal({ onKeepEditing, onDiscard }: { onKeepEditing: () => void; onDiscard: () => void }) {
  return <div className="report-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="unsaved-title"><BottomSheet><span className="ds-sheet-handle" /><h2 id="unsaved-title">저장하지 않은 리포트가 있어요</h2><p>편집으로 돌아가면 현재 수정 내용을 유지해요. 변경 내용 버리기를 선택하면 마지막 저장 상태로 돌아가요.</p><Button className="report-cta" variant="blue" onClick={onKeepEditing}>편집으로 돌아가기</Button><Button className="report-cta" variant="outline" onClick={onDiscard}>변경 내용 버리기</Button></BottomSheet></div>;
}

export function ShareFormatCard({ format, active, onSelect }: { format: ShareFormat; active: boolean; onSelect: () => void }) {
  const isReport = format === "report-card";
  return <button className={`share-format-card ${active ? "is-active" : ""} is-${format}`} onClick={onSelect}><span className="share-format-card__preview"><i /><i /><i /></span><b>{isReport ? "리포트 카드" : "다꾸 이미지"}</b><small>{isReport ? "핵심 리포트를 담아요" : "기록을 다꾸처럼 남겨요"}</small></button>;
}

export function SharePreview({ report, format }: { report: ReportViewData; format: ShareFormat }) {
  const diaryImage = format === "diary-card" ? report.photoUrls?.[0] : undefined;
  if (diaryImage) {
    return <section className={`share-preview is-${format} has-diary-image`} aria-label="다꾸 이미지 미리보기"><img className="share-preview__diary-image" src={diaryImage} alt="내가 만든 다꾸 이미지" /><span className="share-preview__diary-caption">내가 만든 다꾸 이미지</span></section>;
  }
  return <section className={`share-preview is-${format}`} aria-label="공유 이미지 미리보기"><b>Zupa</b><small>{report.date}</small><strong>{report.typeName} · {report.hz} Hz</strong><FrequencyCharacter typeId={Math.min(16, Math.max(1, report.typeId)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16} variant="card" resultHz={report.hz} /><p>{report.summary}</p><span>{report.keywords.join(" · ")}</span></section>;
}

export function SaveGuideBottomSheet({ onClose }: { onClose: () => void }) {
  return <div className="report-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="save-guide-title"><BottomSheet><span className="ds-sheet-handle" /><h2 id="save-guide-title">이미지를 홈 화면에 두세요</h2><p>공유 기능을 지원하지 않는 환경에서는 이미지를 저장한 뒤 홈 화면에서 확인할 수 있어요.</p><ol><li>브라우저 공유 메뉴를 열어 주세요.</li><li>이미지를 저장하거나 홈 화면에 추가해 주세요.</li><li>저장된 이미지는 앨범에서 확인할 수 있어요.</li></ol><Button className="report-cta" variant="blue" onClick={onClose}>확인했어요</Button></BottomSheet></div>;
}

export function ShareRecordCard({ report }: { report: ReportViewData }) {
  return <section className="share-record-card"><div className="share-record-card__photo" /><h1>오늘의 마음을 기록해 주세요</h1><p>지금의 마음을 조금 더 천천히 남겨 볼 수 있어요.</p><div><b>{report.typeName} {report.hz} Hz</b><span>{report.summary}</span></div></section>;
}

export function ReportLoadingState() { return <div className="report-loading-state"><LoadingIndicator label="오늘의 리포트를 불러오는 중이에요" /></div>; }
