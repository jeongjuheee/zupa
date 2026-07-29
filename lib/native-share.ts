export type ShareResult = "shared" | "cancelled" | "unsupported";

export function supportsNativeShare(file: File) {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  return !navigator.canShare || navigator.canShare({ files: [file] });
}

export async function shareReportImage(file: File): Promise<ShareResult> {
  if (!supportsNativeShare(file)) return "unsupported";
  try {
    await navigator.share({
      title: "오늘의 주파 리포트",
      text: "오늘의 마음을 주파수로 남겼어요.",
      files: [file],
    });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    throw error;
  }
}
