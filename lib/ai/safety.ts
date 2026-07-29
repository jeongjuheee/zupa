const crisisPatterns = [
  /죽고\s*싶/i,
  /자살/i,
  /목숨을\s*끊/i,
  /사라지고\s*싶/i,
  /살고\s*싶지\s*않/i,
  /해치고\s*싶/i,
  /유서/i,
];

export function serverSafetyRule(text: string) {
  return crisisPatterns.some((pattern) => pattern.test(text));
}

export const crisisResult = {
  is_crisis: true as const,
  keywords: [],
  type_id: null,
  hz: null,
  wave: null,
  timeline: null,
  report_text:
    "오늘의 기록을 남겨줘서 고마워요. 지금 이 마음을 혼자 견디지 않아도 괜찮아요. 혼자 감당하기 어려운 마음이라면 자살예방 상담전화 109에서 언제든 이야기를 들어줘요.",
};
