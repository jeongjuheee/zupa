"use client";

/* eslint-disable react/no-unescaped-entities */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getBrowserSupabase } from "../lib/supabase/browser";
import {
  AppHeader,
  BottomSheet,
  Button,
  Checkbox,
  Divider,
  ErrorMessage,
  LinkText,
  TextInput,
} from "./ui";
import { StickerCanvas, StickerPalette, type PlacedSticker } from "./stickers";
import { RecordFlow } from "./record-flow";
import {
  EmotionChart,
  FrequencyCard,
  ReportAccordion,
  ReportEditor,
  ReportHeader,
  ReportLoadingState,
  ReportSummaryCard,
  SaveGuideBottomSheet,
  ShareFormatCard,
  SharePreview,
  ShareRecordCard,
  UnsavedChangesModal,
  type ReportViewData,
} from "./report";
import {
  downloadReportImage,
  renderReportImage,
  type ShareFormat,
} from "../lib/report-image-export";
import { shareReportImage } from "../lib/native-share";
import { TYPE_DEFINITIONS } from "../lib/metasensing/data";
import { getPasswordChecks, isValidEmail, PASSWORD_POLICY_MESSAGE } from "../lib/password-policy";
import type { MetaSensingReportContent } from "../lib/metasensing/types";

type Screen =
  | "landing"
  | "auth"
  | "signup"
  | "login"
  | "verify"
  | "onboarding"
  | "home"
  | "photos"
  | "diary"
  | "decorate"
  | "loading"
  | "report"
  | "report-edit"
  | "report-share"
  | "report-record"
  | "report-loading"
  | "report-error"
  | "crisis"
  | "fail"
  | "mock-record"
  | "mock-my"
  | "market"
  | "market-filter"
  | "market-empty"
  | "market-detail"
  | "market-loading"
  | "market-success"
  | "market-failure"
  | "market-network"
  | "my"
  | "my-profile"
  | "my-records"
  | "my-record-empty"
  | "my-record-loading"
  | "my-stickers"
  | "my-sticker-detail"
  | "my-purchases"
  | "my-logout"
  | "settings"
  | "settings-account"
  | "settings-privacy"
  | "settings-support"
  | "settings-app"
  | "settings-withdraw"
  | "my-withdraw-info"
  | "my-withdraw-confirm";
type Analysis = {
  is_crisis: boolean;
  keywords: string[];
  type_id: number | null;
  type_name?: string;
  hz: number | null;
  timeline: Record<string, number> | null;
  report_text: string;
  wave?: { color: string };
  meta?: { visual: ReportViewData["visual"] };
  content?: MetaSensingReportContent;
};

type TodayRecordSnapshot = {
  id: string;
  recordDate: string;
  content: string;
  photoUrls: string[];
  decoratedImages: Array<{ imageUrl: string; sourceReportVersion: number; isCurrentVersion: boolean; createdAt: string }>;
  reportVersion: number;
  createdAt: string;
  updatedAt: string;
};

const TODAY_RECORD_STORAGE_KEY = "zupa:today-record:v1";

function koreaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

type LandingWave = {
  typeId: number;
  typeName: string;
  hz: number;
  color: string;
  bars: number[];
  timeline: number[];
};

function createLandingTimeline(typeId: number, hz: number) {
  const energy = (hz - 150) / 840;
  return Array.from({ length: 4 }, (_, index) => {
    const phase = (index + typeId * 0.73) * 1.42;
    return Math.round(36 + energy * 38 + Math.sin(phase) * (13 + energy * 8));
  });
}

function toCalendarDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// The landing and analysis both read the same canonical 16 types from the handoff.
const LANDING_WAVES: LandingWave[] = TYPE_DEFINITIONS.map((type) => ({
  typeId: type.id,
  typeName: type.name,
  hz: type.hz,
  color: type.color,
  bars: [],
  timeline: createLandingTimeline(type.id, type.hz),
}));

const MARKET_ITEMS = [
  {
    id: "spring-signal",
    title: "기억 조각 템플릿",
    type: "템플릿",
    color: "pink",
    label: "NEW SIGNAL",
    description: "사진 4장으로 오늘의 장면을 남기는 감정 템플릿이에요.",
    price: "무료",
    free: true,
  },
  {
    id: "cloud-bubble",
    title: "말랑 구름 스티커",
    type: "스티커",
    color: "lilac",
    label: "NEW SIGNAL",
    description: "기록 위에 가볍게 얹을 수 있는 말랑한 구름 스티커예요.",
    price: "무료",
    free: true,
  },
  {
    id: "cozy-note",
    title: "포근한 하루",
    type: "템플릿",
    color: "mint",
    label: "TODAY NOTE",
    description: "차분하게 하루를 정리할 수 있는 여백이 넉넉한 템플릿이에요.",
    price: "무료",
    free: true,
  },
  {
    id: "calm-flower",
    title: "작은 꽃말 스티커",
    type: "스티커",
    color: "pink",
    label: "FREE GIFT",
    description: "기록의 빈 곳에 가볍게 마음을 덧붙일 수 있는 작은 꽃말 스티커예요.",
    price: "무료",
    free: true,
  },
  {
    id: "twinkle-star",
    title: "반짝 별빛 스티커",
    type: "스티커",
    color: "lilac",
    label: "SPARKLE",
    description: "기록의 포인트가 되는 작은 별빛 스티커예요.",
    price: "무료",
    free: true,
  },
  {
    id: "soft-heart",
    title: "말랑 하트 스티커",
    type: "스티커",
    color: "pink",
    label: "WITH LOVE",
    description: "좋았던 순간 옆에 마음을 남길 수 있는 하트 스티커예요.",
    price: "무료",
    free: true,
  },
  {
    id: "lucky-leaf",
    title: "행운 잎사귀 스티커",
    type: "스티커",
    color: "mint",
    label: "GOOD LUCK",
    description: "오늘의 작은 행운을 표시하는 잎사귀 스티커예요.",
    price: "무료",
    free: true,
  },
  {
    id: "mood-ribbon",
    title: "기분 리본 스티커",
    type: "스티커",
    color: "lilac",
    label: "MY MOOD",
    description: "오늘의 감정을 부드럽게 묶어 주는 리본 스티커예요.",
    price: "무료",
    free: true,
  },
] as const;

const DEMO_ANALYSIS: Analysis = {
  is_crisis: false,
  keywords: ["여유", "온기", "회복"],
  type_id: 11,
  type_name: "잔잔",
  hz: 450,
  timeline: { 아침: 58, 낮: 71, 저녁: 67, 밤: 74 },
  wave: { color: "#C2E8DA" },
  report_text:
    "오늘은 작은 쉼이 마음의 리듬을 되찾게 해 준 하루예요. 지금의 편안함을 짧게라도 기록해 두세요.",
  content: {
    recordSummary: "오늘은 작은 쉼과 온기가 남은 장면들을 중심으로 하루를 돌아본 기록이에요. 편안함의 결이 비교적 고르게 이어졌어요.",
    frequencyInterpretation: "잔잔한 에너지가 머무름의 리듬으로 이어지는 파동",
    keywords: ["여유", "온기", "회복"],
    mainSignal: { title: "편안함에 가까운 신호가 가장 또렷하게 감지됐어요.", body: ["기록에서 여유와 온기에 관한 표현이 반복돼, 안정적인 결이 중심에 있었어요.", "강한 변화보다 편안한 감정이 이어진 흔적이 남아 있어요."], detectedExpressions: ["여유", "온기", "회복"] },
    energy: { level: "medium", persistence: "high", variability: "low", summary: ["에너지 활성도는 보통으로 읽혀, 감정이 적당한 무게로 나타났어요.", "감정의 지속성은 높음, 변화폭은 낮음으로 보여 한 결이 비교적 오래 이어진 기록에 가까워요."] },
    direction: { flow: "stay", summary: ["감정이 크게 꺾이기보다 비슷한 결로 이어진 흔적이 보여요.", "지금의 방향은 오늘 기록에서 감지된 머무름의 흐름을 설명해요."] },
    tomorrowMessage: "내일은 더 많이 해내기보다, 지금 에너지가 머무는 곳을 한 번 살펴봐도 좋아요.",
  },
};

const DEMO_CRISIS_ANALYSIS: Analysis = {
  ...DEMO_ANALYSIS,
  is_crisis: true,
  type_name: "안전 확인 필요",
  report_text:
    "혼자 감당하기 어려운 마음이 느껴질 수 있어요. 지금 믿을 수 있는 사람이나 전문 도움과 연결해 보세요.",
};

const stepMap: Partial<Record<Screen, number>> = {
  photos: 25,
  diary: 50,
  decorate: 75,
  loading: 100,
};

