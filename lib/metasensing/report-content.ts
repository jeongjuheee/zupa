import { FLOW_LABELS, STATE_LABELS } from "./data";
import type {
  Evidence,
  MetaFlow,
  MetaSensingReportContent,
  MetaState,
  RecordAnalysisBasis,
} from "./types";

type Input = {
  normalized: string;
  sentences: string[];
  state: MetaState;
  secondary: MetaState | null;
  flow: MetaFlow;
  keywords: string[];
  evidence: Evidence[];
  firstScore: number;
  selectedType: { name: string };
};

const PEOPLE = /친구|엄마|아빠|부모님|가족|선생님|동료|팀장|상사|애인|남자친구|여자친구|언니|오빠|동생|아이|고양이|강아지/g;
const ACTIONS = ["만났", "연락", "이야기", "말했", "들었", "갔", "왔", "먹었", "쉬었", "울었", "웃었", "참았", "해냈", "끝냈", "시작", "공부", "일했", "운동", "걸었", "잠", "기록"];
const INTENSITY = ["너무", "정말", "진짜", "많이", "엄청", "완전", "조금", "약간", "계속"];
const TRANSITIONS = ["처음에는", "하지만", "그런데", "그래도", "점점", "오히려", "결국", "이후에는", "지금은", "이제는", "그러다", "반면"];
const FUTURE_INTENT = /하고 싶|해보고 싶|하려고|해야겠|할까|할 예정|원한다|바란다/;

function unique(values: string[]) {
  return values.filter((value, index) => Boolean(value) && values.indexOf(value) === index);
}

function quote(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 88 ? `${trimmed.slice(0, 85)}…` : trimmed;
}

function sentenceTarget(length: number, informationScore: number) {
  const desired = length >= 600 ? 5 : length >= 300 ? 4 : 3;
  if (informationScore >= 6) return desired;
  if (informationScore >= 4) return Math.max(2, desired - 1);
  return 2;
}

function limitSentences(sentences: string[], target: number, fallback: string) {
  const result = unique(sentences).slice(0, target);
  return result.length ? result : [fallback];
}

function extractBasis(input: Input): RecordAnalysisBasis {
  const emotionEvidence = input.evidence.filter((item) => item.state === input.state);
  const secondaryEvidence = input.secondary
    ? input.evidence.filter((item) => item.state === input.secondary)
    : [];
  const expressions = input.evidence.map((item) => item.text);
  const repeatedExpressions = unique(expressions.filter((value) => expressions.filter((item) => item === value).length > 1));
  const detectedPeople = unique(Array.from(input.normalized.matchAll(PEOPLE), (match) => match[0]));
  const detectedActions = ACTIONS.filter((action) => input.normalized.includes(action));
  const intensityMarkers = INTENSITY.filter((marker) => input.normalized.includes(marker));
  const transitionMarkers = TRANSITIONS.filter((marker) => input.normalized.includes(marker));
  const futureIntent = input.sentences.find((sentence) => FUTURE_INTENT.test(sentence)) ?? null;
  const detectedSituation = input.sentences.filter((sentence) => sentence.length >= 8).slice(0, 3);
  const primaryEmotion = emotionEvidence[0]?.text ?? input.evidence[0]?.text ?? null;
  const secondaryEmotions = unique(secondaryEvidence.map((item) => item.text)).slice(0, 3);
  const currentState = input.sentences.at(-1) ?? null;
  const informationScore = [
    detectedSituation.length > 1,
    detectedPeople.length > 0,
    detectedActions.length > 0,
    primaryEmotion !== null,
    secondaryEmotions.length > 0,
    intensityMarkers.length > 0,
    transitionMarkers.length > 0,
    repeatedExpressions.length > 0,
    futureIntent !== null,
  ].filter(Boolean).length;
  return {
    detectedSituation,
    detectedPeople,
    detectedActions,
    primaryEmotion,
    secondaryEmotions,
    intensityMarkers,
    transitionMarkers,
    repeatedExpressions,
    currentState,
    futureIntent,
    informationScore,
  };
}

function confidenceSentence(basis: RecordAnalysisBasis) {
  return basis.informationScore < 4
    ? "기록에는 감정 표현은 확인되지만, 상황이나 변화의 계기는 현재 내용만으로 구체적으로 판단하기 어려워요."
    : "이 해석은 오늘 기록에 적힌 상황과 표현을 바탕으로 한 것이며, 기록에 없는 이유나 관계를 덧붙이지 않았어요.";
}

