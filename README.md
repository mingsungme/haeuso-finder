# 해우소 찾기

지도 API를 이용하여 특정 역 주변 공공화장실을 찾는 서비스입니다.

Google Maps API 실습 과제로 시작한 프로젝트로, [Figma Make](https://www.figma.com/design/nuiatFRMRDvb2K4wzv6ikV/%ED%95%B4%EC%9A%B0%EC%86%8C-%EC%B0%BE%EA%B8%B0)에서 만든 코드 번들을 기반으로 합니다.

## 실행 방법

1. 의존성 설치
   ```bash
   npm i
   ```
2. `.env` 파일을 만들고 Google Maps API 키를 설정합니다.
   ```bash
   cp .env.example .env
   ```
   그다음 `.env` 파일에 실제 Google Maps API 키를 입력합니다. 자세한 내용은 [SETUP.md](./SETUP.md) 참고.
3. 개발 서버 실행
   ```bash
   npm run dev
   ```

## 문서

- [design.md](./design.md) — 컨셉 및 디자인 문서
- [SETUP.md](./SETUP.md) — Google Maps API 키 설정 가이드
- [guidelines/Guidelines.md](./guidelines/Guidelines.md) — 개발 가이드라인
