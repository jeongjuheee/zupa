# Zupa MVP · Supabase 시작 체크리스트

## 이번 MVP 범위

- 포함: 이메일·비밀번호 인증, 이메일 인증, 카카오 로그인, 프로필, 온보딩 동의, 기록·분석 결과·사진 저장
- 제외: 실제 결제, 결제 웹훅, 유료 구매 권한 처리
- 마켓의 구매 성공·실패·네트워크 오류 화면은 UI 데모 상태로만 유지한다.

## 1. Supabase 프로젝트 생성

1. Supabase에서 새 프로젝트를 생성한다.
2. Project Settings > API에서 아래 두 값을 복사한다.
   - Project URL
   - Publishable key(또는 anon key)
3. Project Settings > API의 `service_role` 키는 서버 환경변수에만 보관한다. 브라우저와 채팅에 공유하지 않는다.

## 2. 로컬 환경변수

`.env.example`을 `.env.local`로 복사하고 값을 입력한다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_APP_URL=http://[::1]:3003

SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
GEMINI_API_KEY=<server-only-secret>
```

`SUPABASE_SERVICE_ROLE_KEY`와 `GEMINI_API_KEY`에는 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.

## 3. Auth 설정

Supabase Dashboard > Authentication에서 설정한다.

- Email provider 활성화
- Confirm email 활성화
- 비밀번호 최소 길이: 12자
- Site URL: 운영 도메인(개발 중에는 `http://[::1]:3003`)
- Redirect URLs:
  - `http://[::1]:3003/auth/callback`
  - `http://localhost:3003/auth/callback`
  - 운영 주소의 `/auth/callback`
- 카카오 Provider 활성화 후 Kakao Developers의 REST API 키·Client Secret·Redirect URI를 입력

웹 인증 코드는 PKCE를 명시적으로 사용하도록 구현되어 있다. 인증 링크·OAuth 콜백은 `/auth/callback`에서 세션으로 교환한다.

## 4. DB와 Storage 적용

Supabase SQL Editor에서 아래 마이그레이션을 실행한다.

`supabase/migrations/202607220001_initial.sql`

이 마이그레이션은 다음을 만든다.

- `profiles`, `records`, `record_photos`, `analyses`
- 각 사용자 자신의 데이터만 읽고 쓰는 RLS 정책
- 비공개 `record-images` Storage bucket
- 가입 시 빈 프로필을 만드는 트리거

## 5. 연결 확인 순서

1. 이메일로 가입하고 인증 메일을 연다.
2. `/auth/callback` 이후 온보딩으로 진입하는지 확인한다.
3. 닉네임·필수 동의를 `profiles`에 저장한다.
4. 사진을 `record-images/<user.id>/...` 경로에 업로드한다.
5. 기록 저장 후 서버에서 Gemini 분석을 요청하고 `analyses`에 저장한다.
6. 다른 계정에서 이전 계정의 기록·사진을 열 수 없는지 RLS를 확인한다.

## 운영 전 보류 항목

- Custom SMTP
- 유출 비밀번호 차단 설정
- Gemini 유료 티어와 OpenAI API 비교
- 실제 결제 공급자 선정 및 결제 웹훅
