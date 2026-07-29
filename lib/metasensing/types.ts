import type { AnalysisResult } from "../ai/types";

export type MetaState =
  | "stability"
  | "expansion"
  | "immersion"
  | "tension"
  | "conflict"
  | "exhaustion"
  | "reflection"
  | "mixed";

export type MetaFlow = "entry" | "stay" | "amplify" | "transition";

export type Evidence = {
  text: string;
  state: Exclude<MetaState, "mixed">;
  weight: number;
  sentenceIndex: number;
  negated: boolean;
};

export type RecordAnalysisBasis = {
  detectedSituation: string[];
  detectedPeople: string[];
  detectedActions: string[];
  primaryEmotion: string | null;
  secondaryEmotions: string[];
  intensityMarkers: string[];
  transitionMarkers: string[];
  repeatedExpressions: string[];
  currentState: string | null;
  futureIntent: string | null;
  informationScore: number;
};

export type MetaSensingReportContent = {
  recordSummary: string;
  frequencyInterpretation: string;
  keywords: [string, string, string];
  mainSignal: {
    title: string;
    body: string[];
    detectedExpressions: string[];
  };
  energy: {
    level: "low" | "medium" | "high";
    persistence: "low" | "medium" | "high";
    variability: "low" | "medium" | "high";
    summary: string[];
  };
  direction: {
    flow: MetaFlow;
    summary: string[];
  };
  emotionFlow?: {
    summary: string[];
  };
  tomorrowMessage: string;
  analysisBasis?: RecordAnalysisBasis;
};

export type MetaSensingResult = AnalysisResult & {
  version: "1.0.0";
  meta: {
    dominantState: MetaState;
    secondaryState: MetaState | null;
    flow: MetaFlow;
    confidence: "low" | "medium" | "high";
    confidenceScore: number;
    stateScores: Record<MetaState, number>;
    evidenceCount: number;
    visual: {
      presetId: string;
      amplitude: number;
      speed: number;
      spacing: number;
      glow: number;
      direction: "inward" | "outward" | "steady" | "shifting";
    };
  };
  content: MetaSensingReportContent;
};