export function ZupaApp() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [reportReturnScreen, setReportReturnScreen] = useState<Screen>("home");
  const [demoMode, setDemoMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [photos, setPhotos] = useState(0);
  const [reportPhotoUrls, setReportPhotoUrls] = useState<string[]>([]);
  const [diary, setDiary] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportReady, setReportReady] = useState(true);
  const [reportError, setReportError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [savedReportText, setSavedReportText] = useState(DEMO_ANALYSIS.report_text);
  const [draftReportText, setDraftReportText] = useState(DEMO_ANALYSIS.report_text);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [selectedShareFormat, setSelectedShareFormat] = useState<ShareFormat>("report-card");
  const [isRenderingImage, setIsRenderingImage] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [shareUnsupported, setShareUnsupported] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [ageConsent, setAgeConsent] = useState(false);
  const [serviceConsent, setServiceConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [activeTerms, setActiveTerms] = useState<
    "privacy" | "age" | "service" | "marketing" | null
  >(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [landingWaveIndex, setLandingWaveIndex] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [recordedDates, setRecordedDates] = useState<string[]>([]);
  const [todayRecord, setTodayRecord] = useState<TodayRecordSnapshot | null>(null);
  const [editingTodayRecord, setEditingTodayRecord] = useState<TodayRecordSnapshot | null>(null);
  const [marketType, setMarketType] = useState<"전체" | "템플릿" | "스티커">("전체");
  const [marketPrice, setMarketPrice] = useState<"전체" | "무료">("전체");
  const [marketSort, setMarketSort] = useState<"신상품" | "인기순">("신상품");
  const [selectedMarketItem, setSelectedMarketItem] = useState("spring-signal");
  const [profileNickname, setProfileNickname] = useState("파도타는 민지");
  const [profileBio, setProfileBio] = useState("오늘의 마음을 차분하게 기록해요.");
  const [nicknameChecked, setNicknameChecked] = useState<boolean | null>(null);
  const [profileToast, setProfileToast] = useState(false);
  const [withdrawPhrase, setWithdrawPhrase] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);
  const [stickers, setStickers] = useState<PlacedSticker[]>([
    { id: "welcome-lucky", assetId: "pastel-lucky", x: 33, y: 30, z: 1, scale: .9 },
    { id: "welcome-success", assetId: "pastel-success", x: 65, y: 58, z: 2, scale: .9 },
  ]);

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const demo = params.get("demo");
    const demoScreen: Partial<Record<string, Screen>> = {
      landing: "landing",
      walkthrough: "auth",
      auth: "auth",
      signup: "signup",
      verify: "verify",
      onboarding: "onboarding",
      consent: "onboarding",
      nickname: "onboarding",
      welcome: "onboarding",
      home: "home",
      record: "photos",
      report: "report",
      "report-bgm": "report",
      "report-edit": "report-edit",
      "report-share": "report-share",
      "report-record": "report-record",
      "report-loading": "report-loading",
      "report-error": "report-error",
      crisis: "crisis",
      market: "market",
      "market-filter": "market-filter",
      "market-empty": "market-empty",
      "market-detail": "market-detail",
      "market-loading": "market-loading",
      "market-success": "market-success",
      "market-failure": "market-failure",
      "market-network": "market-network",
      my: "my",
      "my-profile": "my-profile",
      "my-records": "my-records",
      "my-record-empty": "my-record-empty",
      "my-record-loading": "my-record-loading",
      "my-stickers": "my-stickers",
      "my-sticker-detail": "my-sticker-detail",
      "my-purchases": "my-purchases",
      "my-logout": "my-logout",
      settings: "settings",
      "settings-account": "settings-account",
      "settings-privacy": "settings-privacy",
      "settings-support": "settings-support",
      "settings-app": "settings-app",
      "my-withdraw-info": "my-withdraw-info",
      "my-withdraw-confirm": "my-withdraw-confirm",
    };
    if (params.get("auth") === "complete") {
      queueMicrotask(() => {
        setScreen("onboarding");
        window.history.replaceState({}, "", "/");
      });
    } else if (demo && demoScreen[demo]) {
      const initialDemoScreen = demoScreen[demo] as Screen;
      queueMicrotask(() => {
        setDemoMode(true);
        setEmail("hello@jupa.kr");
        setPassword("demo-password-123");
        setDiary("따뜻한 햇살을 보며 잠깐 숨을 고른 하루였어요.");
        if (demo === "consent") setOnboardingStep(1);
        if (demo === "nickname") setOnboardingStep(2);
        if (demo === "welcome") setOnboardingStep(3);
        setScreen(initialDemoScreen);
        if (demo === "report") setAnalysis(DEMO_ANALYSIS);
        if (demo === "report-bgm") setAnalysis({
          ...DEMO_ANALYSIS,
          type_id: 2,
          type_name: "뿅",
          hz: 940,
          keywords: ["신남", "설렘", "기대"],
          content: DEMO_ANALYSIS.content ? {
            ...DEMO_ANALYSIS.content,
            emotionFlow: { summary: ["기록의 시작 장면에서 설렘과 기대가 함께 언급돼요.", "감정이 이어진 시간이나 전환 계기는 데모 기록만으로 구체적으로 판단하기 어려워요."] },
            analysisBasis: { detectedSituation: ["데모 리포트의 테스트 장면"], detectedPeople: [], detectedActions: [], primaryEmotion: "설렘", secondaryEmotions: ["기대"], intensityMarkers: [], transitionMarkers: [], repeatedExpressions: [], currentState: "현재 기록은 테스트용 문장으로 구성돼 있어요.", futureIntent: null, informationScore: 2 },
          } : undefined,
        });
        if (demo === "crisis") setAnalysis(DEMO_CRISIS_ANALYSIS);
      });
    }
  }, []);

  const displayNickname = nickname.trim() || profileNickname;

  useEffect(() => {
    if (screen !== "landing") return;
    const timer = window.setInterval(
      () => setLandingWaveIndex((index) => (index + 1) % LANDING_WAVES.length),
      3400,
    );
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("zupa-recorded-dates");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecordedDates(parsed.filter((date): date is string => typeof date === "string"));
      }
      const storedTodayRecord = window.localStorage.getItem(TODAY_RECORD_STORAGE_KEY);
      if (storedTodayRecord) {
        const parsedRecord = JSON.parse(storedTodayRecord) as TodayRecordSnapshot;
        if (parsedRecord.recordDate === koreaDateKey()) setTodayRecord(parsedRecord);
      }
    } catch {
      // A failed local cache should never prevent the home screen from loading.
    }
  }, []);

  useEffect(() => {
    try {
      const storedNickname = window.localStorage.getItem("zupa-profile-nickname");
      if (storedNickname?.trim()) setProfileNickname(storedNickname);
    } catch {
      // Profile cache is optional in the local demo environment.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("zupa-recorded-dates", JSON.stringify(recordedDates));
    } catch {
      // Local persistence is optional in the preview environment.
    }
  }, [recordedDates]);

  useEffect(() => {
    try {
      if (todayRecord) window.localStorage.setItem(TODAY_RECORD_STORAGE_KEY, JSON.stringify(todayRecord));
      else window.localStorage.removeItem(TODAY_RECORD_STORAGE_KEY);
    } catch {
      // Local persistence is optional in the preview environment.
    }
  }, [todayRecord]);

  useEffect(() => {
    if (screen !== "my-record-loading") return;
    const timer = window.setTimeout(() => setScreen("my-records"), 900);
    return () => window.clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    if (!profileToast) return;
    const timer = window.setTimeout(() => setProfileToast(false), 2200);
    return () => window.clearTimeout(timer);
  }, [profileToast]);

  useEffect(() => {
    if (!analysis) return;
    setSavedReportText(analysis.report_text);
    setDraftReportText(analysis.report_text);
    setReportReady(true);
    setReportError("");
  }, [analysis]);

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = window.setTimeout(() => setSaveSuccess(false), 2200);
    return () => window.clearTimeout(timer);
  }, [saveSuccess]);

  const legacyPasswordError = useMemo(() => {
    if (!password) return "";
    if (password.length < 12) return "비밀번호는 12자 이상이어야 해요.";
    if (password.length > 64) return "비밀번호는 64자 이하로 입력해 주세요.";
    if (password === email)
      return "쉽게 추측할 수 있는 비밀번호예요. 다른 비밀번호를 사용해 주세요.";
    return "";
  }, [password, email]);
  const passwordChecks = useMemo(() => getPasswordChecks(email, password), [password, email]);
  const passwordError = password && !passwordChecks.valid ? PASSWORD_POLICY_MESSAGE : "";
  const passwordsMatch = passwordConfirmation.length > 0 && password === passwordConfirmation;
  const passwordConfirmationError = passwordConfirmation && !passwordsMatch ? "비밀번호가 일치하지 않습니다." : "";

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Keep a consistent six-week diary grid.  Shorter months retain the
    // same rhythm with trailing empty cells instead of stretching each day.
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - firstDay + 1;
      return day > 0 && day <= daysInMonth ? day : null;
    });
  }, [calendarMonth]);
  const recordedDateSet = useMemo(() => new Set(recordedDates), [recordedDates]);
  const today = new Date();
  const isCurrentCalendarMonth =
    calendarMonth.getFullYear() === today.getFullYear() &&
    calendarMonth.getMonth() === today.getMonth();
  const calendarTitle = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(calendarMonth);

  async function signUpWithEmail() {
    setError("");
    // 체험 모드에서는 외부 인증 서비스에 요청하지 않고 인증 화면을 보여준다.
    if (demoMode) {
      setScreen("verify");
      return;
    }
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password: password.trim() }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(result.message ?? "회원가입 요청을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setScreen("verify");
    return;

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setScreen("verify");
      return;
    }
    const { error: authError } = await supabase!.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) {
      setError("가입 요청을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setScreen("verify");
  }

  async function signInWithKakao() {
    setError("");
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setScreen("onboarding");
      return;
    }
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) setError("카카오 로그인을 시작하지 못했어요.");
  }

  async function signInWithEmail() {
    setError("");
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("로그인 서비스를 준비할 수 없습니다.");
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: loginPassword,
    });
    if (authError) {
      setError("이메일 또는 비밀번호를 확인해 주세요.");
      return;
    }
    setLoginPassword("");
    setScreen("home");
  }

  async function analyze(recordBody = diary) {
    setScreen("loading");
    setError("");
    setReportLoading(true);
    setReportReady(false);
    setReportError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: recordBody, requestId: crypto.randomUUID() }),
      });
      const body = (await response.json()) as Analysis & { message?: string };
      if (!response.ok)
        throw new Error(body.message || "분석을 완료하지 못했어요.");
      setAnalysis(body);
      setRecordedDates((dates) => {
        const today = toCalendarDateKey(new Date());
        return dates.includes(today) ? dates : [...dates, today];
      });
      setReportLoading(false);
      setReportReady(true);
      setScreen(body.is_crisis ? "crisis" : "report");
    } catch (cause) {
      setReportLoading(false);
      setReportReady(false);
      setReportError(cause instanceof Error ? cause.message : "분석 결과를 다시 불러와 주세요.");
      setError(
        cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.",
      );
      setScreen("fail");
    }
  }

  const reportSource = analysis ?? DEMO_ANALYSIS;
  const reportType = TYPE_DEFINITIONS.find((type) => type.id === reportSource.type_id);
  const reportData: ReportViewData = {
    typeId: reportSource.type_id ?? 14,
    date: "2026. 07. 31.",
    typeName: reportSource.type_name || "몽글",
    hz: reportSource.hz || 548,
    keywords: reportSource.keywords,
    summary: savedReportText,
    photoUrls: reportPhotoUrls,
    fill: reportSource.wave?.color ?? reportType?.color,
    ink: reportType?.ink,
    visual: reportSource.meta?.visual,
    content: reportSource.content,
    timeline: reportSource.timeline || { 아침: 46, 낮: 62, 저녁: 74, 밤: 58 },
  };
  const hasUnsavedChanges = draftReportText !== savedReportText;

  function openReport(returnScreen: Screen = "home") {
    setReportReturnScreen(returnScreen);
    setScreen("report");
  }

  async function saveReport() {
    if (isSavingReport) return;
    setIsSavingReport(true);
    setSaveError("");
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    setSavedReportText(draftReportText);
    setIsSavingReport(false);
    setIsEditing(false);
    setSaveSuccess(true);
    setScreen("report");
  }

  function leaveEditor() {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
      return;
    }
    setIsEditing(false);
    setScreen("report");
  }

  async function createReportImage() {
    if (isRenderingImage) return null;
    setIsRenderingImage(true);
    setSaveError("");
    try {
      return await renderReportImage(reportData, selectedShareFormat);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "이미지 생성에 실패했어요.");
      return null;
    } finally {
      setIsRenderingImage(false);
    }
  }

  async function saveReportImage() {
    if (isSavingImage || isRenderingImage || isSharing) return;
    setIsSavingImage(true);
    const image = await createReportImage();
    if (image) {
      downloadReportImage(image);
      setSaveSuccess(true);
    }
    setIsSavingImage(false);
  }

  async function shareReport() {
    if (isSharing || isRenderingImage || isSavingImage) return;
    setIsSharing(true);
    const image = await createReportImage();
    if (image) {
      try {
        const result = await shareReportImage(image);
        if (result === "unsupported") setShareUnsupported(true);
        if (result === "shared") setSaveSuccess(true);
      } catch (cause) {
        setSaveError(cause instanceof Error ? cause.message : "공유를 완료하지 못했어요.");
      }
    }
    setIsSharing(false);
  }

  const [recordEntrySheet, setRecordEntrySheet] = useState<"existing" | "confirm-edit" | null>(null);
  function beginRecordEntry() {
    if (todayRecord?.recordDate === koreaDateKey()) {
      setScreen("home");
      setRecordEntrySheet("existing");
      return;
    }
    setEditingTodayRecord(null);
    setScreen("photos");
  }
  function navigatePrimary(next: Screen) {
    if (next === "photos") beginRecordEntry();
    else setScreen(next);
  }

  useEffect(() => {
    const onRecordNavigation = () => beginRecordEntry();
    window.addEventListener("zupa:record-entry", onRecordNavigation);
    return () => window.removeEventListener("zupa:record-entry", onRecordNavigation);
  }, [todayRecord]);

  const header = (back?: Screen) => (
    <AppHeader onBack={back ? () => setScreen(back) : undefined} />
  );
  const progress = stepMap[screen] ? (
    <>
      <div className="eyebrow">RECORD FLOW · {stepMap[screen]}%</div>
      <div className="progress">
        <span style={{ width: `${stepMap[screen]}%` }} />
      </div>
    </>
  ) : null;

  if (screen === "landing")
    return (
      <Shell>
        <main className="landing-screen exact-landing">
          <Image
            className="landing-gif"
            src="/jupa_landing_hero.gif"
            alt="사진 네 장과 하루 감정 파동을 보여주는 주파 랜딩 시안"
            width={440}
            height={780}
            priority
            unoptimized
          />
          <LandingCanvas wave={LANDING_WAVES[landingWaveIndex]} />
          <button
            className="landing-start-hotspot"
            onClick={() => setScreen("auth")}
            aria-label="시작하기"
          >
            <span>시작하기</span>
          </button>
        </main>
      </Shell>
    );

  if (screen === "auth")
    return (
      <Shell>
        <main className="screen auth-choice-screen">
          <div className="auth-choice-backdrop" aria-hidden="true" />
          <BottomSheet>
            <span className="ds-sheet-handle" />
            <h1>주파를 시작해볼까요?</h1>
            <p className="ds-body">
              가입 방법을 선택해 주세요. 두 방식은 별도 계정으로 관리돼요.
            </p>
            <div className="ds-action-stack">
              <Button variant="yellow" onClick={() => void signInWithKakao()}>
                카카오로 계속하기
              </Button>
              <Button variant="outline" onClick={() => setScreen("signup")}>
                이메일로 가입하기
              </Button>
            </div>
            <Divider>이미 계정이 있어요</Divider>
            <LinkText onClick={() => setScreen("login")}>로그인</LinkText>
            <LinkText onClick={() => setScreen("landing")}>닫기</LinkText>
          </BottomSheet>
        </main>
      </Shell>
    );

  if (screen === "login")
    return (
      <Shell>
        <main className="screen ds-auth-screen">
          <AppHeader title="이메일 로그인" onBack={() => setScreen("auth")} />
          <div className="ds-auth-content">
            <h1>다시 만나서 반가워요</h1>
            <p className="ds-body">가입한 이메일과 비밀번호를 입력해 주세요.</p>
            <div className="ds-form-stack">
              <TextInput
                label="이메일"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="hello@jupa.kr"
                error={email && !isValidEmail(email) ? "이메일 형식을 확인해 주세요." : undefined}
              />
              <TextInput
                label="비밀번호"
                type={showLoginPassword ? "text" : "password"}
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="비밀번호 입력"
                trailing={<button type="button" aria-label={showLoginPassword ? "비밀번호 숨기기" : "비밀번호 보기"} onClick={() => setShowLoginPassword((value) => !value)}>{showLoginPassword ? "숨김" : "보기"}</button>}
              />
              <LinkText onClick={() => setScreen("signup")}>이메일로 새로 가입하기</LinkText>
            </div>
          </div>
          <div className="grow" />
          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
          <Button variant="blue" disabled={!isValidEmail(email) || !loginPassword} onClick={() => void signInWithEmail()}>로그인</Button>
        </main>
      </Shell>
    );

  if (screen === "signup")
    return (
      <Shell>
        <main className="screen ds-auth-screen">
          <AppHeader
            title="이메일로 가입하기"
            onBack={() => setScreen("auth")}
          />
          <div className="ds-auth-content">
            <h1>이메일 계정을 만들어요</h1>
            <div className="ds-form-stack">
              <TextInput
                label="이메일"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@jupa.kr"
                error={
                  email && !isValidEmail(email)
                    ? "이메일 형식을 확인해 주세요."
                    : undefined
                }
              />
              <TextInput
                label="비밀번호"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="12자 이상으로 입력"
                error={passwordError || undefined}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "숨김" : "보기"}
                  </button>
                }
              />
              <ul className="password-checklist" aria-label="비밀번호 조건">
                <li className={passwordChecks.minLength ? "is-valid" : ""}>{passwordChecks.minLength ? "✓" : "□"} 12자 이상</li>
                <li className={passwordChecks.uppercase ? "is-valid" : ""}>{passwordChecks.uppercase ? "✓" : "□"} 영문 대문자 포함</li>
                <li className={passwordChecks.lowercase ? "is-valid" : ""}>{passwordChecks.lowercase ? "✓" : "□"} 영문 소문자 포함</li>
                <li className={passwordChecks.number ? "is-valid" : ""}>{passwordChecks.number ? "✓" : "□"} 숫자 포함</li>
                <li className={passwordChecks.special ? "is-valid" : ""}>{passwordChecks.special ? "✓" : "□"} 특수문자 포함</li>
              </ul>
              <TextInput
                label="비밀번호 확인"
                type={showPasswordConfirmation ? "text" : "password"}
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="비밀번호를 다시 입력"
                error={passwordConfirmationError || undefined}
                trailing={<button type="button" aria-label={showPasswordConfirmation ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"} onClick={() => setShowPasswordConfirmation((value) => !value)}>{showPasswordConfirmation ? "숨김" : "보기"}</button>}
              />
              {passwordConfirmation ? <p className={`password-match ${passwordsMatch ? "is-valid" : "is-invalid"}`}>{passwordsMatch ? "✓ 비밀번호가 일치합니다." : "✗ 비밀번호가 일치하지 않습니다."}</p> : null}
              {!passwordError ? (
                <p className="ds-hint">
                  12자 이상으로 설정해 주세요. 긴 문장 형태의 비밀번호도 사용할
                  수 있어요.
                </p>
              ) : null}
            </div>
          </div>
          <div className="grow" />
          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
          <Button
            variant="blue"
            disabled={
              !isValidEmail(email) || !passwordChecks.valid || !passwordsMatch
            }
            onClick={() => void signUpWithEmail()}
          >
            가입하기
          </Button>
        </main>
      </Shell>
    );

  if (screen === "verify")
    return (
      <Shell>
        <main className="screen ds-auth-screen">
          <AppHeader title="이메일 인증" onBack={() => setScreen("signup")} />
          <div className="ds-verify-content">
            <span className="ds-mail-icon" aria-hidden="true">
              ✉
            </span>
            <h1>인증 메일을 보냈어요</h1>
            <strong>{email || "hello@jupa.kr"}</strong>
            <p className="ds-body">
              메일의 인증 링크를 완료하면 온보딩을 계속할 수 있어요.
            </p>
            <div className="ds-action-stack">
              <Button variant="blue" onClick={() => setScreen("onboarding")}>
                개발 모드: 인증 완료
              </Button>
              <Button variant="outline" disabled>
                재발송 대기 · 00:42
              </Button>
              <Button variant="outline">링크 만료 · 새 메일 발송</Button>
              <Button variant="outline">인증 실패 · 다시 시도</Button>
            </div>
          </div>
        </main>
      </Shell>
    );

  if (screen === "onboarding") {
    const stepLabel = `${String(onboardingStep + 1).padStart(2, "0")} / 04`;
    if (onboardingStep === 0)
      return (
        <Shell>
          <main className="screen onboarding-screen">
            <OnboardingHeader step={stepLabel} />
            <div className="onboarding-body">
              <OnboardingProgress current={0} />
              <OnboardingLead
                title={
                  <>
                    나에게 맞는 기록을
                    <br />
                    골라볼까요?
                  </>
                }
                subtitle="언제든 원하는 방식으로 시작할 수 있어요."
              />
              <div className="onboarding-options">
                <OnboardingChoiceCard tone="pink" icon="▣" title="사진으로 시작" description="한 장이면 충분해요" />
                <OnboardingChoiceCard tone="yellow" icon="✎" title="짧게 기록" description="스쳐간 감정을 남겨요" />
                <OnboardingChoiceCard tone="mint" icon="≈" title="마음 리포트" description="기록의 흐름이 보이게 돼요" />
              </div>
            </div>
            <Button
              className="onboarding-next"
              variant="blue"
              onClick={() => setOnboardingStep(1)}
            >
              다음
            </Button>
          </main>
        </Shell>
      );

    if (onboardingStep === 1)
      return (
        <Shell>
          <main className="screen consent-screen onboarding-screen">
            <OnboardingHeader
              step={stepLabel}
              onBack={() => setOnboardingStep(0)}
            />
            <div className="onboarding-body consent-content">
              <OnboardingProgress current={1} />
              <OnboardingLead
                title={
                  <>
                    시작하기 전에
                    <br />
                    확인해 주세요
                  </>
                }
                subtitle="필수 항목을 확인하고 동의해 주세요."
              />
              <div className="consent-list">
                <ConsentOption
                  variant="all"
                  label="전체 동의"
                  checked={ageConsent && serviceConsent && privacyConsent && marketingConsent}
                  onChange={(checked) => {
                    setAgeConsent(checked);
                    setServiceConsent(checked);
                    setPrivacyConsent(checked);
                    setMarketingConsent(checked);
                  }}
                />
                <ConsentOption
                  label="만 14세 이상이에요"
                  requirement="필수"
                  checked={ageConsent}
                  onChange={setAgeConsent}
                  onView={() => setActiveTerms("age")}
                />
                <ConsentOption
                  label="서비스 이용약관 동의"
                  requirement="필수"
                  checked={serviceConsent}
                  onChange={setServiceConsent}
                  onView={() => setActiveTerms("service")}
                />
                <ConsentOption
                  label="개인정보 수집·이용 동의"
                  requirement="필수"
                  checked={privacyConsent}
                  onChange={setPrivacyConsent}
                  onView={() => setActiveTerms("privacy")}
                />
                <ConsentOption
                  label="마케팅 정보 수신 동의"
                  requirement="선택"
                  checked={marketingConsent}
                  onChange={setMarketingConsent}
                  onView={() => setActiveTerms("marketing")}
                />
              </div>
            </div>
            <Button
              className="onboarding-next"
              variant="blue"
              disabled={!privacyConsent || !ageConsent || !serviceConsent}
              onClick={() => setOnboardingStep(2)}
            >
              동의하고 계속
            </Button>
            <TermsSheet
              activeTerms={activeTerms}
              close={() => setActiveTerms(null)}
              agree={() => {
                if (activeTerms === "privacy") setPrivacyConsent(true);
                if (activeTerms === "age") setAgeConsent(true);
                if (activeTerms === "service") setServiceConsent(true);
                if (activeTerms === "marketing") setMarketingConsent(true);
                setActiveTerms(null);
              }}
            />
          </main>
        </Shell>
      );

    if (onboardingStep === 2)
      return (
        <Shell>
          <main className="screen onboarding-screen nickname-screen">
            <OnboardingHeader
              step={stepLabel}
              onBack={() => setOnboardingStep(1)}
            />
            <div className="onboarding-body nickname-content">
              <OnboardingProgress current={2} />
              <span className="nickname-face" aria-hidden="true">
                <span className="nickname-face__features" />
              </span>
              <OnboardingLead
                align="center"
                title="어떻게 불러드릴까요?"
                subtitle="Zupa 안에서 사용할 이름이에요."
              />
              <TextInput
                label=""
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="파동이"
                maxLength={10}
                trailing={<small>{nickname.length} / 10</small>}
              />
            </div>
            <Button
              className="onboarding-next"
              variant="blue"
              disabled={!nickname.trim()}
              onClick={() => {
                const confirmedNickname = nickname.trim();
                setProfileNickname(confirmedNickname);
                try {
                  window.localStorage.setItem("zupa-profile-nickname", confirmedNickname);
                } catch {
                  // Continue onboarding even if local storage is unavailable.
                }
                setOnboardingStep(3);
              }}
            >
              이 이름으로 시작
            </Button>
          </main>
        </Shell>
      );

    return (
      <Shell>
        <main className="screen onboarding-screen welcome-pack-screen">
          <OnboardingHeader
            step={stepLabel}
            onBack={() => setOnboardingStep(2)}
          />
          <div className="welcome-pack-title">
            <span>WELCOME GIFT · 스티커팩</span>
            <h1>{displayNickname}님을 위한 웰컴팩</h1>
          </div>
          <div className="welcome-message">
            모두 내 서랍에 담아두었어요
            <br />
            <small>기록할 때마다 꺼내 붙여 보세요.</small>
          </div>
          <StickerCanvas stickers={stickers} onChange={setStickers} />
          <p className="sticker-section-title">스티커를 골라 추가해 보세요</p>
          <StickerPalette
            onAdd={(assetId) =>
              setStickers((items) => [
                ...items,
                {
                  id: crypto.randomUUID(),
                  assetId,
                  x: 50,
                  y: 50,
                  z: Math.max(0, ...items.map((item) => item.z)) + 1,
                },
              ])
            }
          />
          <p className="sticker-help">
            스티커를 드래그해 이동하고, 선택 후 복제하거나 삭제할 수 있어요.
          </p>
          <Button
            className="onboarding-next"
            variant="blue"
            onClick={() => setScreen("home")}
          >
            첫 기록 시작하기 →
          </Button>
        </main>
      </Shell>
    );
  }

  if (screen === "home")
    return (
      <Shell>
        <main className="screen home-screen">
          {demoMode ? (
            <p className="demo-mode-banner">
              체험 모드 · 예시 데이터로 안전하게 둘러보는 중
            </p>
          ) : null}
          <div className="home-status">
            <span>9:41</span>
            <span>5G · ▰</span>
          </div>
          <div className="home-header">
            <span className="home-logo-mark">Z</span>
            <span className="brand">Zupa</span>
            <button aria-label="프로필" className="profile-button">
              ♙
            </button>
          </div>
          <section className="today-card">
            <div>
              <b>오늘의 주파</b>
              <p>지금 마음의 주파수는 어떤가요?</p>
            </div>
            <span className="time-pill">오전 3시 전</span>
            <button
              className="btn primary compact"
              onClick={beginRecordEntry}
            >
              오늘 기록 시작
            </button>
          </section>
          <section className="calendar-card">
            <div className="section-title">
              <b>{calendarTitle}</b>
              <button
                type="button"
                className="calendar-current-button"
                disabled={isCurrentCalendarMonth}
                onClick={() =>
                  setCalendarMonth(
                    new Date(today.getFullYear(), today.getMonth(), 1),
                  )
                }
              >
                이번 달
              </button>
              <div>
                <button
                  type="button"
                  aria-label="이전 달"
                  onClick={() =>
                    setCalendarMonth(
                      (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1),
                    )
                  }
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="다음 달"
                  onClick={() =>
                    setCalendarMonth(
                      (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1),
                    )
                  }
                >
                  ›
                </button>
              </div>
            </div>
            <div className="weekday-row">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <b key={day}>{day}</b>
              ))}
            </div>
            <div className="calendar-grid">
              {calendarDays.map((day, i) => {
                const dateKey = day
                  ? toCalendarDateKey(
                      new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        day,
                      ),
                    )
                  : "";
                const isToday = day !== null && dateKey === toCalendarDateKey(today);
                const hasRecord = day !== null && recordedDateSet.has(dateKey);
                return (
                  <span
                    className={[isToday ? "today" : "", hasRecord ? "recorded-day" : ""]
                      .filter(Boolean)
                      .join(" ")}
                    key={i}
                  >
                    {day ?? ""}
                  </span>
                );
              })}
            </div>
            <div className="calendar-legend">
              <span className="legend-recorded">기록한 날</span>
            </div>
          </section>
          <button
            className="week-card home-card-button"
            onClick={() => openReport()}
          >
            <div>
              <b>최근 7일의 파동</b>
              <p>기록할수록 감정의 리듬이 보여요</p>
            </div>
            <div className="mini-bars">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </button>
          <div className="home-promo-grid">
            <section
              className="promo-card lilac home-promo-button"
              onClick={() => openReport()}
            >
              <small>MONTHLY REPORT</small>
              <b>7월 마음 리포트</b>
              <span>준비 중이에요 →</span>
            </section>
            <section
              className="promo-card market-promo home-promo-button"
              onClick={() => {
                setMarketType("스티커");
                setMarketPrice("무료");
                setMarketSort("신상품");
                setScreen("market");
              }}
            >
              <em>NEW</em>
              <small>MARKET NEWS</small>
              <b>
                새로 들어온
                <br />
                무료 스티커
              </b>
              <span>마켓 신상품 보러가기 →</span>
            </section>
          </div>
          <HomeBottomNav active="home" onNavigate={navigatePrimary} />
          {recordEntrySheet === "existing" ? (
            <div className="record-unsaved-modal" role="dialog" aria-modal="true">
              <BottomSheet>
                <h2>오늘의 기록이 이미 있어요</h2>
                <p>오늘은 이미 기록을 남겼어요. 기존 기록을 확인하거나 내용을 수정할 수 있어요.</p>
                <Button variant="blue" onClick={() => { setRecordEntrySheet(null); openReport(); }}>오늘 기록 보기</Button>
                <Button variant="outline" onClick={() => setRecordEntrySheet("confirm-edit")}>내용 수정하기</Button>
                <Button variant="outline" onClick={() => setRecordEntrySheet(null)}>취소</Button>
              </BottomSheet>
            </div>
          ) : null}
          {recordEntrySheet === "confirm-edit" ? (
            <div className="record-unsaved-modal" role="dialog" aria-modal="true">
              <BottomSheet>
                <h2>오늘 기록을 수정할까요?</h2>
                <p>내용을 수정하면 오늘의 주파수와 리포트가 다시 분석돼요. 기존에 꾸민 이미지는 수정 전 기록으로 만든 이미지로 보관되며, 수정 후 새로 꾸밀 수 있어요.</p>
                <Button variant="blue" onClick={() => { setEditingTodayRecord(todayRecord); setRecordEntrySheet(null); setScreen("photos"); }}>수정하기</Button>
                <Button variant="outline" onClick={() => setRecordEntrySheet("existing")}>취소</Button>
              </BottomSheet>
            </div>
          ) : null}
        </main>
      </Shell>
    );

  if (
    screen === "my" ||
    screen === "my-profile" ||
    screen === "my-records" ||
    screen === "my-record-empty" ||
    screen === "my-record-loading" ||
    screen === "my-stickers" ||
    screen === "my-sticker-detail" ||
    screen === "my-purchases" ||
    screen === "my-logout" ||
    screen === "settings" ||
    screen === "settings-account" ||
    screen === "settings-privacy" ||
    screen === "settings-support" ||
    screen === "settings-app" ||
    screen === "settings-withdraw" ||
    screen === "my-withdraw-info" ||
    screen === "my-withdraw-confirm"
  ) {
    const profileError =
      profileNickname.trim().length < 2
        ? "닉네임은 2자 이상 입력해 주세요."
        : profileNickname.trim().length > 10
          ? "닉네임은 10자 이하로 입력해 주세요."
          : nicknameChecked === false
            ? "이미 사용 중인 닉네임이에요."
            : "";

    if (screen === "my" || screen === "my-logout")
      return (
        <Shell>
          <main className="screen my-screen">
            <MyHeader onBack={() => setScreen("home")} onSettings={() => setScreen("settings")} />
            <MyDashboard
              nickname={profileNickname}
              onProfile={() => setScreen("my-profile")}
              onRecords={() => setScreen("my-records")}
              onStickers={() => setScreen("my-stickers")}
              onPurchases={() => setScreen("my-purchases")}
              onSettings={() => setScreen("settings")}
              onLogout={() => setScreen("my-logout")}
            />
            <HomeBottomNav active="my" onNavigate={setScreen} />
            {screen === "my-logout" ? (
              <LogoutSheet
                onCancel={() => setScreen("my")}
                onLogout={() => setScreen("auth")}
              />
            ) : null}
          </main>
        </Shell>
      );

    if (
      screen === "settings" ||
      screen === "settings-account" ||
      screen === "settings-privacy" ||
      screen === "settings-support" ||
      screen === "settings-app" ||
      screen === "settings-withdraw"
    )
      return (
        <Shell>
          <main className="screen my-screen my-settings-screen">
            <MyHeader
              title={
                screen === "settings-account"
                  ? "계정"
                  : screen === "settings-privacy" || screen === "settings-withdraw"
                    ? "개인정보"
                    : screen === "settings-support"
                      ? "고객센터"
                      : screen === "settings-app"
                        ? "앱 정보"
                        : "설정"
              }
              onBack={() =>
                setScreen(
                  screen === "settings" ? "my" : screen === "settings-withdraw" ? "settings-privacy" : "settings",
                )
              }
            />
            <SettingsContent
              screen={screen}
              onProfile={() => setScreen("my-profile")}
              onAccount={() => setScreen("settings-account")}
              onPrivacy={() => setScreen("settings-privacy")}
              onSupport={() => setScreen("settings-support")}
              onApp={() => setScreen("settings-app")}
              onWithdraw={() => setScreen("settings-withdraw")}
              onExternal={(target) => {
                if (target === "contact") window.location.href = "mailto:support@zupa.kr";
              }}
            />
            {screen === "settings-withdraw" ? (
              <SettingsWithdrawModal
                onCancel={() => setScreen("settings-privacy")}
                onWithdraw={() => setScreen("auth")}
              />
            ) : null}
          </main>
        </Shell>
      );

    if (screen === "my-profile")
      return (
        <Shell>
          <main className="screen my-screen my-profile-screen">
            <MyHeader title="프로필 수정" onBack={() => setScreen("my")} />
            <section className="my-profile-form">
              <button className="my-avatar-editor" aria-label="프로필 이미지 변경">≋<small>사진</small></button>
              <p className="my-image-help">프로필 이미지 변경</p>
              <TextInput
                label="닉네임"
                value={profileNickname}
                maxLength={10}
                onChange={(event) => {
                  setProfileNickname(event.target.value);
                  setNicknameChecked(null);
                }}
                error={profileError || undefined}
                trailing={
                  <button
                    type="button"
                    onClick={() => setNicknameChecked(profileNickname.trim() !== "주파")}
                  >
                    중복 확인
                  </button>
                }
              />
              {nicknameChecked === true && !profileError ? (
                <p className="my-field-success">사용 가능한 닉네임이에요.</p>
              ) : null}
              <label className="my-textarea-field">
                <span>소개</span>
                <textarea
                  value={profileBio}
                  maxLength={80}
                  onChange={(event) => setProfileBio(event.target.value)}
                  placeholder="나를 소개하는 짧은 문장을 적어 주세요."
                />
                <small>{profileBio.length} / 80</small>
              </label>
              <div className="my-profile-notice">프로필 정보는 서비스 안에서만 사용되며, 언제든 수정할 수 있어요.</div>
            </section>
            <Button
              className="my-cta"
              variant="blue"
              disabled={!!profileError || nicknameChecked !== true}
              onClick={() => {
                const savedNickname = profileNickname.trim();
                try {
                  window.localStorage.setItem("zupa-profile-nickname", savedNickname);
                } catch {
                  // Saving a profile should still succeed when local storage is unavailable.
                }
                setProfileToast(true);
              }}
            >
              저장
            </Button>
            {profileToast ? <div className="my-toast" role="status">프로필을 저장했어요.</div> : null}
          </main>
        </Shell>
      );

    if (screen === "my-records" || screen === "my-record-loading")
      return (
        <Shell>
          <main className="screen my-screen my-records-screen">
            <MyHeader title="지난 기록" onBack={() => setScreen("my")} />
            {screen === "my-record-loading" ? <MyRecordSkeleton /> : <MyRecordList onOpen={() => openReport("my-records")} onEmpty={() => setScreen("my-record-empty")} />}
            <HomeBottomNav active="my" onNavigate={setScreen} />
          </main>
        </Shell>
      );

    if (screen === "my-record-empty")
      return (
        <Shell>
          <main className="screen my-screen my-empty-screen">
            <MyHeader title="지난 기록" onBack={() => setScreen("my")} />
            <MyEmptyRecords onStart={() => setScreen("photos")} />
            <HomeBottomNav active="my" onNavigate={setScreen} />
          </main>
        </Shell>
      );

    if (screen === "my-stickers" || screen === "my-sticker-detail")
      return (
        <Shell>
          <main className="screen my-screen my-stickers-screen">
            <MyHeader title={screen === "my-sticker-detail" ? "스티커 상세" : "스티커 보관함"} onBack={() => setScreen("my")} />
            {screen === "my-sticker-detail" ? (
              <MyStickerDetail onUse={() => setScreen("decorate")} />
            ) : (
              <MyStickerVault onOpen={() => setScreen("my-sticker-detail")} />
            )}
            <HomeBottomNav active="my" onNavigate={setScreen} />
          </main>
        </Shell>
      );

    if (screen === "my-purchases")
      return (
        <Shell>
          <main className="screen my-screen my-purchases-screen">
            <MyHeader title="구매 내역" onBack={() => setScreen("my")} />
            <MyPurchaseList onOpen={() => setScreen("market-detail")} />
            <HomeBottomNav active="my" onNavigate={setScreen} />
          </main>
        </Shell>
      );

    if (screen === "my-withdraw-info")
      return (
        <Shell>
          <main className="screen my-screen my-withdraw-screen">
            <MyHeader title="회원 탈퇴" onBack={() => setScreen("my-profile")} />
            <WithdrawInfo onContinue={() => setScreen("my-withdraw-confirm")} />
          </main>
        </Shell>
      );

    return (
      <Shell>
        <main className="screen my-screen my-withdraw-screen">
          <MyHeader title="회원 탈퇴" onBack={() => setScreen("my-withdraw-info")} />
          <WithdrawConfirm
            phrase={withdrawPhrase}
            reason={withdrawReason}
            agreed={withdrawConfirmed}
            onPhrase={setWithdrawPhrase}
            onReason={setWithdrawReason}
            onAgreed={setWithdrawConfirmed}
            onWithdraw={() => setScreen("auth")}
          />
        </main>
      </Shell>
    );
  }

  if (
    screen === "market" ||
    screen === "market-filter" ||
    screen === "market-empty" ||
    screen === "market-detail" ||
    screen === "market-loading" ||
    screen === "market-success" ||
    screen === "market-failure" ||
    screen === "market-network"
  ) {
    const selectedItem =
      MARKET_ITEMS.find((item) => item.id === selectedMarketItem) ??
      MARKET_ITEMS[0];
    const visibleItems = MARKET_ITEMS.filter((item) => {
      const matchesType = marketType === "전체" || item.type === marketType;
      const matchesPrice =
        marketPrice === "전체" ||
        (marketPrice === "무료" && item.free);
      return matchesType && matchesPrice;
    });
    const applyFilters = () =>
      setScreen(visibleItems.length ? "market" : "market-empty");

    if (screen === "market")
      return (
        <Shell>
          <main className="screen market-screen">
            <MarketHeader onBack={() => setScreen("home")} />
            <MarketList
              items={visibleItems}
              type={marketType}
              onOpenFilter={() => setScreen("market-filter")}
              onOpenItem={(id) => {
                setSelectedMarketItem(id);
                setScreen("market-detail");
              }}
            />
            <HomeBottomNav active="market" onNavigate={setScreen} />
          </main>
        </Shell>
      );

    if (screen === "market-filter")
      return (
        <Shell>
          <main className="screen market-screen market-filter-screen">
            <MarketHeader onBack={() => setScreen("market")} title="탐색 필터" />
            <MarketFilter
              type={marketType}
              price={marketPrice}
              sort={marketSort}
              onType={setMarketType}
              onPrice={setMarketPrice}
              onSort={setMarketSort}
              onReset={() => {
                setMarketType("전체");
                setMarketPrice("전체");
                setMarketSort("신상품");
              }}
            />
            <Button className="market-cta" variant="blue" onClick={applyFilters}>
              필터 적용하기
            </Button>
          </main>
        </Shell>
      );

    if (screen === "market-empty")
      return (
        <Shell>
          <main className="screen market-screen market-empty-screen">
            <MarketHeader onBack={() => setScreen("home")} />
            <MarketEmpty
              onReset={() => {
                setMarketType("전체");
                setMarketPrice("전체");
                setMarketSort("신상품");
                setScreen("market");
              }}
            />
            <HomeBottomNav active="market" onNavigate={setScreen} />
          </main>
        </Shell>
      );

    if (screen === "market-detail")
      return (
        <Shell>
          <main className="screen market-screen market-detail-screen">
            <MarketHeader onBack={() => setScreen("market")} title="무료 콘텐츠" />
            <MarketDetail
              item={selectedItem}
              onPurchase={() => setScreen("market-success")}
            />
          </main>
        </Shell>
      );

    if (screen === "market-loading")
      return (
        <Shell>
          <main className="screen market-screen market-loading-screen">
            <MarketHeader onBack={() => setScreen("market-detail")} title="상품 안내" />
            <div className="market-loading-backdrop" aria-hidden="true" />
            <section className="market-loading-sheet" aria-live="polite">
              <span className="market-loading-spinner" />
              <h1>구매를 준비하고 있어요</h1>
              <p>결제 정보를 안전하게 확인하고 있어요.</p>
              <Button
                className="market-cta"
                variant="blue"
                onClick={() => setScreen("market-success")}
              >
                구매 완료로 진행하기
              </Button>
              <button className="market-text-button" onClick={() => setScreen("market-failure")}>
                실패 상태 보기
              </button>
              <button className="market-text-button" onClick={() => setScreen("market-network")}>
                연결 오류 보기
              </button>
            </section>
          </main>
        </Shell>
      );

    const outcome: {
      tone: "success" | "failure" | "network";
      icon: string;
      title: string;
      description: string;
      primary: string;
      primaryAction: () => void;
      secondary: string;
    } =
      screen === "market-success"
        ? {
            tone: "success",
            icon: "✓",
            title: "구매가 완료되었어요",
            description: "선택한 상품을 이제 기록에서 바로 사용할 수 있어요.",
            primary: "스티커 보관함 보기",
            primaryAction: () => setScreen("home"),
            secondary: "마켓으로 돌아가기",
          }
        : screen === "market-failure"
          ? {
              tone: "failure",
              icon: "×",
              title: "구매를 완료하지 못했어요",
              description: "결제 정보를 다시 확인한 뒤 한 번 더 시도해 주세요.",
              primary: "다시 시도",
              primaryAction: () => setScreen("market-loading"),
              secondary: "상품 상세로",
            }
          : {
              tone: "network",
              icon: "⌁",
              title: "연결을 확인해 주세요",
              description: "네트워크 상태가 안정되면 다시 상품을 확인할 수 있어요.",
              primary: "상태 다시 확인",
              primaryAction: () => setScreen("market-detail"),
              secondary: "마켓으로",
            };

    return (
      <Shell>
        <main className="screen market-screen market-outcome-screen">
          <MarketHeader onBack={() => setScreen("market-detail")} title="상품 안내" />
          <MarketOutcome
            {...outcome}
            onSecondary={() => setScreen(outcome.secondary === "마켓으로" ? "market" : "market-detail")}
          />
        </main>
      </Shell>
    );
  }

  if (screen === "mock-record") {
    const mockContent = {
      "mock-record": ["기록", "내가 남긴 기록을 한눈에 모아볼 수 있어요."],
    } as const;
    const [title, description] = mockContent[screen];
    return (
      <Shell>
        <main className="screen mock-screen">
          <AppHeader title={title} onBack={() => setScreen("home")} />
          <section className="mock-card">
            <span>COMING SOON</span>
            <h1>{title}</h1>
            <p>{description}</p>
            <button className="btn primary" onClick={() => setScreen("home")}>
              홈으로 돌아가기
            </button>
          </section>
          <HomeBottomNav active={screen} onNavigate={setScreen} />
        </main>
      </Shell>
    );
  }

  if (screen === "photos" || screen === "diary" || screen === "decorate")
    return (
      <Shell>
        <RecordFlow
          initialStep={screen === "decorate" ? "decorate" : "write"}
          initialBody={editingTodayRecord?.content}
          initialPhotoUrls={editingTodayRecord?.photoUrls}
          isEditing={Boolean(editingTodayRecord)}
          onClose={() => setScreen("home")}
          onAnalyze={({ body, photoCount, photoUrls }) => {
            const now = new Date().toISOString();
            const previous = editingTodayRecord;
            const reportVersion = (previous?.reportVersion ?? 0) + 1;
            setTodayRecord({
              id: previous?.id ?? crypto.randomUUID(),
              recordDate: koreaDateKey(),
              content: body,
              photoUrls,
              reportVersion,
              createdAt: previous?.createdAt ?? now,
              updatedAt: now,
              decoratedImages: [
                ...(previous?.decoratedImages ?? []).map((image) => ({ ...image, isCurrentVersion: false })),
                ...(photoUrls[0] ? [{ imageUrl: photoUrls[0], sourceReportVersion: reportVersion, isCurrentVersion: true, createdAt: now }] : []),
              ],
            });
            setEditingTodayRecord(null);
            setDiary(body);
            setPhotos(photoCount);
            setReportPhotoUrls(photoUrls);
            void analyze(body);
          }}
        />
      </Shell>
    );

  if ((screen as string) === "photos")
    return (
      <Shell>
        <main className="screen">
          {header("home")}
          {progress}
          <h1>
            오늘을 담은 사진을
            <br />
            골라주세요
          </h1>
          <p className="muted">1~4장 · 사진은 AI 분석에 사용하지 않아요.</p>
          <div className="photo-grid">
            {[0, 1, 2, 3].map((i) => (
              <button
                className={`photo-slot ${i < photos ? "filled" : ""}`}
                onClick={() => setPhotos(i < photos ? i : Math.min(4, i + 1))}
                key={i}
              >
                {i < photos ? `사진 ${i + 1}` : "＋"}
              </button>
            ))}
          </div>
          <div className="grow" />
          <button
            className="btn primary"
            disabled={photos === 0}
            onClick={() => setScreen("diary")}
          >
            {photos ? `${photos}장으로 계속` : "사진을 선택해 주세요"}
          </button>
        </main>
      </Shell>
    );

  if ((screen as string) === "diary")
    return (
      <Shell>
        <main className="screen">
          {header("photos")}
          {progress}
          <h1>
            오늘은 어떤
            <br />
            하루였나요?
          </h1>
          <textarea
            className="input"
            value={diary}
            maxLength={1000}
            onChange={(e) => setDiary(e.target.value)}
            placeholder="개발 중에는 실제 개인정보나 민감한 내용 대신 가상의 일기를 작성해 주세요."
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <span className="muted">
              {diary.length < 50
                ? "50자부터 분석할 수 있어요"
                : diary.length < 120
                  ? "분석할 수 있어요"
                  : diary.length < 200
                    ? "꽤 정확해져요"
                    : "감정을 깊이 읽을 수 있어요"}
            </span>
            <b>{diary.length}/1,000</b>
          </div>
          <div className="grow" />
          <button
            className="btn primary"
            disabled={diary.length < 50}
            onClick={() => setScreen("decorate")}
          >
            꾸미러 가기
          </button>
        </main>
      </Shell>
    );

  if ((screen as string) === "decorate")
    return (
      <Shell>
        <main className="screen">
          {header("diary")}
          {progress}
          <h1>
            오늘의 장면을
            <br />
            꾸며보세요
          </h1>
          <div className="template">
            <div className="pic p1" />
            <div className="pic p2" />
            <div className="pic p3" />
            <div className="sticker">♥</div>
          </div>
          <div className="chips">
            <button className="chip active">사진</button>
            <button className="chip">스티커</button>
            <button className="chip">텍스트</button>
            <button className="chip">템플릿</button>
          </div>
          <div className="grow" />
          <button className="btn primary" onClick={() => void analyze()}>
            저장하고 감정 분석하기
          </button>
        </main>
      </Shell>
    );

  if (screen === "loading")
    return (
      <Shell>
        <main className="screen">
          {header()}
          <div className="loading-orbit" />
          <h1 style={{ textAlign: "center" }}>
            오늘의 감정 주파수를
            <br />
            찾고 있어요
          </h1>
          <p className="muted" style={{ textAlign: "center" }}>
            기록은 먼저 안전하게 저장했어요.
            <br />
            잠시만 기다려 주세요.
          </p>
        </main>
      </Shell>
    );

  if (screen === "fail")
    return (
      <Shell>
        <main className="screen">
          {header("home")}
          <div
            className="grow"
            style={{ display: "grid", placeItems: "center" }}
          >
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 44 }}>↻</div>
              <h2>분석을 마치지 못했어요</h2>
              <p className="muted">
                {error}
                <br />
                기록은 그대로 보관되어 있어요.
              </p>
              <button className="btn primary" onClick={() => void analyze()}>
                다시 시도하기
              </button>
              <button
                className="btn ghost"
                style={{ marginTop: 10 }}
                onClick={() => setScreen("home")}
              >
                홈으로
              </button>
            </div>
          </div>
        </main>
      </Shell>
    );

  if (
    screen === "report" ||
    screen === "report-edit" ||
    screen === "report-share" ||
    screen === "report-record" ||
    screen === "report-loading" ||
    screen === "report-error"
  ) {
    if (screen === "report-loading" || reportLoading || !reportReady)
      return (
        <Shell>
          <main className="screen report-screen">
            <ReportHeader title="오늘의 리포트" onBack={() => setScreen(reportReturnScreen)} />
            <ReportLoadingState />
          </main>
        </Shell>
      );

    if (screen === "report-error")
      return (
        <Shell>
          <main className="screen report-screen report-error-screen">
            <ReportHeader title="오늘의 리포트" onBack={() => setScreen(reportReturnScreen)} />
            <section className="report-error-card">
              <span>!</span><h1>리포트를 불러오지 못했어요</h1><p>{reportError || "잠시 후 다시 시도해 주세요."}</p>
              <Button className="report-cta" variant="blue" onClick={() => { setReportError(""); setReportReady(true); setScreen("report"); }}>다시 시도</Button>
            </section>
          </main>
        </Shell>
      );

    if (screen === "report-edit")
      return (
        <Shell>
          <main className="screen report-screen report-edit-screen">
            <ReportHeader title="리포트 수정" onBack={leaveEditor} action={{ label: "취소", onClick: leaveEditor }} />
            <ReportEditor
              value={draftReportText}
              onChange={(value) => { setDraftReportText(value); setIsEditing(true); }}
              onSave={() => void saveReport()}
              onCancel={leaveEditor}
              isSaving={isSavingReport}
            />
            {showUnsavedWarning ? (
              <UnsavedChangesModal
                onKeepEditing={() => setShowUnsavedWarning(false)}
                onDiscard={() => {
                  setDraftReportText(savedReportText);
                  setIsEditing(false);
                  setShowUnsavedWarning(false);
                  setScreen("report");
                }}
              />
            ) : null}
          </main>
        </Shell>
      );

    if (screen === "report-share")
      return (
        <Shell>
          <main className="screen report-screen report-share-screen">
            <ReportHeader title="저장·공유" onBack={() => setScreen("report")} />
            <section className="report-share-content">
              <h1>어떤 모습으로 남길까요?</h1>
              <p>원하는 이미지 형태를 고르면 미리보기와 저장 이미지에 함께 반영돼요.</p>
              <div className="share-format-grid">
                <ShareFormatCard format="report-card" active={selectedShareFormat === "report-card"} onSelect={() => setSelectedShareFormat("report-card")} />
                <ShareFormatCard format="diary-card" active={selectedShareFormat === "diary-card"} onSelect={() => setSelectedShareFormat("diary-card")} />
              </div>
              <SharePreview report={reportData} format={selectedShareFormat} />
            </section>
            {saveError ? <ErrorMessage>{saveError}</ErrorMessage> : null}
            <div className="report-share-actions">
              <Button className="report-cta" variant="outline" disabled={isSavingImage || isRenderingImage || isSharing} onClick={() => void saveReportImage()}>{isSavingImage || isRenderingImage ? "이미지 생성 중…" : "이미지 저장"}</Button>
              <Button className="report-cta" variant="blue" disabled={isSavingImage || isRenderingImage || isSharing} onClick={() => void shareReport()}>{isSharing ? "공유 준비 중…" : "공유하기"}</Button>
            </div>
            {shareUnsupported ? <SaveGuideBottomSheet onClose={() => setShareUnsupported(false)} /> : null}
          </main>
        </Shell>
      );

    if (screen === "report-record")
      return (
        <Shell>
          <main className="screen report-screen report-record-screen">
            <ReportHeader title="오늘의 기록" onBack={() => setScreen("report")} />
            <ShareRecordCard report={reportData} />
            <div className="report-share-actions"><Button className="report-cta" variant="blue" onClick={() => void saveReportImage()}>사진으로 저장</Button><Button className="report-cta" variant="outline" onClick={() => setScreen("home")}>홈으로 이동</Button></div>
          </main>
        </Shell>
      );

    return (
      <Shell>
        <main className="screen report-screen">
          <ReportHeader title="오늘의 리포트" onBack={() => setScreen(reportReturnScreen)} action={{ label: "수정", onClick: () => { setDraftReportText(savedReportText); setIsEditing(true); setScreen("report-edit"); } }} />
          <div className="report-content">
            <ReportSummaryCard report={reportData} />
            <FrequencyCard report={reportData} />
            <EmotionChart report={reportData} />
            <ReportAccordion report={reportData} />
            <button className="report-record-link" onClick={() => setScreen("report-record")}>공유용 오늘의 기록 카드 보기 ›</button>
          </div>
          {saveError ? <ErrorMessage>{saveError}</ErrorMessage> : null}
          <div className="report-bottom-actions">
            <Button className="report-cta" variant="outline" disabled={isSavingImage || isRenderingImage} onClick={() => void saveReportImage()}>{isSavingImage ? "저장 중…" : "저장"}</Button>
            <Button className="report-cta" variant="blue" onClick={() => setScreen("report-share")}>공유</Button>
          </div>
          {saveSuccess ? <div className="report-toast" role="status">저장 또는 공유를 완료했어요.</div> : null}
        </main>
      </Shell>
    );
  }

  if (screen === "crisis")
    return (
      <Shell>
        <main className="screen">
          {header("home")}
          <div className="eyebrow">YOUR RECORD IS SAVED</div>
          <h1>
            오늘의 기록을
            <br />
            남겨줘서 고마워요.
          </h1>
          <div className="card">
            <p>{analysis?.report_text}</p>
            <div className="soft-card">
              <b>자살예방 상담전화 109</b>
              <p className="muted">
                혼자 감당하기 어려운 마음이라면 언제든 이야기를 들어줘요.
              </p>
            </div>
          </div>
          <div className="grow" />
          <button className="btn primary">사진 결과물 저장</button>
          <p className="dev-note">
            위기 리포트에는 수정·재분석·공유 버튼을 렌더링하지 않습니다.
          </p>
        </main>
      </Shell>
    );

  return null;
}

