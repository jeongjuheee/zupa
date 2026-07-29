import type { AnalysisResult } from "./types";

type PreviewType = {
  id: number;
  name: string;
  hz: number;
  color: string;
};

const PREVIEW_TYPES: PreviewType[] = [
  { id: 1, name: "맑은 시작", hz: 920, color: "#FFE066" },
  { id: 2, name: "따뜻한 활력", hz: 860, color: "#FFB8CF" },
  { id: 3, name: "기분 좋은 설렘", hz: 810, color: "#FFD3AE" },
  { id: 4, name: "가벼운 집중", hz: 760, color: "#B8E6D7" },
  { id: 5, name: "차분한 몰입", hz: 710, color: "#A9DAF3" },
  { id: 6, name: "잔잔한 파동", hz: 660, color: "#CDBFE9" },
  { id: 7, name: "느린 호흡", hz: 610, color: "#B8E6D7" },
  { id: 8, name: "포근한 쉼", hz: 560, color: "#FFD9C7" },
  { id: 9, name: "생각의 여백", hz: 510, color: "#D9E5F2" },
  { id: 10, name: "복잡한 마음", hz: 470, color: "#E6D5F4" },
  { id: 11, name: "조심스러운 긴장", hz: 430, color: "#F7D0B7" },
  { id: 12, name: "무거운 피로", hz: 390, color: "#C7D1DE" },
  { id: 13, name: "흐린 걱정", hz: 350, color: "#D8D1ED" },
  { id: 14, name: "예민한 흔들림", hz: 310, color: "#F7B2CC" },
  { id: 15, name: "가라앉은 마음", hz: 270, color: "#B9C9DA" },
  { id: 16, name: "회복이 필요한 날", hz: 230, color: "#C5D0DD" },
];

const KEYWORD_GROUPS = [
  { label: "여유", words: ["편안", "여유", "평온", "쉬", "느긋"] },
  { label: "기쁨", words: ["좋", "행복", "웃", "즐", "신나", "설렘"] },
  { label: "온기", words: ["고마", "따뜻", "가족", "친구", "함께"] },
  { label: "집중", words: ["집중", "일", "공부", "완료", "해냈"] },
  { label: "피로", words: ["피곤", "지쳤", "힘들", "졸", "바빴"] },
  { label: "걱정", words: ["걱정", "불안", "긴장", "스트레스", "초조"] },
  { label: "아쉬움", words: ["아쉽", "속상", "실망", "후회", "외로"] },
  { label: "회복", words: ["괜찮", "회복", "다시", "버텼", "천천히"] },
] as const;

function hashText(value: string) {
  return Array.from(value).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 17);
}

function extractKeywords(text: string) {
  const normalized = text.replace(/\s+/g, " ");
  const matched: string[] = KEYWORD_GROUPS.filter((group) =>
    group.words.some((word) => normalized.includes(word)),
  ).map((group) => group.label);
  if (matched.length >= 3) return matched.slice(0, 3);

  const words = normalized
    .split(/[\s,.!?…·:;()]+/)
    .filter((word) => word.length >= 2 && !["오늘", "그리고", "하지만", "그래서", "정말"].includes(word));
  return [...matched, ...words.filter((word) => !matched.includes(word))].slice(0, 3).concat(["오늘의 마음"]).slice(0, 3);
}

export function createDevelopmentPreview(text: string): AnalysisResult {
  const keywords = extractKeywords(text);
  const negativeScore = KEYWORD_GROUPS.slice(4, 7).reduce(
    (total, group) => total + Number(group.words.some((word) => text.includes(word))),
    0,
  );
  const positiveScore = KEYWORD_GROUPS.slice(0, 4).reduce(
    (total, group) => total + Number(group.words.some((word) => text.includes(word))),
    0,
  );
  const hash = hashText(text);
  const baseIndex = Math.min(
    PREVIEW_TYPES.length - 1,
    Math.max(0, 7 + negativeScore * 3 - positiveScore * 2 + ((hash % 3) - 1)),
  );
  const type = PREVIEW_TYPES[baseIndex];
  const levels = [
    34 + (hash % 24),
    42 + ((hash >>> 4) % 28),
    38 + ((hash >>> 8) % 34),
    36 + ((hash >>> 12) % 26),
  ].map((level) => Math.max(12, Math.min(92, level + positiveScore * 5 - negativeScore * 6)));

  return {
    is_crisis: false,
    keywords,
    type_id: type.id,
    type_name: type.name,
    hz: type.hz,
    wave: {
      amplitude: 40 + (hash % 38),
      wavelength: 48 + ((hash >>> 5) % 36),
      jitter: 5 + ((hash >>> 10) % 12),
      color: type.color,
    },
    timeline: {
      morning: levels[0],
      noon: levels[1],
      evening: levels[2],
      night: levels[3],
    },
    report_text: `${keywords.join(" · ")}의 단서가 오늘 기록에서 느껴져요. 지금의 마음은 ${type.name}에 가까운 흐름으로 보입니다. 하루를 잘 버텨 낸 자신에게 잠깐의 여백을 건네 보세요.`,
  };
}
