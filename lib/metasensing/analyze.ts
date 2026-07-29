import type { AnalysisResult } from "../ai/types";
import {
  ENTRY_WORDS,
  FLOW_DIRECTION,
  FLOW_LABELS,
  INTENSITY_MODIFIERS,
  PHRASE_RULES,
  PERSISTENCE_WORDS,
  RECOVERY_WORDS,
  STATE_KEYWORDS,
  STATE_LABELS,
  TRANSITION_WORDS,
  TYPE_DEFINITIONS,
} from "./data";
import { createEvidenceGroundedReportContent } from "./report-content";
import type { Evidence, MetaFlow, MetaSensingReportContent, MetaSensingResult, MetaState } from "./types";

const BASE_STATES = Object.keys(STATE_KEYWORDS) as Array<Exclude<MetaState, "mixed">>;
const NEGATION_PATTERN = /(않|안 |못 |없|아니|않았|않았어|않아요|않다)/;

function normalizeText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

function hash(value: string) {
  return Array.from(value).reduce((result, character) => ((result * 31) + character.charCodeAt(0)) >>> 0, 17);
}

function countOccurrences(text: string, phrase: string) {
  let count = 0;
  let from = 0;
  while (true) {
    const index = text.indexOf(phrase, from);
    if (index === -1) return count;
    count += 1;
    from = index + phrase.length;
  }
}

function isNegated(sentence: string, index: number, phrase: string) {
  const around = sentence.slice(Math.max(0, index - 8), Math.min(sentence.length, index + phrase.length + 12));
  return NEGATION_PATTERN.test(around);
}

function intensityMultiplier(sentence: string, index: number) {
  const around = sentence.slice(Math.max(0, index - 12), index + 12);
  return INTENSITY_MODIFIERS.find((modifier) => around.includes(modifier.word))?.multiplier ?? 1;
}

function selectType(state: MetaState, flow: MetaFlow) {
  return TYPE_DEFINITIONS.find((type) => type.states.includes(state) && type.flow === flow)
    ?? TYPE_DEFINITIONS.find((type) => type.states.includes(state))
    ?? TYPE_DEFINITIONS[9];
}

function createSummary(
  state: MetaState,
  secondary: MetaState | null,
  flow: MetaFlow,
  keywords: string[],
  confidence: "low" | "medium" | "high",
) {
  const stateLabel = STATE_LABELS[state];
  const flowLabel = FLOW_LABELS[flow];
  const first = keywords[0] ?? stateLabel;
  const second = keywords[1] ?? "오늘의 기록";
  const detail = confidence === "low"
    ? "기록 속 마음의 단서를 조금 더 천천히 살펴봤어요."
    : `${first}과 ${second}에 관한 표현이 오늘 기록에서 비교적 선명하게 느껴져요.`;
  const movement = flow === "transition"
    ? "기록의 앞뒤에서 마음이 다른 방향으로 옮겨 가는 흐름도 보였어요."
    : flow === "amplify"
      ? "같은 감정이 반복되거나 강하게 표현되어 파동의 힘이 커졌어요."
      : flow === "stay"
        ? "이 감정이 하루의 여러 순간에 머무른 흐름으로 읽혀요."
        : "오늘의 사건과 함께 이 마음이 처음 또렷해진 흐름으로 읽혀요.";
  const ending = secondary
    ? `${STATE_LABELS[secondary]}의 결도 함께 있어, 한 가지 감정으로 단정하지 않았어요.`
    : `${stateLabel} · ${flowLabel}의 리듬으로 오늘의 마음을 정리해 보았어요.`;
  return [detail, movement, ending].join(" ");
}

function pick<T>(items: T[], sourceHash: number, offset: number): T {
  return items[(sourceHash + offset) % items.length];
}

function levelLabel(level: "low" | "medium" | "high") {
  return level === "low" ? "낮음" : level === "medium" ? "보통" : "높음";
}

