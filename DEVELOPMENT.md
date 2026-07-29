# 주파 개발 구성

## 현재 구현

- 모바일 320~480px UI와 랜딩, 가입, 이메일 인증 안내, 온보딩, 홈, 사진, 일기, 꾸미기, 분석, 일반/위기/실패 화면
- Supabase Browser Client, 이메일 가입, 카카오 OAuth, PKCE `/auth/callback` 교환 흐름
- `POST /api/analyze` 서버 API
- Google Gemini Developer API `gemini-2.5-flash` Adapter와 JSON Schema 구조화 응답
- 서버 안전 규칙과 AI 위기 판정 결합
- 중복 요청 제한, 429·장애 실패 계약, 개발용 더미 분석
- Supabase용 초기 테이블, RLS, 비공개 Storage 정책

## 개발 모드

환경변수가 없으면 실제 인증·AI 호출을 하지 않는다. AI 분석은 더미 일기에 한해 결정론적 샘플 응답을 반환하며 서버 안전 규칙은 계속 적용한다. 실제 개인정보나 민감한 일기는 입력하지 않는다.

## Supabase 준비

1. Supabase 프로젝트를 만든다.
2. `supabase/migrations/202607220001_initial.sql`을 적용한다.
3. Email confirmation을 활성화하고 Site URL·로컬·Preview·Production Redirect URL을 등록한다.
4. Kakao Provider를 설정한다. 동일한 검증 이메일은 하나의 Supabase 사용자에 identity로 연결한다.
5. Password minimum length를 12로 설정하고 문자 조합 강제는 끈다.
6. 공개 테스트 전 Pro leaked-password protection과 Custom SMTP를 활성화한다.
7. 두 테스트 사용자로 RLS 교차 접근이 차단되는지 확인한다.

## 환경변수

`.env.example`을 `.env.local`로 복사한 뒤 실제 값은 로컬·배포 환경에만 저장한다. `SUPABASE_SERVICE_ROLE_KEY`와 `GEMINI_API_KEY`는 절대 브라우저 변수로 만들지 않는다.

## 아직 필요한 작업

- 서버에서 인증 사용자 확인 후 기록 저장 트랜잭션 연결
- 실제 사진 업로드·크롭·에디터 조작
- 66개 화면의 나머지 상태, 캘린더·마켓·마이 페이지
- 공개 테스트 전 Custom SMTP, 유출 비밀번호 차단, 위기 판정 안전성 검증
