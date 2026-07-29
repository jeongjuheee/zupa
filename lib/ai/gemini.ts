import type { AiAdapter, AnalysisResult } from "./types";

const schema = {
  type: "object",
  properties: {
    is_crisis: { type: "boolean" },
    keywords: {
      type: "array",
      items: { type: "string" },
      minItems: 0,
      maxItems: 3,
    },
    type_id: {
      anyOf: [{ type: "integer", minimum: 1, maximum: 16 }, { type: "null" }],
    },
    type_name: { type: "string" },
    hz: {
      anyOf: [
        { type: "integer", minimum: 130, maximum: 1010 },
        { type: "null" },
      ],
    },
    wave: {
      anyOf: [
        {
          type: "object",
          properties: {
            amplitude: { type: "number" },
            wavelength: { type: "number" },
            jitter: { type: "number" },
            color: { type: "string" },
          },
          required: ["amplitude", "wavelength", "jitter", "color"],
        },
        { type: "null" },
      ],
    },
    timeline: {
      anyOf: [
        {
          type: "object",
          properties: {
            morning: { type: "integer", minimum: 0, maximum: 100 },
            noon: { type: "integer", minimum: 0, maximum: 100 },
            evening: { type: "integer", minimum: 0, maximum: 100 },
            night: { type: "integer", minimum: 0, maximum: 100 },
          },
          required: ["morning", "noon", "evening", "night"],
        },
        { type: "null" },
      ],
    },
    report_text: { type: "string" },
  },
  required: [
    "is_crisis",
    "keywords",
    "type_id",
    "type_name",
    "hz",
    "wave",
    "timeline",
    "report_text",
  ],
};

const systemInstruction = `너는 감정 기록 서비스 '주파'의 분석기다. 진단·평가·훈계하지 않는다. 사진이나 사용자 신원은 받지 않는다. 일반 일기는 한글 명사형 키워드 3개, 16개 유형 중 하나, 기준 Hz ±20, 아침·낮·저녁·밤 0~100 흐름과 다정한 3~4문장 리포트를 반환한다. 위기 가능성이 있으면 is_crisis=true로 하고 키워드·유형·Hz·wave·timeline을 비우며 109 안내를 포함한다.`;

export class GeminiAdapter implements AiAdapter {
  constructor(
    private apiKey: string,
    private model: string,
  ) {}

  async analyze(text: string): Promise<AnalysisResult> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: schema,
            temperature: 0.35,
          },
        }),
      },
    );
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      throw Object.assign(new Error("Gemini request failed"), { status });
    }
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const json = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!json) throw new Error("Empty Gemini response");
    return JSON.parse(json) as AnalysisResult;
  }
}