function LandingCanvas({ wave }: { wave: LandingWave }) {
  return (
    <div className="landing-canvas" aria-hidden="true">
      <header className="landing-canvas__header">Zupa</header>
      <div className="landing-journal">
        <i className="landing-sheet landing-sheet--pink" />
        <i className="landing-sheet landing-sheet--mint" />
        <i className="landing-tape" />
        <div className="landing-journal__grid">
          <i />
          <i />
          <i />
          <i />
        </div>
        <b key={wave.hz} className="landing-wave-badge" style={{ background: wave.color }}>
          {wave.typeName} · {wave.hz}Hz
        </b>
      </div>
      <section className="landing-chart">
        <svg className="landing-line-chart" viewBox="0 0 320 122" role="img" aria-label={`${wave.typeName} ${wave.hz}Hz emotion curve`}>
          <line x1="24" y1="25" x2="300" y2="25" /><line x1="24" y1="55" x2="300" y2="55" /><line x1="24" y1="85" x2="300" y2="85" />
          <path key={`area-${wave.hz}`} className="landing-line-chart__area" style={{ fill: wave.color }} d={`M 30 ${96 - wave.timeline[0] * .7} L 120 ${96 - wave.timeline[1] * .7} L 210 ${96 - wave.timeline[2] * .7} L 300 ${96 - wave.timeline[3] * .7} L 300 100 L 30 100 Z`} />
          <path key={`line-${wave.hz}`} className="landing-line-chart__curve" d={`M 30 ${96 - wave.timeline[0] * .7} L 120 ${96 - wave.timeline[1] * .7} L 210 ${96 - wave.timeline[2] * .7} L 300 ${96 - wave.timeline[3] * .7}`} />
          {wave.timeline.map((value, index) => <circle key={`${wave.hz}-${index}`} cx={30 + index * 90} cy={96 - value * .7} r="4" style={{ fill: wave.color }} />)}
        </svg>
        <i className="landing-chart__axis" />
        <i className="landing-chart__line landing-chart__line--one" />
        <i className="landing-chart__line landing-chart__line--two" />
        <i className="landing-chart__baseline" />
        <div
          key={wave.hz}
          className="landing-waveform"
          aria-label={`${wave.typeName} ${wave.hz}Hz 파동`}
        >
          {wave.bars.map((height, index) => (
            <i
              key={`${wave.hz}-${index}`}
              style={{
                height: `${height}%`,
                backgroundColor: wave.color,
                animationDelay: `${index * -90}ms`,
              }}
            />
          ))}
        </div>
        <div className="landing-chart-labels"><span>아침</span><span>낮</span><span>저녁</span><span>밤</span></div>
      </section>
      <div className="landing-copy">
        <h1>오늘의 마음을<br />주파수로 남겨요</h1>
        <p>사진 네 장과 짧은 기록이 나만의 감정 파동이 돼요</p>
      </div>
      <div className="landing-cta-visual">시작하기</div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">{children}</div>;
}

function OnboardingHeader({
  step,
  onBack,
}: {
  step: string;
  onBack?: () => void;
}) {
  return (
    <header className={`onboarding-header ${onBack ? "has-back" : "no-back"}`}>
      {onBack ? (
        <button aria-label="뒤로" onClick={onBack}>
          ‹
        </button>
      ) : null}
      <strong>Zupa</strong>
      <span>{step}</span>
    </header>
  );
}

function OnboardingProgress({ current }: { current: number }) {
  return (
    <div
      className="onboarding-dots"
      aria-label={`온보딩 ${current + 1}단계, 총 4단계`}
    >
      {Array.from({ length: 4 }, (_, index) => (
        <i key={index} className={index === current ? "active" : undefined} />
      ))}
    </div>
  );
}

function OnboardingLead({
  title,
  subtitle,
  align = "left",
}: {
  title: React.ReactNode;
  subtitle: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`onboarding-lead is-${align}`}>
      <h1>{title}</h1>
      <p className="ds-body">{subtitle}</p>
    </div>
  );
}

