"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "../../../lib/supabase/browser";

export default function AuthCallback() {
  const [message, setMessage] = useState("이메일 인증을 확인하고 있어요.");

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get("code");
    const supabase = getBrowserSupabase();
    if (!code || !supabase) {
      queueMicrotask(() =>
        setMessage("인증 정보를 확인하지 못했어요. 다시 로그인해 주세요."),
      );
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) setMessage("인증 링크가 만료되었거나 이미 사용되었어요.");
      else window.location.replace("/?auth=complete");
    });
  }, []);

  return (
    <div className="app-shell">
      <main
        className="screen"
        style={{ display: "grid", placeItems: "center" }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <div className="loading-orbit" style={{ marginTop: 10 }} />
          <h2>{message}</h2>
          <p className="muted">잠시만 기다려 주세요.</p>
        </div>
      </main>
    </div>
  );
}
