export type AnalysisResult = {
  is_crisis: boolean;
  keywords: string[];
  type_id: number | null;
  type_name?: string;
  hz: number | null;
  wave: {
    amplitude: number;
    wavelength: number;
    jitter: number;
    color: string;
  } | null;
  timeline: {
    morning: number;
    noon: number;
    evening: number;
    night: number;
  } | null;
  report_text: string;
};

export interface AiAdapter {
  analyze(text: string): Promise<AnalysisResult>;
}
