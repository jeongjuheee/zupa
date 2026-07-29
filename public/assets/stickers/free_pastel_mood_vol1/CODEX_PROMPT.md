# Codex 구현 요청 — 무료 스티커팩 Vol.1

첨부된 `sticker_pack_vol1_pastel_mood` 폴더를 프로젝트에 적용해 주세요.

## 적용 대상
- 회원가입 완료 사용자에게 무료 스티커팩 3종 중 Vol.1을 자동 지급
- 기록 작성/편집 화면의 스티커 선택 패널에 노출
- `manifest.json`을 기준으로 11개 SVG를 렌더링

## 에셋 경로
`/public/assets/stickers/free_pastel_mood_vol1/`

## 필수 기능
1. SVG 원본 비율 유지
2. 드래그 이동
3. 확대/축소
4. 회전
5. 삭제
6. 레이어 순서 변경
7. 캔버스 밖으로 완전히 이탈하지 않도록 최소 20% 영역 유지
8. 저장 시 stickerId, x, y, scale, rotation, zIndex, customText를 JSON으로 저장
9. `editableText: true`인 항목은 기본 문구를 사용자 문구로 교체 가능

## 렌더링 주의사항
- SVG 내부 텍스트가 깨지지 않도록 UTF-8로 로드
- 폰트 우선순위:
  `"Nanum Pen Script", "Gaegu", "Segoe Print", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`
- 프로젝트에서 상업적 사용 가능한 한글 손글씨 폰트가 이미 있다면 첫 번째 폰트로 교체
- SVG에 외부 이미지 URL을 삽입하지 말 것
- 모바일 터치 제스처와 데스크톱 포인터 이벤트 모두 지원

## 완료 조건
- 11종 모두 미리보기와 실제 캔버스에서 정상 노출
- 한국어와 특수문자 깨짐 없음
- 저장 후 재진입 시 위치/크기/회전/텍스트 복원
- 비회원에게는 잠금 표시, 회원가입 완료 시 즉시 사용 가능
