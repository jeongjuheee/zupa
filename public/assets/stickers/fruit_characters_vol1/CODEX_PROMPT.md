# Codex 적용 요청 — Fruit Characters Vol.1

첨부된 `fruit_characters_vol1` 폴더를 프로젝트에 추가해 주세요.

## 에셋 경로
`/public/assets/stickers/fruit_characters_vol1/`

## 요구사항
1. `manifest.json` 기준으로 15개 SVG를 불러오기
2. 스티커 선택 패널에서 5열 또는 반응형 그리드로 표시
3. 클릭 또는 드래그로 기록 캔버스에 추가
4. 이동, 확대/축소, 회전, 삭제, 레이어 순서 변경 지원
5. 저장 데이터: stickerId, x, y, scale, rotation, zIndex
6. SVG 비율 유지 및 투명 배경 유지
7. 한국어 이름을 접근성 라벨과 툴팁에 사용
8. 모바일 터치와 데스크톱 포인터 이벤트 모두 지원
9. 미리보기에서는 정사각형 썸네일 안에 object-fit: contain 적용

## 완료 조건
- 15종 모두 깨짐 없이 표시
- 저장 후 재진입 시 상태 복원
- 흰색/사진 배경 모두에서 검정 외곽선이 선명하게 보임