export function createEvidenceGroundedReportContent(input: Input): MetaSensingReportContent {
  const basis = extractBasis(input);
  const target = sentenceTarget(input.normalized.length, basis.informationScore);
  const stateLabel = STATE_LABELS[input.state];
  const flowLabel = FLOW_LABELS[input.flow];
  const expressions = unique(input.evidence.map((item) => item.text)).slice(0, 5);
  const keywords = unique([...input.keywords, ...expressions, stateLabel]).slice(0, 3) as [string, string, string];
  const situation = basis.detectedSituation[0];
  const actionText = basis.detectedActions.slice(0, 2).join("·");
  const peopleText = basis.detectedPeople.slice(0, 2).join("·");
  const transitionText = basis.transitionMarkers.slice(0, 2).join("·");
  const repeatText = basis.repeatedExpressions.slice(0, 2).join("·");
  const energyLevel = input.firstScore >= 4 ? "high" : input.firstScore >= 1.8 ? "medium" : "low";
  const persistence = basis.repeatedExpressions.length || basis.intensityMarkers.includes("계속") ? "high" : input.evidence.length >= 3 ? "medium" : "low";
  const variability = basis.transitionMarkers.length || input.state === "mixed" ? "high" : input.flow === "amplify" ? "medium" : "low";

  const mainSignal = limitSentences([
    basis.primaryEmotion
      ? `기록에서는 ‘${basis.primaryEmotion}’ 표현이 중심에 있어 ${stateLabel}에 가까운 신호가 가장 먼저 확인돼요.`
      : `기록에서는 ${stateLabel}에 가까운 신호가 보이지만, 감정을 특정할 만한 표현은 충분하지 않아요.`,
    situation ? `‘${quote(situation)}’라고 적은 장면이 이 신호가 나타난 실제 맥락이에요.` : "이 감정이 나타난 구체적인 장면은 현재 기록에서 분명하게 확인되지 않아요.",
    actionText || peopleText ? `${peopleText ? `${peopleText}과(와) 관련된 ` : ""}${actionText ? `${actionText} 같은 행동` : "관계와 행동"}이 함께 언급돼 감정의 근거를 보여줘요.` : "행동이나 관계 대상은 현재 기록에서 구체적으로 확인되지 않아요.",
    repeatText ? `‘${repeatText}’ 표현이 반복돼 이 감정이 한순간보다 기록 전반에 남아 있었던 흐름으로 보여요.` : transitionText ? `‘${transitionText}’ 같은 변화 표현이 있어 감정이 한 가지 결로만 이어지지는 않았어요.` : "감정의 지속이나 변화는 현재 표현 수가 적어 조심스럽게 읽어야 해요.",
    basis.currentState ? `기록의 마지막에는 ‘${quote(basis.currentState)}’라고 적혀, 현재 마음의 위치를 그 문장 안에서 확인할 수 있어요.` : confidenceSentence(basis),
  ], target, confidenceSentence(basis));

  const energySummary = limitSentences([
    basis.intensityMarkers.length ? `‘${basis.intensityMarkers.slice(0, 2).join("·")}’ 같은 강도 표현을 기준으로 보면 오늘의 에너지는 ${energyLevel === "high" ? "높은 편" : energyLevel === "medium" ? "중간 정도" : "낮은 편"}에 가까워요.` : `감정 표현의 수와 밀도를 기준으로 보면 오늘의 에너지는 ${energyLevel === "high" ? "높은 편" : energyLevel === "medium" ? "중간 정도" : "낮은 편"}으로 보여요.`,
    actionText ? `${actionText}와(과) 관련된 서술이 있어, 에너지가 어떤 행동 속에서 드러났는지 확인돼요.` : situation ? `‘${quote(situation)}’라는 상황이 에너지의 배경으로 남아 있어요.` : "에너지가 드러난 활동 장면은 현재 기록에서 구체적으로 확인하기 어려워요.",
    repeatText ? `반복된 ‘${repeatText}’ 표현 때문에 에너지의 지속성은 비교적 높게 읽혀요.` : `같은 표현의 반복은 많지 않아 에너지가 얼마나 오래 이어졌는지는 단정하기 어려워요.`,
    transitionText ? `‘${transitionText}’가 등장해 에너지의 변화 폭은 비교적 큰 흐름으로 보여요.` : "뚜렷한 전환 표현이 없어 에너지 변화 폭은 현재 기록만으로 크게 판단하지 않았어요.",
    basis.currentState ? `마지막 문장에 남은 ‘${quote(basis.currentState)}’가 지금 에너지의 상태를 읽는 가장 가까운 단서예요.` : confidenceSentence(basis),
  ], target, confidenceSentence(basis));

  const directionSummary = limitSentences([
    `기록의 마음 방향은 ${flowLabel}에 가까운 흐름으로 보여요.`,
    transitionText ? `‘${transitionText}’라는 연결 표현이 있어 앞뒤 감정이 달라지는 지점을 확인할 수 있어요.` : basis.repeatedExpressions.length ? `같은 표현이 반복돼 감정이 한 방향으로 머무는 흐름이 더 또렷해요.` : "방향을 가르는 전환 표현은 적어, 기록에 적힌 순서를 중심으로만 읽었어요.",
    basis.secondaryEmotions.length ? `‘${basis.secondaryEmotions.join("·")}’ 같은 다른 감정 단서도 함께 있어 하나의 감정으로만 정리하지 않았어요.` : "두 번째 감정 신호는 뚜렷하지 않아, 중심 표현을 우선해 읽었어요.",
    basis.futureIntent ? `‘${quote(basis.futureIntent)}’라는 문장에서 이후에 바라는 행동이나 방향이 직접 언급돼요.` : "앞으로 하고 싶은 행동은 현재 기록에서 직접적으로 확인되지 않아요.",
    basis.currentState ? `그래서 현재의 방향은 마지막에 적은 ‘${quote(basis.currentState)}’ 쪽에 더 가깝게 남아 있어요.` : confidenceSentence(basis),
  ], target, confidenceSentence(basis));

  const emotionFlow = limitSentences([
    situation ? `기록은 ‘${quote(situation)}’라고 적은 장면에서 시작돼요.` : "기록의 시작 상황은 짧게 언급돼 있어 흐름의 출발점을 구체적으로 나누기 어려워요.",
    basis.primaryEmotion ? `그 과정에서 ‘${basis.primaryEmotion}’ 표현이 중심 감정으로 확인돼요.` : `중심 감정은 ${stateLabel}에 가깝지만, 직접 표현은 충분하지 않아요.`,
    transitionText ? `이후 ‘${transitionText}’가 나타나며 감정의 결이 바뀌거나 함께 존재하는 흐름이 보여요.` : basis.secondaryEmotions.length ? `다른 감정 단서도 함께 있어 감정이 단선적으로 이어졌다고 보기는 어려워요.` : "감정이 달라진 시점은 현재 기록에서 뚜렷하게 확인되지 않아요.",
    repeatText ? `‘${repeatText}’가 반복돼 이 감정이 기록 중간에도 이어졌다는 근거가 있어요.` : "반복 표현이 많지 않아 감정의 지속 시간을 길게 단정하지 않았어요.",
    basis.currentState ? `마지막에는 ‘${quote(basis.currentState)}’라고 적혀, 흐름이 현재 어디에 머무는지 보여줘요.` : confidenceSentence(basis),
  ], target, confidenceSentence(basis));

  const tomorrowMessage = basis.futureIntent
    ? `기록에서 ‘${quote(basis.futureIntent)}’라고 적은 방향을 내일에도 짧게 이어가 보세요. 그 행동 전후에 마음이 어떻게 달라지는지도 함께 적으면 흐름을 더 구체적으로 확인할 수 있어요.`
    : basis.transitionMarkers.length === 0
      ? "다음 기록에서는 감정이 달라진 순간과 그 계기를 함께 적으면 흐름을 더 구체적으로 확인할 수 있어요."
      : `오늘 적은 ‘${transitionText}’ 전후의 장면을 다음 기록에서도 짧게 이어 적어 보면, 변화의 계기를 더 선명하게 확인할 수 있어요.`;

  return {
    recordSummary: mainSignal.slice(0, 2).join(" "),
    frequencyInterpretation: `${input.selectedType.name} 주파수는 기록에서 확인된 ${stateLabel}·${flowLabel} 흐름을 바탕으로 정리했어요.`,
    keywords,
    mainSignal: {
      title: `${stateLabel}에 가까운 신호를 기록 근거로 정리했어요.`,
      body: mainSignal,
      detectedExpressions: expressions,
    },
    energy: { level: energyLevel, persistence, variability, summary: energySummary },
    direction: { flow: input.flow, summary: directionSummary },
    emotionFlow: { summary: emotionFlow },
    tomorrowMessage,
    analysisBasis: basis,
  };
}
