export type FrequencyTypeId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
export type FrequencyVisualVariant = "hero" | "loading" | "report" | "card" | "icon";

export type FrequencyCharacterDefinition = { id: FrequencyTypeId; key: string; name: string; baseHz: number; emotionState: string; flow: string; visualPreset: string; palette: { primary: string; secondary: string; accent: string; background: string }; motionPreset: string; soundPreset: string; description: string; };
const define = (id: FrequencyTypeId, key: string, name: string, baseHz: number, emotionState: string, flow: string, visualPreset: string, colors: [string, string, string, string], motionPreset: string, soundPreset: string, description: string): FrequencyCharacterDefinition => ({ id, key, name, baseHz, emotionState, flow, visualPreset, palette: { primary: colors[0], secondary: colors[1], accent: colors[2], background: colors[3] }, motionPreset, soundPreset, description });

export const frequencyCharacterRegistry: Record<FrequencyTypeId, FrequencyCharacterDefinition> = {
  1: define(1,"full-charge","풀충",990,"확장","증폭","rounded-radiance",["#FF7A45","#FFD45C","#8AD5FF","#FFF4E8"],"expand-and-breathe","01-full-charge","에너지가 넓게 퍼지는 리본"),
  2: define(2,"ppyong","뿅",940,"확장","진입","jelly-pop",["#FF78B9","#D8B5FF","#FFE36E","#FFF0F7"],"pop-up","02-ppyong","기대가 튀어 오르는 젤리"),
  3: define(3,"pang-pang","팡팡",890,"확장","머무름","rhythmic-blooms",["#FF745F","#FFB38C","#8AD5FF","#FFF1EC"],"rhythmic-bloom","03-pang-pang","즐거움이 리듬으로 이어지는 꽃잎"),
  4: define(4,"dugeun","두근",840,"확장","전환","paired-ribbon",["#EF6F9A","#FF9A7B","#FFF0CF","#FFF1F4"],"double-pulse","04-dugeun","서로 가까워졌다 흐르는 두 리본"),
  5: define(5,"jijik","지직",790,"충돌","진입","crossed-lines",["#C7D845","#B493E8","#7CB9FF","#F7FBE8"],"soft-shift","05-jijik","가볍게 엇갈리는 손그림 선"),
  6: define(6,"bugeul","부글",740,"충돌","증폭","rising-bubbles",["#F06E47","#E6B94D","#B997E8","#FFF1E9"],"bubble-rise","06-bugeul","안에서 차오르는 둥근 방울"),
  7: define(7,"ppibik","삐빅",690,"긴장","머무름","signal-dots",["#E0C83E","#FF9A7B","#355B8A","#FFFBE8"],"soft-pulse","07-ppibik","조심스럽게 깜빡이는 신호 점"),
  8: define(8,"ulleong","울렁",640,"긴장","전환","wobbly-ribbon",["#A38AE8","#92D9C5","#7FB9F2","#F3F0FF"],"gentle-sway","08-ulleong","서로 어긋나 흔들리는 물결"),
  9: define(9,"mallang","말랑",590,"안정","진입","soft-cushion",["#F5B197","#FFF2D5","#B9E5D5","#FFF8EF"],"slow-press","09-mallang","긴장이 풀리는 낮은 쿠션"),
  10: define(10,"mongle","몽글",540,"안정","전환","cloud-merge",["#B99AE9","#FFC0AD","#9ED4F2","#F7F1FF"],"merge","10-mongle","포근하게 합쳐지는 구름 조각"),
  11: define(11,"janjan","잔잔",450,"몰입","머무름","long-water",["#418FE8","#9EDFCF","#FFF7E7","#EDF7FF"],"slow-flow","11-janjan","낮고 긴 손그림 물결"),
  12: define(12,"nogon","노곤",390,"성찰","머무름","drooping-ribbon",["#9187B4","#D7CAB7","#8FA9C7","#F6F3F8"],"settle","12-nogon","조용히 내려앉는 리본"),
  13: define(13,"buffering","버퍼링",340,"혼재","진입","floating-pieces",["#9877D7","#F2A06D","#75B9E8","#F5F0FF"],"pause-and-move","13-buffering","모이려다 잠시 멈춘 조각"),
  14: define(14,"dungdung","둥둥",290,"혼재","머무름","floating-clouds",["#77BEE8","#B9A6E7","#F4B49D","#EEF9FF"],"float","14-dungdung","서로 다른 높이에 떠 있는 방울"),
  15: define(15,"heurim","흐림",220,"소진","전환","watercolor-fade",["#7389A3","#AAA4BE","#F3DEC5","#F2F5F8"],"fade-drift","15-heurim","한쪽으로 번져 가는 수채화 구름"),
  16: define(16,"discharge","방전",150,"소진","증폭","settled-dot",["#53657B","#BCC3CD","#B6A8D8","#F2F3F5"],"minimal-breathe","16-discharge","작게 내려앉은 에너지 조각"),
};

export function getFrequencyCharacter(typeId: number) { return frequencyCharacterRegistry[typeId as FrequencyTypeId] ?? frequencyCharacterRegistry[14]; }
export function hzCondition(definition: FrequencyCharacterDefinition, resultHz?: number) { return Math.max(-1, Math.min(1, ((resultHz ?? definition.baseHz) - definition.baseHz) / 20)); }
