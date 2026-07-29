import { createClient } from "@supabase/supabase-js";
import { getPasswordChecks, isValidEmail, PASSWORD_POLICY_MESSAGE } from "../../../lib/password-policy";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: unknown; password?: unknown };
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";
  if (!isValidEmail(email)) return Response.json({ message: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
  if (!getPasswordChecks(email, password).valid) return Response.json({ message: PASSWORD_POLICY_MESSAGE }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ message: "회원가입 서비스를 준비할 수 없습니다." }, { status: 503 });

  const supabase = createClient(url, key);
  const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: new URL("/auth/callback", request.url).toString() } });
  if (error) return Response.json({ message: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