function OnboardingChoiceCard({
  tone,
  icon,
  title,
  description,
}: {
  tone: "pink" | "yellow" | "mint";
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <button type="button" className={`onboarding-card is-${tone}`}>
      <b>
        <span aria-hidden="true">{icon}</span>
        {title}
      </b>
      <span>{description}</span>
    </button>
  );
}

function ConsentOption({
  variant = "default",
  label,
  requirement,
  checked,
  onChange,
  onView,
}: {
  variant?: "default" | "all";
  label: string;
  requirement?: "필수" | "선택";
  checked: boolean;
  onChange: (checked: boolean) => void;
  onView?: () => void;
}) {
  return (
    <div className={`consent-item${variant === "all" ? " is-all" : ""}`}>
      <Checkbox
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      >
        {label}
      </Checkbox>
      {requirement ? <span className={`consent-requirement is-${requirement}`}>{requirement}</span> : null}
      {onView ? (
        <button type="button" onClick={onView} aria-label={`${label} 보기`}>
          보기 ›
        </button>
      ) : null}
    </div>
  );
}

function termsTitle(activeTerms: "privacy" | "age" | "service" | "marketing") {
  const titles = {
    privacy: "개인정보 수집·이용 및 AI 분석 활용 동의",
    age: "만 14세 이상 확인",
    service: "서비스 이용약관",
    marketing: "마케팅 정보 수신 동의",
  } as const;
  return titles[activeTerms];
}

