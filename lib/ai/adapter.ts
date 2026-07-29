import { analyzeMetaSensing } from "../metasensing/analyze";
import { crisisResult, serverSafetyRule } from "./safety";
import type { AnalysisResult } from "./types";

export class AnalysisError extends Error {
  constructor(
    public code: string,
    public publicMessage: string,
    public status = 500,
  ) {
    super(code);
  }
}

/**
 * MVP default: deterministic, rule-based analysis with no third-party AI request.
 * A future paid adapter can replace this implementation without changing the
 * response contract used by the report UI.
 */
export async function analyzeDiary(text: string, recordId: string): Promise<AnalysisResult> {
  if (serverSafetyRule(text)) return crisisResult;

  try {
    return analyzeMetaSensing({ recordId, text });
  } catch (cause) {
    if (cause instanceof Error && (cause.message.includes("120자") || cause.message.includes("1,000자"))) {
      throw new AnalysisError("INVALID_DIARY_LENGTH", cause.message, 400);
    }
    throw new AnalysisError(
      "ANALYSIS_FAILED",
      "기록을 분석하지 못했어요. 잠시 후 다시 시도해 주세요.",
      500,
    );
  }
}
