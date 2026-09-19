# 해우소 찾기

지도 API를 이용하여 특정 역 주변 공공화장실을 찾는 서비스입니다.

Google Maps API 실습 과제로 시작한 프로젝트로, [Figma Make](https://www.figma.com/design/nuiatFRMRDvb2K4wzv6ikV/%ED%95%B4%EC%9A%B0%EC%86%8C-%EC%B0%BE%EA%B8%B0)에서 만든 코드 번들을 기반으로 합니다.

## 실행 방법

1. 의존성 설치
   ```bash
   npm i
   ```
2. `.env` 파일을 만들고 API 키를 설정합니다.
   ```bash
   cp .env.example .env
   ```
   그다음 `.env` 파일에 키를 입력합니다. 자세한 내용은 [SETUP.md](./SETUP.md) 참고.

   | 변수 | 필요 여부 | 용도 |
   |---|---|---|
   | `VITE_GOOGLE_MAPS_API_KEY` | 필수 | 지도 표시, 주변 화장실 검색 |
   | `VITE_GOOGLE_MAPS_MAP_ID` | 선택 | 지도 색상 커스텀. 없으면 구글 기본 스타일 |
   | `TMAP_APP_KEY` | 선택 | 실제 도보 경로. 없으면 직선 추정으로 표시 |
3. 개발 서버 실행
   ```bash
   npm run dev
   ```

## 길안내에 대해

한국에서는 Google Directions/Routes API가 도보 경로를 돌려주지 않습니다(정밀 지도 데이터
국외 반출 규제). 그래서 실제 걷는 길은 **TMAP 보행자 경로안내 API**로 받아옵니다.

TMAP 앱키는 브라우저에 노출되지 않도록 서버에만 둡니다. 클라이언트는 `POST /api/route`만
호출하고, 이 경로를 배포에서는 Vercel 서버리스 함수가, 로컬에서는 Vite dev 미들웨어가
처리합니다. 양쪽 다 [api/_tmap.ts](./api/_tmap.ts) 하나를 공유하므로 동작이 갈라지지 않습니다.

키가 없거나 TMAP 호출이 실패하면 직선 거리 추정으로 물러나고, 화면에 그 이유를 표시합니다.

## 문서

- [design.md](./design.md) — 컨셉 및 디자인 문서
- [SETUP.md](./SETUP.md) — Google Maps API 키 설정 가이드
- [guidelines/Guidelines.md](./guidelines/Guidelines.md) — 개발 가이드라인
