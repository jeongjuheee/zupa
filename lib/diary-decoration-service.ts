import type { DiaryScene } from "../app/diary-editor/types";
import { getBrowserSupabase } from "./supabase/browser";

export interface SaveDiaryDecorationInput { recordId: string; sceneVersion: number; sceneData: DiaryScene; renderedImage: Blob; }
export async function saveDiaryDecoration(input: SaveDiaryDecorationInput): Promise<{ imageUrl: string }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { imageUrl: URL.createObjectURL(input.renderedImage) };
  const { data: userData } = await supabase.auth.getUser();
  // The existing migration provisions this private bucket and limits each path to its owner.
  if (!userData.user) return { imageUrl: URL.createObjectURL(input.renderedImage) };
  const path = `${userData.user.id}/records/${input.recordId}/${Date.now()}.png`;
  const { error } = await supabase.storage.from("record-images").upload(path, input.renderedImage, { contentType: "image/png", upsert: false });
  if (error) throw new Error(`꾸민 기록 이미지를 저장하지 못했어요: ${error.message}`);
  const { data } = supabase.storage.from("record-images").getPublicUrl(path);
  return { imageUrl: data.publicUrl };
}