function createReportContent(input: {
  normalized: string;
  sourceHash: number;
  state: MetaState;
  secondary: MetaState | null;
  flow: MetaFlow;
  keywords: string[];
  evidence: Evidence[];
  firstScore: number;
  hasPersistence: boolean;
  selectedType: { name: string };
}): Omit<MetaSensingReportContent, "emotionFlow" | "analysisBasis"> {
  const stateLabel = STATE_LABELS[input.state];
  const flowLabel = FLOW_LABELS[input.flow];
  const expressions = input.evidence.map((item) => item.text).filter((value, index, values) => values.indexOf(value) === index).slice(0, 3);
  const keywords = [...input.keywords, stateLabel, flowLabel].filter((value, index, values) => values.indexOf(value) === index).slice(0, 3) as [string, string, string];
  const energyLevel = input.firstScore >= 4 ? "high" : input.firstScore >= 1.8 ? "medium" : "low";
  const persistence = input.hasPersistence ? "high" : input.evidence.length >= 3 ? "medium" : "low";
  const variability = input.flow === "transition" || input.state === "mixed" ? "high" : input.flow === "amplify" ? "medium" : "low";
  const signalTitle = `${stateLabel}에 가까운 신호가 가장 또렷하게 감지됐어요.`;
  const signalLead = pick([
    `기록에서 ${expressions.slice(0, 2).join("·") || stateLabel}와 관련된 표현이 반복돼, ${stateLabel}의 결이 중심에 있었어요.`,
    `${stateLabel}을 드러내는 단서가 기록 곳곳에서 확인돼, 오늘의 마음을 이끄는 신호로 읽혔어요.`,
    `오늘 기록에서는 ${stateLabel} 쪽 표현의 무게가 가장 크게 느껴졌어요.`,
  ], input.sourceHash, 1);
  const secondary = input.secondary
    ? `${STATE_LABELS[input.secondary]}의 기색도 함께 보여 한 가지 감정으로 단정하지 않았어요.`
    : `다른 신호보다 ${stateLabel}의 표현이 더 선명하게 남았어요.`;
  const recordSummary = pick([
    `오늘의 기록은 ${stateLabel}에 가까운 마음을 중심으로 하루의 장면을 정리하고 있어요. ${flowLabel}의 흐름이 함께 감지됐어요.`,
    `${stateLabel}의 결이 기록 전반에 남아 있고, 마음은 ${flowLabel} 쪽으로 움직였어요.`,
    `오늘은 ${stateLabel}을 느끼게 한 순간들이 기록에 이어진 하루였어요.`,
  ], input.sourceHash, 2);
  const frequencyInterpretation = pick([
    `${input.selectedType.name}의 에너지가 ${flowLabel}의 리듬으로 이어지는 파동`,
    `${stateLabel}의 결이 ${flowLabel} 쪽으로 머문 오늘의 파동`,
    `기록 속 ${stateLabel} 신호가 만든 ${flowLabel}의 리듬`,
  ], input.sourceHash, 3);
  const energySummary = [
    `에너지 활성도는 ${levelLabel(energyLevel)}으로 읽혀, 감정이 하루를 이끄는 힘이 ${energyLevel === "high" ? "또렷하게" : energyLevel === "medium" ? "적당한 무게로" : "조용하게"} 나타났어요.`,
    `감정의 지속성은 ${levelLabel(persistence)}, 변화폭은 ${levelLabel(variability)}으로 보여 ${input.flow === "stay" ? "한 결이 비교적 오래 이어진" : "하루 안에서 움직임이 감지된"} 기록에 가까워요.`,
  ];
  const directionSummary = [
    input.flow === "entry" ? "기록 안에서 이 마음이 막 모습을 드러내기 시작한 신호가 보여요." : input.flow === "stay" ? "감정이 크게 꺾이기보다 비슷한 결로 이어진 흔적이 보여요." : input.flow === "amplify" ? "같은 감정 표현이 겹치며 그 결이 조금 더 커지는 흐름이 보여요." : "기록의 앞뒤에서 마음의 결이 달라지며 전환의 움직임이 보여요.",
    `지금의 방향은 성격이나 상태를 규정하는 말이 아니라, 오늘 기록에서 감지된 ${flowLabel}의 흐름을 설명해요.`,
  ];
  const tomorrowMessage = pick([
    "내일은 더 많이 해내기보다, 지금 에너지가 머무는 곳을 한 번 살펴봐도 좋아요.",
    "내일의 한 가지 선택을 할 때, 오늘 기록에 남은 마음의 속도를 기준으로 삼아 보세요.",
    "오늘의 감정은 부족함이 아니라 지금의 리듬을 알려 준 신호로 남아 있어요.",
  ], input.sourceHash, 4);
  return { recordSummary, frequencyInterpretation, keywords, mainSignal: { title: signalTitle, body: [signalLead, secondary], detectedExpressions: expressions }, energy: { level: energyLevel, persistence, variability, summary: energySummary }, direction: { flow: input.flow, summary: directionSummary }, tomorrowMessage };
}

