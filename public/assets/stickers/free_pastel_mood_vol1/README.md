# Pastel Mood Pack Vol.1

회원가입 무료 제공용 말풍선 스티커 11종입니다.

## 폴더 구조

- `svgs/`: 개별 SVG 원본
- `preview/preview_grid.svg`: 전체 스티커 미리보기
- `preview/preview_grid.png`: 전체 스티커 PNG 미리보기
- `manifest.json`: 스티커 ID, 파일명, 기본 문구
- `CODEX_PROMPT.md`: 코덱스 전달용 구현 지시문

## SVG 특징

- 투명 배경
- `viewBox="0 0 800 400"`
- 텍스트가 `<text>` 요소로 유지되어 수정 가능
- 외부 이미지·폰트 파일을 포함하지 않음
- 기본 폰트 폴백:
  `Nanum Pen Script`, `Gaegu`, `Segoe Print`, `Apple SD Gothic Neo`, `Noto Sans KR`, sans-serif

> 실제 서비스에서 시안과 가장 가까운 폰트를 고정하려면 프로젝트에서 사용 가능한
> 한글 손글씨 폰트를 지정하세요. 폰트 파일은 이 패키지에 포함하지 않았습니다.
