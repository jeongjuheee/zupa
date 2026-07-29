export const FREQUENCY_BGM_TRACKS: Partial<Record<number, readonly string[]>> = {
  1: ["/assets/bgm/full-charge-01.wav", "/assets/bgm/full-charge-02.wav"],
  2: ["/assets/bgm/ppyong-01.wav", "/assets/bgm/ppyong-02.wav"],
  3: ["/assets/bgm/pang-pang-01.wav", "/assets/bgm/pang-pang-02.wav"],
  4: ["/assets/bgm/dugeun-01.wav", "/assets/bgm/dugeun-02.wav"],
  5: ["/assets/bgm/jijik-01.wav", "/assets/bgm/jijik-02.wav"],
  6: ["/assets/bgm/bugeul-01.wav", "/assets/bgm/bugeul-02.wav"],
  // The second 삐빅 track can be appended here as soon as it is delivered.
  7: ["/assets/bgm/ppibik-01.wav"],
};

export function pickFrequencyBgm(typeId: number) {
  const tracks = FREQUENCY_BGM_TRACKS[typeId];
  if (!tracks?.length) return null;
  return tracks[Math.floor(Math.random() * tracks.length)];
}

export function hasFrequencyBgm(typeId: number) {
  return Boolean(FREQUENCY_BGM_TRACKS[typeId]?.length);
}
