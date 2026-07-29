import { analyzeDiary, AnalysisError } from "../../../lib/ai/adapter";

const recentRequests = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: unknown; requestId?: unknown };
    const text = typeof body.text === "string" ? body.text : "";
    const requestId = typeof body.requestId === "string" ? body.requestId : "";

    if (text.trim().length < 120 || text.trim().length > 1000) {
      return Response.json(
        { code: "INVALID_DIARY_LENGTH", message: "기록은 120자 이상 1,000자 이하로 입력해 주세요." },
        { status: 400 },
      );
    }
    if (!requestId || requestId.length > 100) {
      return Response.json(
        { code: "INVALID_REQUEST", message: "요청 정보를 확인해 주세요." },
        { status: 400 },
      );
    }

    const now = Date.now();
    const previous = recentRequests.get(requestId);
    if (previous && now - previous < 60_000) {
      return Response.json(
        { code: "DUPLICATE_REQUEST", message: "같은 분석 요청을 처리 중이에요. 잠시 후 다시 시도해 주세요." },
        { status: 429 },
      );
    }
    recentRequests.set(requestId, now);
    for (const [key, value] of recentRequests) if (now - value > 5 * 60_000) recentRequests.delete(key);

    return Response.json(await analyzeDiary(text, requestId));
  } catch (cause) {
    if (cause instanceof AnalysisError) {
      return Response.json({ code: cause.code, message: cause.publicMessage }, { status: cause.status });
    }
    return Response.json(
      { code: "ANALYSIS_FAILED", message: "기록을 분석하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
