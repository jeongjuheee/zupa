import type { MetaFlow, MetaState } from "./types";

export const STATE_LABELS: Record<MetaState, string> = {
  stability: "안정",
  expansion: "확장",
  immersion: "몰입",
  tension: "긴장",
  conflict: "충돌",
  exhaustion: "소진",
  reflection: "성찰",
  mixed: "혼재",
};

export const FLOW_LABELS: Record<MetaFlow, string> = {
  entry: "진입",
  stay: "머무름",
  amplify: "증폭",
  transition: "전환",
};

export const STATE_KEYWORDS: Record<Exclude<MetaState, "mixed">, string[]> = {
  stability: ["평온", "차분", "안심", "안정", "편안", "고요", "느긋", "괜찮"],
  expansion: ["기쁨", "즐거", "행복", "설렘", "신나", "뿌듯", "기대", "활기"],
  immersion: ["집중", "몰입", "재미", "창작", "시간 가는 줄", "완성", "열중"],
  tension: ["불안", "걱정", "초조", "긴장", "스트레스", "조마조마", "부담"],
  conflict: ["화가", "분노", "답답", "억울", "짜증", "서운", "갈등", "속상"],
  exhaustion: ["지쳤", "피곤", "무기력", "공허", "힘들", "버겁", "에너지", "아무것도 하기 싫"],
  reflection: ["생각", "돌아보", "후회", "깨달", "고민", "성찰", "느꼈"],
};

export const PHRASE_RULES: Array<{
  phrase: string;
  state: Exclude<MetaState, "mixed">;
  weight: number;
}> = [
  { phrase: "마음이 무거", state: "exhaustion", weight: 2.1 },
  { phrase: "아무 생각도 하기 싫", state: "exhaustion", weight: 2.4 },
  { phrase: "혼자 있고 싶", state: "exhaustion", weight: 1.7 },
  { phrase: "마음이 가벼워", state: "stability", weight: 2.1 },
  { phrase: "시간 가는 줄 모르", state: "immersion", weight: 2.3 },
  { phrase: "기분이 좋아", state: "expansion", weight: 1.8 },
  { phrase: "관계가 편안", state: "stability", weight: 1.9 },
  { phrase: "계속 신경", state: "tension", weight: 2.1 },
  { phrase: "말이 막혔", state: "conflict", weight: 1.8 },
  { phrase: "생각보다 괜찮", state: "stability", weight: 2.0 },
];

export const INTENSITY_MODIFIERS = [
  { word: "조금", multiplier: 0.7 },
  { word: "약간", multiplier: 0.7 },
  { word: "꽤", multiplier: 1.2 },
  { word: "많이", multiplier: 1.2 },
  { word: "너무", multiplier: 1.4 },
  { word: "정말", multiplier: 1.4 },
  { word: "진짜", multiplier: 1.4 },
  { word: "완전", multiplier: 1.6 },
  { word: "엄청", multiplier: 1.6 },
] as const;

export const PERSISTENCE_WORDS = ["계속", "계속해서", "하루 종일", "내내", "오랫동안", "반복", "줄곧", "여전히"];
export const ENTRY_WORDS = ["갑자기", "문득", "처음으로", "그 순간", "오늘 처음", "시작", "생겼", "느꼈"];
export const TRANSITION_WORDS = ["그런데", "하지만", "그러다", "결국", "이후", "지금은", "집에 오니", "생각해보니"];
export const RECOVERY_WORDS = ["괜찮아", "진정", "기분이 좋아", "마음이 가벼워", "숨이 트", "안도"];

export const TYPE_DEFINITIONS: Array<{
  id: number;
  name: string;
  hz: number;
  color: string;
  ink: string;
  quadrant: "A" | "B" | "C" | "D";
  states: MetaState[];
  flow?: MetaFlow;
}> = [
  { id: 1, name: "풀충", hz: 990, color: "#FFE066", ink: "#C99000", quadrant: "A", states: ["expansion"], flow: "amplify" },
  { id: 2, name: "뿅", hz: 940, color: "#FF9ED8", ink: "#C93E9E", quadrant: "A", states: ["expansion"], flow: "entry" },
  { id: 3, name: "팡팡", hz: 890, color: "#FFB07C", ink: "#D9601A", quadrant: "A", states: ["expansion"], flow: "stay" },
  { id: 4, name: "두근", hz: 840, color: "#FFA6BD", ink: "#D14A6E", quadrant: "A", states: ["expansion"], flow: "transition" },
  { id: 5, name: "지직", hz: 790, color: "#FF8A8A", ink: "#C93030", quadrant: "C", states: ["conflict"], flow: "entry" },
  { id: 6, name: "부글", hz: 740, color: "#E97A96", ink: "#A81E42", quadrant: "C", states: ["conflict"], flow: "amplify" },
  { id: 7, name: "삐빅", hz: 690, color: "#D7F26A", ink: "#7A9A10", quadrant: "C", states: ["tension"], flow: "stay" },
  { id: 8, name: "울렁", hz: 640, color: "#B79CF0", ink: "#6A45C4", quadrant: "C", states: ["tension"], flow: "transition" },
  { id: 9, name: "말랑", hz: 590, color: "#FFF0C2", ink: "#B08A2E", quadrant: "B", states: ["stability"], flow: "entry" },
  { id: 10, name: "몽글", hz: 540, color: "#FFD9C7", ink: "#C47A55", quadrant: "B", states: ["stability"], flow: "transition" },
  { id: 11, name: "잔잔", hz: 450, color: "#C2E8DA", ink: "#4E9179", quadrant: "B", states: ["immersion"], flow: "stay" },
  { id: 12, name: "노곤", hz: 390, color: "#DED2F0", ink: "#7C68A8", quadrant: "B", states: ["reflection"], flow: "stay" },
  { id: 13, name: "버퍼링", hz: 340, color: "#DCE3EC", ink: "#6C7B90", quadrant: "D", states: ["mixed"], flow: "entry" },
  { id: 14, name: "둥둥", hz: 290, color: "#E4E0D5", ink: "#8A8271", quadrant: "D", states: ["mixed"], flow: "stay" },
  { id: 15, name: "흐림", hz: 220, color: "#C3CFDF", ink: "#5E7391", quadrant: "D", states: ["exhaustion"], flow: "transition" },
  { id: 16, name: "방전", hz: 150, color: "#AAB4C2", ink: "#4B5769", quadrant: "D", states: ["exhaustion"], flow: "amplify" },
];

export const FLOW_DIRECTION = {
  entry: "inward",
  stay: "steady",
  amplify: "outward",
  transition: "shifting",
} as const;