function TermsSheet({
  activeTerms,
  close,
  agree,
}: {
  activeTerms: "privacy" | "age" | "service" | "marketing" | null;
  close: () => void;
  agree: () => void;
}) {
  if (!activeTerms) return null;
  return (
    <div
      className="terms-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <BottomSheet>
        <span className="ds-sheet-handle" />
        <div className="terms-heading">
          <h2 id="terms-title">
            {termsTitle(activeTerms)}
          </h2>
          <button aria-label="약관 닫기" onClick={close}>
            ×
          </button>
        </div>
        {activeTerms === "privacy" ? <PrivacyTerms /> : null}
        {activeTerms === "age" ? <AgeTerms /> : null}
        {activeTerms === "service" ? <ServiceTerms /> : null}
        {activeTerms === "marketing" ? <MarketingTerms /> : null}
        <Button variant="blue" onClick={agree}>
          내용을 확인했고 동의해요
        </Button>
      </BottomSheet>
    </div>
  );
}

function PrivacyTerms() {
  return (
    <div className="terms-copy">
      <p className="terms-notice">
        테스트용 약관 초안입니다. 공개 전 개인정보 처리방침과 이용약관은 법률
        검토를 거쳐 확정됩니다.
      </p>
      <h3>1. 수집·이용 목적</h3>
      <p>
        회원 식별, 계정 관리, 기록 저장, 사진·일기 기반 감정 분석 결과 제공 및
        서비스 안정성 확인을 위해 사용합니다.
      </p>
      <h3>2. 수집 항목</h3>
      <p>
        이메일 주소, 비밀번호 인증 정보, 서비스 이용 기록 및 사용자가 직접
        입력·업로드한 사진과 일기 내용입니다.
      </p>
      <h3>3. AI 분석 활용</h3>
      <p>
        사용자가 분석을 요청한 기록은 분석 결과를 생성하기 위해 AI 처리에 사용될
        수 있습니다. 개발·체험 단계에서는 실제 개인정보나 민감한 일기를 입력하지
        마세요.
      </p>
      <h3>4. 보유 기간과 거부 권리</h3>
      <p>
        원칙적으로 회원 탈퇴 또는 수집 목적 달성 시 지체 없이 삭제합니다. 관계
        법령에 따라 보관이 필요한 경우에는 해당 기간 동안 보관합니다. 동의를
        거부할 수 있으나, 이 경우 기록 분석 서비스 이용이 제한됩니다.
      </p>
    </div>
  );
}

