export const RECORD_LIMITS = {
  minPhotos: 1,
  maxPhotos: 4,
  maxFileBytes: 10 * 1024 * 1024,
  maxCharacters: 1000,
  minCharactersForAnalysis: 120,
  recommendedCharacters: 300,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

export type RecordStep = "photo" | "write" | "decorate";

export type DraftPhoto = {
  id: string;
  name: string;
  type: string;
  size: number;
  tone: "pink" | "mint" | "lilac" | "peach";
  previewUrl?: string;
  status: "preview" | "failed";
};

export type RecordDraft = {
  step: RecordStep;
  photos: DraftPhoto[];
  body: string;
  updatedAt: string;
};

const DRAFT_KEY = "zupa:record-draft:v1";

export function loadRecordDraft(): RecordDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as RecordDraft) : null;
  } catch {
    return null;
  }
}

export function saveRecordDraft(draft: RecordDraft) {
  if (typeof window === "undefined") return;
  try {
    const { photos, ...rest } = draft;
    // Object URLs are not durable; persist file metadata and the record content only.
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...rest, photos: photos.map(({ previewUrl, ...photo }) => photo) }),
    );
  } catch {
    // Draft persistence must never prevent writing a record.
  }
}

export function clearRecordDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}