export function analyzeMetaSensing(input: { recordId: string; text: string; analyzedAt?: string }): MetaSensingResult {
  const normalized = normalizeText(input.text);
  if (normalized.length < 120) throw new Error("기록은 120자 이상 작성해 주세요.");
  if (normalized.length > 1000) throw new Error("기록은 1,000자 이하로 입력해 주세요.");

  const sentences = normalized.split(/[.!?。\n]+/).map((sentence) => sentence.trim()).filter(Boolean);
  const evidence: Evidence[] = [];
  const detectedKeywords: string[] = [];

  sentences.forEach((sentence, sentenceIndex) => {
    BASE_STATES.forEach((state) => {
      STATE_KEYWORDS[state].forEach((keyword) => {
        let from = 0;
        while (true) {
          const index = sentence.indexOf(keyword, from);
          if (index === -1) break;
          const negated = isNegated(sentence, index, keyword);
          if (!negated) {
            evidence.push({ text: keyword, state, weight: intensityMultiplier(sentence, index), sentenceIndex, negated: false });
            if (!detectedKeywords.includes(keyword)) detectedKeywords.push(keyword);
          }
          from = index + keyword.length;
        }
      });
    });
    PHRASE_RULES.forEach((rule) => {
      const index = sentence.indexOf(rule.phrase);
      if (index === -1 || isNegated(sentence, index, rule.phrase)) return;
      evidence.push({ text: rule.phrase, state: rule.state, weight: rule.weight * intensityMultiplier(sentence, index), sentenceIndex, negated: false });
      if (!detectedKeywords.includes(rule.phrase)) detectedKeywords.push(rule.phrase);
    });
  });

  const stateScores = Object.fromEntries(BASE_STATES.map((state) => [state, 0])) as Record<Exclude<MetaState, "mixed">, number>;
  evidence.forEach((item) => { stateScores[item.state] += item.weight; });
  BASE_STATES.forEach((state) => {
    const repeats = evidence.filter((item) => item.state === state).length;
    if (repeats > 1) stateScores[state] += Math.min(repeats - 1, 3) * 0.5;
  });

  const ranked = [...BASE_STATES].sort((left, right) => stateScores[right] - stateScores[left]);
  const firstState = ranked[0];
  const secondState = ranked[1];
  const firstScore = stateScores[firstState];
  const secondScore = stateScores[secondState];
  const isMixed = firstScore > 0 && secondScore > 0 && Math.abs(firstScore - secondScore) / firstScore <= 0.15;
  const dominantState: MetaState = isMixed ? "mixed" : firstState;
  const secondaryState: MetaState | null = isMixed ? firstState : secondScore > 0 ? secondState : null;

  const hasTransition = TRANSITION_WORDS.some((word) => normalized.includes(word)) || RECOVERY_WORDS.some((word) => normalized.includes(word));
  const hasPersistence = PERSISTENCE_WORDS.some((word) => normalized.includes(word));
  const hasEntry = ENTRY_WORDS.some((word) => normalized.includes(word));
  const highIntensity = evidence.some((item) => item.weight >= 1.4);
  const flow: MetaFlow = hasTransition ? "transition" : highIntensity && hasPersistence ? "amplify" : hasPersistence ? "stay" : hasEntry ? "entry" : "entry";
  const selectedType = selectType(dominantState, flow);
  const sourceHash = hash(`${input.recordId}:${normalized}`);
  // The handoff defines each type's base Hz with a deterministic ±20Hz range.
  const hz = Math.max(130, Math.min(1010, selectedType.hz + ((sourceHash % 41) - 20)));
  const confidenceScore = Math.min(0.96, Math.max(0.2, 0.25 + evidence.length * 0.09 + Math.min(firstScore, 7) * 0.035 + (firstScore > secondScore ? 0.08 : 0)));
  const confidence = confidenceScore >= 0.7 ? "high" : confidenceScore >= 0.46 ? "medium" : "low";
  const keywordFallback = [STATE_LABELS[dominantState], FLOW_LABELS[flow], "오늘의 기록"];
  const keywords = [...detectedKeywords, ...keywordFallback].filter((value, index, values) => values.indexOf(value) === index).slice(0, 3);
  const baseLevel = 42 + Math.min(34, Math.round(firstScore * 6));
  const timeline = {
    morning: Math.max(18, Math.min(92, baseLevel + ((sourceHash % 19) - 9))),
    noon: Math.max(18, Math.min(92, baseLevel + (((sourceHash >>> 5) % 23) - 11))),
    evening: Math.max(18, Math.min(92, baseLevel + (((sourceHash >>> 10) % 27) - 13))),
    night: Math.max(18, Math.min(92, baseLevel + (((sourceHash >>> 15) % 21) - 10))),
  };
  const amplitude = Math.min(0.9, 0.28 + firstScore * 0.07);
  const direction = FLOW_DIRECTION[flow];
  const allScores: Record<MetaState, number> = { ...stateScores, mixed: isMixed ? Math.max(firstScore, secondScore) : 0 };
  const content = createEvidenceGroundedReportContent({ normalized, sentences, state: dominantState, secondary: secondaryState, flow, keywords, evidence, firstScore, selectedType });

  return {
    is_crisis: false,
    keywords,
    type_id: selectedType.id,
    type_name: selectedType.name,
    hz,
    wave: {
      amplitude: Math.round(amplitude * 100),
      wavelength: Math.round(46 + (1 - amplitude) * 36),
      jitter: flow === "transition" ? 14 : flow === "amplify" ? 11 : 7,
      color: selectedType.color,
    },
    timeline,
    report_text: createSummary(dominantState, secondaryState, flow, keywords, confidence),
    version: "1.0.0",
    meta: {
      dominantState,
      secondaryState,
      flow,
      confidence,
      confidenceScore: Number(confidenceScore.toFixed(2)),
      stateScores: allScores,
      evidenceCount: evidence.length,
      visual: {
        presetId: `wave_${dominantState}_${flow}`,
        amplitude: Number(amplitude.toFixed(2)),
        speed: Number((0.35 + amplitude * 0.45).toFixed(2)),
        spacing: Number((0.7 - amplitude * 0.25).toFixed(2)),
        glow: Number((dominantState === "expansion" ? 0.7 : 0.38 + amplitude * 0.3).toFixed(2)),
        direction,
      },
    },
    content,
  };
}

export function isMetaSensingResult(value: AnalysisResult): value is MetaSensingResult {
  return "meta" in value;
}