function AgeTerms() {
  return (
    <div className="terms-copy">
      <p className="terms-notice">
        테스트용 고지입니다. 서비스 공개 전 연령 확인 및 미성년자 보호 절차를
        최종 검토합니다.
      </p>
      <h3>만 14세 이상 확인</h3>
      <p>
        주파는 만 14세 이상 사용자를 대상으로 합니다. 본인은 만 14세 이상이며,
        제공한 정보가 사실임을 확인합니다.
      </p>
      <p>
        만 14세 미만 사용자는 법정대리인의 동의 절차가 마련되기 전까지 회원가입
        및 서비스 이용이 제한됩니다.
      </p>
    </div>
  );
}

function ServiceTerms() {
  return (
    <div className="terms-copy">
      <p className="terms-notice">
        테스트용 이용약관 초안입니다. 공개 전 서비스 정책과 법률 검토를 거쳐
        최종 확정됩니다.
      </p>
      <h3>1. 서비스의 목적</h3>
      <p>
        주파는 사용자가 사진과 기록으로 하루를 남기고, 감정 분석 결과를 확인할
        수 있도록 돕는 모바일 웹 서비스입니다.
      </p>
      <h3>2. 계정과 이용</h3>
      <p>
        사용자는 정확한 가입 정보를 제공하고 계정을 안전하게 관리해야 합니다.
        타인의 권리를 침해하거나 서비스 운영을 방해하는 이용은 제한될 수 있습니다.
      </p>
      <h3>3. 콘텐츠와 서비스 변경</h3>
      <p>
        사용자가 작성한 기록의 권리는 사용자에게 있으며, 서비스는 기능 개선과
        안정적인 운영을 위해 사전 안내 후 일부 기능을 변경하거나 종료할 수 있습니다.
      </p>
    </div>
  );
}

function MarketingTerms() {
  return (
    <div className="terms-copy">
      <p className="terms-notice">
        테스트용 마케팅 수신 동의 초안입니다. 공개 전 발송 매체, 보유 기간 및
        수신 거부 절차를 법률 검토 후 확정합니다.
      </p>
      <h3>1. 수신 목적</h3>
      <p>
        주파의 신규 기능, 이벤트, 스티커 팩 및 프로모션 등 광고성 정보 안내를
        위해 이메일 또는 앱 알림으로 정보를 전송할 수 있습니다.
      </p>
      <h3>2. 수집·이용 항목과 보유 기간</h3>
      <p>
        이메일 주소와 마케팅 수신 동의 이력을 사용하며, 동의 철회 또는 회원 탈퇴
        시까지 보유합니다. 별도 제3자에게 제공하지 않습니다.
      </p>
      <h3>3. 선택 동의와 철회</h3>
      <p>
        이 동의는 선택 사항이며, 동의하지 않아도 주파의 기본 서비스 이용에는
        제한이 없습니다. 설정 화면 또는 안내 메일의 수신 거부 기능으로 언제든
        철회할 수 있습니다.
      </p>
    </div>
  );
}

function HomeBottomNav({
  active,
  onNavigate,
}: {
  active: "home" | "photos" | "mock-record" | "market" | "my";
  onNavigate: (screen: Screen) => void;
}) {
  const items: Array<{
    id: "home" | "photos" | "market" | "my";
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "home",
      label: "홈",
      icon: <path d="m3.5 10.2 8.5-7.1 8.5 7.1v9.3a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM9 21v-6.7h6V21" />,
    },
    {
      id: "photos",
      label: "기록",
      icon: <><path d="M6.5 5.5h10v13.8a1.7 1.7 0 0 1-1.7 1.7H6.5" /><path d="M6.5 5.5v15.5M3.8 7.2h3.5M3.8 11h3.5M3.8 14.8h3.5M14.7 5.1l4-2.1 1.2 1.2-4.1 4.1-2.3.7.7-2.3z" /></>,
    },
    {
      id: "market",
      label: "마켓",
      icon: <><path d="M5.3 8.2h13.4v11.1A1.7 1.7 0 0 1 17 21H7a1.7 1.7 0 0 1-1.7-1.7z" /><path d="M7.2 8.2 8.8 4h6.4l1.6 4.2M9.2 12.4c.7 1.2 1.6 1.8 2.8 1.8s2.1-.6 2.8-1.8" /></>,
    },
    {
      id: "my",
      label: "마이",
      icon: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="9.2" r="3" /><path d="M6.9 18.6c.8-2.9 2.5-4.4 5.1-4.4s4.3 1.5 5.1 4.4" /></>,
    },
  ];
  return (
    <nav className="nav home-nav" aria-label="주 메뉴">
      {items.map((item) => (
        <button
          className={active === item.id ? "active" : ""}
          key={item.id}
          onClick={() => {
            if (item.id === "photos") {
              window.dispatchEvent(new Event("zupa:record-entry"));
              return;
            }
            onNavigate(item.id);
          }}
        >
          <b className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">{item.icon}</svg>
          </b>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function MarketHeader({
  onBack,
  title = "마켓",
}: {
  onBack?: () => void;
  title?: string;
}) {
  return (
    <header className="market-header">
      {onBack ? (
        <button className="market-back" aria-label="뒤로" onClick={onBack}>
          ‹
        </button>
      ) : (
        <span className="market-header-mark">MARKET</span>
      )}
      <h1>{title}</h1>
      <span aria-hidden="true" />
    </header>
  );
}

function MarketList({
  items,
  type,
  onOpenFilter,
  onOpenItem,
}: {
  items: readonly (typeof MARKET_ITEMS)[number][];
  type: "전체" | "템플릿" | "스티커";
  onOpenFilter: () => void;
  onOpenItem: (id: string) => void;
}) {
  return (
    <div className="market-list">
      <button className="market-feature" onClick={onOpenFilter}>
        <span>
          마음에 붙이는 새 신호
          <small>오늘의 기록을 더 나답게 꾸며 보세요.</small>
        </span>
        <b aria-hidden="true">✧</b>
      </button>
      <div className="market-filter-row" aria-label="상품 필터">
        <button className={type === "템플릿" ? "active" : ""} onClick={onOpenFilter}>템플릿</button>
        <button className={type === "스티커" ? "active" : ""} onClick={onOpenFilter}>스티커</button>
        <button onClick={onOpenFilter}>무료</button>
        <button onClick={onOpenFilter}>신상품</button>
      </div>
      <div className="market-grid">
        {items.map((item) => (
          <button key={item.id} className="market-product" onClick={() => onOpenItem(item.id)}>
            <span className={`market-product-art is-${item.color}`}>
              <i>{item.id === "calm-flower" ? "✿" : item.id === "twinkle-star" ? "✦" : item.id === "soft-heart" ? "♡" : item.id === "lucky-leaf" ? "♧" : item.id === "mood-ribbon" ? "〰" : item.type === "스티커" ? "☁" : "✧"}</i>
              <em>{item.label}</em>
            </span>
            <b>{item.title}</b>
            <small>{item.type} · 미리보기</small>
            <strong>{item.price}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function MarketFilter({
  type,
  price,
  sort,
  onType,
  onPrice,
  onSort,
  onReset,
}: {
  type: "전체" | "템플릿" | "스티커";
  price: "전체" | "무료";
  sort: "신상품" | "인기순";
  onType: (value: "전체" | "템플릿" | "스티커") => void;
  onPrice: (value: "전체" | "무료") => void;
  onSort: (value: "신상품" | "인기순") => void;
  onReset: () => void;
}) {
  return (
    <section className="market-filter-panel">
      <FilterGroup label="상품 타입" options={["전체", "템플릿", "스티커"]} value={type} onChange={onType} />
      <FilterGroup label="정렬" options={["신상품", "인기순"]} value={sort} onChange={onSort} />
      <FilterGroup label="이용 요금" options={["전체", "무료"]} value={price} onChange={onPrice} />
      <button className="market-reset" onClick={onReset}>선택한 필터 모두 초기화</button>
    </section>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="market-filter-group">
      <h2>{label}</h2>
      <div>
        {options.map((option) => (
          <button key={option} className={option === value ? "active" : ""} onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function MarketEmpty({ onReset }: { onReset: () => void }) {
  return (
    <section className="market-empty">
      <span aria-hidden="true">▢</span>
      <h1>조건에 맞는 상품이 없어요</h1>
      <p>필터를 조금 넓혀 다른 상품을 찾아 볼까요?</p>
      <Button variant="outline" onClick={onReset}>필터 초기화</Button>
    </section>
  );
}

function MarketDetail({
  item,
  onPurchase,
}: {
  item: (typeof MARKET_ITEMS)[number];
  onPurchase: () => void;
}) {
  return (
    <section className="market-detail">
      <div className={`market-detail-art is-${item.color}`}>
        <span>{item.type === "스티커" ? "☁" : "✧"}</span>
        <em>{item.label}</em>
      </div>
      <p className="market-detail-badge">{item.type.toUpperCase()} · 새 상품</p>
      <h2>{item.title}</h2>
      <p>{item.description}</p>
      <div className="market-detail-tools" aria-label="상품 구성 미리보기">
        <span>☆</span><span>♡</span><span>ϟ</span><span>≋</span>
      </div>
      <div className="market-detail-price">
        <b>{item.price}</b>
        <span>{item.free ? "바로 내 서랍에 담을 수 있어요." : "결제 후 바로 사용할 수 있어요."}</span>
      </div>
      <Button className="market-cta" variant="blue" onClick={onPurchase}>
        {item.free ? "무료로 받기" : "구매하기"}
      </Button>
    </section>
  );
}

function MarketOutcome({
  tone,
  icon,
  title,
  description,
  primary,
  secondary,
  primaryAction,
  onSecondary,
}: {
  tone: "success" | "failure" | "network";
  icon: string;
  title: string;
  description: string;
  primary: string;
  secondary: string;
  primaryAction: () => void;
  onSecondary: () => void;
}) {
  return (
    <section className="market-outcome">
      <span className={`market-outcome-icon is-${tone}`}>{icon}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="market-outcome-actions">
        <Button className="market-cta" variant="blue" onClick={primaryAction}>{primary}</Button>
        <Button className="market-cta" variant="outline" onClick={onSecondary}>{secondary}</Button>
      </div>
    </section>
  );
}

function MyHeader({
  title = "마이",
  onBack,
  onSettings,
}: {
  title?: string;
  onBack?: () => void;
  onSettings?: () => void;
}) {
  return (
    <header className="my-header">
      {onBack ? (
        <button aria-label="뒤로" onClick={onBack}>‹</button>
      ) : (
        <span className="my-header-mark">MY ZUPA</span>
      )}
      <h1>{title}</h1>
      {onSettings ? <button className="my-header-settings" aria-label="설정" onClick={onSettings}>⚙</button> : <span aria-hidden="true">⚙</span>}
    </header>
  );
}

function MyDashboard({
  nickname,
  onProfile,
  onRecords,
  onStickers,
  onPurchases,
  onSettings,
  onLogout,
}: {
  nickname: string;
  onProfile: () => void;
  onRecords: () => void;
  onStickers: () => void;
  onPurchases: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="my-dashboard">
      <button className="my-profile-card" onClick={onProfile}>
        <span className="my-avatar">≋</span>
        <span>
          <b>{nickname}</b>
          <small>zupa@zupa.kr</small>
          <em>가입한 지 28일</em>
        </span>
        <i>✎</i>
      </button>
      <div className="my-stats">
        <button onClick={onRecords}><b>08</b><span>지난 기록</span></button>
        <button onClick={onStickers}><b>32</b><span>스티커 보관함</span></button>
        <button onClick={onPurchases}><b>03</b><span>구매 내역</span></button>
      </div>
      <div className="my-menu-list">
        <MyMenuRow icon="♙" title="계정 정보" caption="프로필과 로그인 정보" onClick={onProfile} />
        <MyMenuRow icon="⌁" title="지난 기록" caption="내가 남긴 마음의 흐름" onClick={onRecords} />
        <MyMenuRow icon="✧" title="스티커 보관함" caption="획득한 스티커 32개" onClick={onStickers} />
        <MyMenuRow icon="▢" title="구매 내역" caption="최근 구매한 콘텐츠" onClick={onPurchases} />
        <MyMenuRow icon="⚙" title="설정" caption="계정과 서비스 관리" onClick={onSettings} />
      </div>
      <Button className="my-logout-button" variant="outline" onClick={onLogout}>로그아웃</Button>
    </div>
  );
}

function MyMenuRow({
  icon,
  title,
  caption,
  onClick,
}: {
  icon: string;
  title: string;
  caption?: string;
  onClick: () => void;
}) {
  return (
    <button className="my-menu-row" onClick={onClick}>
      <i aria-hidden="true">{icon}</i>
      <span><b>{title}</b>{caption ? <small>{caption}</small> : null}</span>
      <em aria-hidden="true">›</em>
    </button>
  );
}

function SettingsContent({
  screen,
  onProfile,
  onAccount,
  onPrivacy,
  onSupport,
  onApp,
  onWithdraw,
  onExternal,
}: {
  screen: Screen;
  onProfile: () => void;
  onAccount: () => void;
  onPrivacy: () => void;
  onSupport: () => void;
  onApp: () => void;
  onWithdraw: () => void;
  onExternal: (target: "contact" | "faq" | "bug") => void;
}) {
  if (screen === "settings")
    return <section className="settings-content settings-content--compact"><div className="settings-list"><MyMenuRow icon="◉" title="계정 정보 설정" onClick={onAccount} /><MyMenuRow icon="▣" title="개인정보" onClick={onPrivacy} /><MyMenuRow icon="?" title="고객센터" onClick={onSupport} /><MyMenuRow icon="i" title="앱 정보" onClick={onApp} /></div></section>;
  if (screen === "settings-account")
    return <section className="settings-content"><p className="settings-intro">사용자 계정 정보를 관리합니다.</p><div className="settings-group"><MyMenuRow icon="◉" title="프로필 수정" caption="프로필 이미지와 닉네임" onClick={onProfile} /><MyMenuRow icon="@" title="이메일 변경" caption="MVP에서는 준비 중이에요" onClick={() => undefined} /><MyMenuRow icon="⌁" title="비밀번호 변경" caption="MVP에서는 준비 중이에요" onClick={() => undefined} /></div></section>;
  if (screen === "settings-privacy" || screen === "settings-withdraw")
    return <section className="settings-content"><p className="settings-intro">서비스 이용 및 개인정보 관련 메뉴입니다.</p><div className="settings-group"><MyMenuRow icon="▣" title="개인정보 처리방침" caption="내용 보기" onClick={() => undefined} /><MyMenuRow icon="≡" title="이용약관" caption="내용 보기" onClick={() => undefined} /><MyMenuRow icon="!" title="회원 탈퇴" caption="모든 기록과 계정 정보가 삭제돼요" onClick={onWithdraw} /></div></section>;
  if (screen === "settings-support")
    return <section className="settings-content"><p className="settings-intro">서비스 이용 중 문의와 오류를 접수할 수 있어요.</p><div className="settings-group"><MyMenuRow icon="?" title="FAQ" caption="자주 묻는 질문" onClick={() => onExternal("faq")} /><MyMenuRow icon="✉" title="문의하기" caption="support@zupa.kr" onClick={() => onExternal("contact")} /><MyMenuRow icon="!" title="버그 제보" caption="문제를 알려 주세요" onClick={() => onExternal("bug")} /></div></section>;
  return <section className="settings-content"><div className="settings-version"><span>주파</span><b>Version 0.1.0 Beta</b><small>업데이트 내역은 추후 이곳에서 확인할 수 있어요.</small></div></section>;
}

function SettingsWithdrawModal({ onCancel, onWithdraw }: { onCancel: () => void; onWithdraw: () => void }) {
  return <div className="my-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="settings-withdraw-title"><section className="my-logout-modal settings-withdraw-modal"><span className="my-modal-icon">!</span><h2 id="settings-withdraw-title">회원 탈퇴</h2><p>정말 탈퇴하시겠습니까?<br />탈퇴 시 모든 기록과 계정 정보가 삭제되며 복구할 수 없습니다.</p><div><Button variant="outline" onClick={onCancel}>취소</Button><Button variant="blue" onClick={onWithdraw}>탈퇴하기</Button></div></section></div>;
}

function LogoutSheet({ onCancel, onLogout }: { onCancel: () => void; onLogout: () => void }) {
  return (
    <div className="my-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="logout-title">
      <section className="my-logout-modal">
        <span className="my-modal-icon">↪</span>
        <h2 id="logout-title">로그아웃할까요?</h2>
        <p>로그아웃하면 작성 중인 기록은 저장되지 않을 수 있어요.</p>
        <div><Button variant="outline" onClick={onCancel}>취소</Button><Button variant="blue" onClick={onLogout}>로그아웃</Button></div>
      </section>
    </div>
  );
}

function MyRecordList({ onOpen, onEmpty }: { onOpen: () => void; onEmpty: () => void }) {
  const records = [
    ["07.31", "기억의 만남", "샤워 1일 연속", "✧", "yellow"],
    ["07.30", "조용한 선택", "샤워 1일 연속", "⌁", "mint"],
    ["07.26", "마음이 복잡한 날", "샤워 1일 연속", "◌", "lilac"],
  ];
  return (
    <section className="my-record-list">
      <div className="my-record-summary"><span><b>7월의 파동</b><small>7월 기록 3개</small></span><strong>08</strong></div>
      <div className="my-list-tools"><button className="active">최신</button><button>7월</button><button>전체</button><button onClick={onEmpty}>기록 없음 보기</button></div>
      <div className="my-record-cards">
        {records.map(([date, title, caption, icon, tone]) => (
          <button key={date} onClick={onOpen} className="my-record-card">
            <span className={`my-record-icon is-${tone}`}>{icon}</span>
            <span><small>{date}</small><b>{title}</b><em>{caption}</em></span>
            <i>›</i>
          </button>
        ))}
      </div>
    </section>
  );
}

function MyRecordSkeleton() {
  return (
    <section className="my-record-skeleton" aria-label="지난 기록 불러오는 중">
      <div className="my-skeleton-summary" />
      <div className="my-skeleton-pills"><i /><i /><i /></div>
      {[1, 2, 3].map((item) => <div className="my-skeleton-row" key={item}><i /><span><b /><b /></span></div>)}
      <p>지난 기록을 불러오는 중…</p>
    </section>
  );
}

function MyEmptyRecords({ onStart }: { onStart: () => void }) {
  return (
    <section className="my-empty-records">
      <span aria-hidden="true">▱</span>
      <h2>아직 지난 기록이 없어요</h2>
      <p>첫 기록을 남기면 이곳에서 다시 볼 수 있어요.</p>
      <Button className="my-cta" variant="blue" onClick={onStart}>첫 기록 남기기</Button>
    </section>
  );
}

function MyStickerVault({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="my-sticker-vault">
      <div className="my-vault-summary"><span><b>내 스티커</b><small>보유 스티커 45개</small></span><strong>45</strong></div>
      <div className="my-list-tools"><button className="active">전체</button><button>기본</button><button>구매</button></div>
      {["행운 부적", "기본 도형·마테", "말풍선"].map((title, index) => (
        <button key={title} className="my-sticker-row" onClick={onOpen}>
          <span className={`my-sticker-preview is-${["blue", "pink", "lilac"][index]}`}>{index === 0 ? "≋" : index === 1 ? "✧" : "☁"}</span>
          <span><b>{title}</b><small>보유 · 스티커 {index + 5}개</small></span><i>›</i>
        </button>
      ))}
    </section>
  );
}

function MyStickerDetail({ onUse }: { onUse: () => void }) {
  return (
    <section className="my-sticker-detail">
      <span className="my-sticker-large">≋</span>
      <h2>행운 부적</h2>
      <p>기록에 좋은 기운을 더해 주는 파동 스티커예요.</p>
      <div><span>카테고리</span><b>기본 · 행운</b></div>
      <Button className="my-cta" variant="blue" onClick={onUse}>기록에 사용하기</Button>
    </section>
  );
}

function MyPurchaseList({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="my-purchase-list">
      <div className="my-vault-summary"><span><b>구매한 콘텐츠</b><small>최근 구매 내역 3개</small></span><strong>03</strong></div>
      {["말랑 구름 스티커", "포근한 하루 템플릿", "기억 조각 템플릿"].map((title, index) => (
        <button className="my-purchase-row" key={title} onClick={onOpen}>
          <span className={`my-sticker-preview is-${["lilac", "mint", "pink"][index]}`}>✧</span>
          <span><b>{title}</b><small>2026.07.{20 - index} · {index === 2 ? "무료" : "구매 완료"}</small></span><i>›</i>
        </button>
      ))}
    </section>
  );
}

function WithdrawInfo({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="my-withdraw-content">
      <span className="my-warning-icon">△</span>
      <h2>탈퇴 전에 확인해 주세요</h2>
      <p>탈퇴하면 계정과 연결된 정보가 삭제되며 되돌릴 수 없어요.</p>
      <div className="my-withdraw-list"><MyMenuRow icon="▧" title="사진과 꾸민 기록" caption="저장된 모든 기록" onClick={() => undefined} /><MyMenuRow icon="◌" title="마음 리포트" caption="분석 결과와 통계" onClick={() => undefined} /><MyMenuRow icon="▢" title="구매한 스티커" caption="보관함의 모든 콘텐츠" onClick={() => undefined} /></div>
      <Button className="my-cta" variant="outline" onClick={onContinue}>계속</Button>
    </section>
  );
}

function WithdrawConfirm({
  phrase,
  reason,
  agreed,
  onPhrase,
  onReason,
  onAgreed,
  onWithdraw,
}: {
  phrase: string;
  reason: string;
  agreed: boolean;
  onPhrase: (value: string) => void;
  onReason: (value: string) => void;
  onAgreed: (value: boolean) => void;
  onWithdraw: () => void;
}) {
  const isReady = phrase === "주파 탈퇴" && agreed;
  return (
    <section className="my-withdraw-content my-withdraw-confirm">
      <span>FINAL STEP</span>
      <h2>정말 주파를 떠날까요?</h2>
      <p>탈퇴 후에는 계정과 기록을 복구할 수 없어요.</p>
      <TextInput label="확인 문구" value={phrase} onChange={(event) => onPhrase(event.target.value)} placeholder="주파 탈퇴" />
      <TextInput label="탈퇴 사유" value={reason} onChange={(event) => onReason(event.target.value)} placeholder="선택 사항이에요" />
      <Checkbox checked={agreed} onChange={(event) => onAgreed(event.target.checked)}>삭제 내용을 확인했어요</Checkbox>
      <Button className="my-cta" variant="blue" disabled={!isReady} onClick={onWithdraw}>회원 탈퇴</Button>
      <small>확인 문구와 체크를 모두 완료해 주세요.</small>
    </section>
  );
}

function BottomNav() {
  return (
    <nav className="nav" aria-label="주 메뉴">
      <button className="active">
        <b className="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
          </svg>
        </b>
        홈
      </button>
      <button>
        <b className="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 4h9l4 4v12H5zM14 4v5h5M8 15l2 2 5-5" />
          </svg>
        </b>
        기록
      </button>
      <button>
        <b className="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 8h14l-1 12H6zM8 8V5a4 4 0 0 1 8 0v3" />
          </svg>
        </b>
        마켓
      </button>
      <button>
        <b className="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c.8-4.1 3.5-6 8-6s7.2 1.9 8 6" />
          </svg>
        </b>
        마이
      </button>
    </nav>
  );
}
