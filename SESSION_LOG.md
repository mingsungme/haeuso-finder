# 작업 기록 — 2026-08-07

이 저장소를 git으로 제대로 관리하기 시작한 첫 세션 정리. 이후 대화(Claude Code 세션)에는
다시 접근하지 못할 수 있어서, 여기에 전체 흐름과 남은 할 일을 남겨둠.

## 1. 저장소 정리

- 예전엔 `upload_here/해우소 찾기.zip`을 통째로 업로드하는 방식이었음 → 압축 풀어서
  실제 소스 트리로 교체, 이후부터는 일반적인 git 워크플로(브랜치 → PR → 머지)로 관리.
- `.gitignore` 추가 (`node_modules`, `dist`, `.env` 등 제외).

## 2. 보안 사고 — Google Maps API 키 유출

- Figma Make 번들 원본에 `GOOGLE_MAPS_API_KEY`가 fallback 값으로 하드코딩되어 있었고,
  그걸 모르고 그대로 커밋 → public 저장소에 올라가서 GitHub 시크릿 스캐닝에 걸림.
- 대응: 기존 키 Google Cloud Console에서 삭제 확인, 코드에서 하드코딩 fallback 제거
  ([GoogleMapsProvider.tsx](src/app/components/GoogleMapsProvider.tsx)), `.env` 기반으로 전환.
- 새 키는 `project kms` GCP 프로젝트에서 발급, Maps JavaScript API / Places API (New) /
  Geocoding API / Routes API 4개 활성화 + 결제 계정 연결 완료.
- **주의:** `.env`는 git에 안 올라감 (의도한 대로). 새 컴퓨터에서 작업 재개할 땐
  `.env.example`을 복사해서 실제 키를 다시 넣어야 함 (`cp .env.example .env`).
- **권장:** 배포(Netlify 등)용 키는 이 개발용 키와 분리해서, HTTP 리퍼러를 배포 도메인으로
  제한한 별도 키를 새로 발급할 것.

## 3. 한국 지역 제약 발견 — 길찾기(Routes API)

- Google Routes API가 한국에서는 WALKING/DRIVING/BICYCLING 경로를 반환하지 않음
  (정밀지도 국외 반출 규제 때문 — TRANSIT만 됨). 실제 API 호출로 확인.
- 대응: [MapView.tsx](src/app/components/MapView.tsx)에서 하버사인 공식 기반 직선거리 +
  예상 도보시간으로 대체, UI에 "실제 도보 경로 아님" 명시.

## 4. 저장소 이름 변경

- GitHub 저장소 이름이 원래 `-` (한글 이름을 넣었다가 GitHub가 한글을 다 걸러내서 발생)였음.
- `haeuso-finder`로 바꾸려다 **`haeuso-finde`로 오타** 남 (마지막 r 빠짐).
  → **다음에 GitHub Settings → General → Repository name에서 `haeuso-finder`로 재수정 필요.**
  이름 바꿔도 예전 URL은 자동 리다이렉트되니 급하지 않음.

## 5. 포트폴리오 슬라이드

- [portfolio/slides.html](portfolio/slides.html) — 프로젝트 소개용 스크롤형 슬라이드 덱
  (컨셉 → 지도 커스터마이징 → 기능 → 디자인 시스템 → 트러블슈팅 → 클로징).
  design.md 컬러/폰트 토큰 그대로 사용, 레이아웃은 다른 프로젝트의 슬라이드 템플릿 구조를 재사용.
  브라우저에서 그냥 열면 바로 보임 (빌드 불필요).

## 남은 할 일

- [ ] 저장소 이름 오타 수정 (`haeuso-finde` → `haeuso-finder`)
- [ ] 배포(Netlify) 진행 — 환경변수 등록, 배포 도메인으로 API 키 리퍼러 제한 추가
- [ ] 병합 완료된 원격 브랜치 정리 (`unpack-project-source`, `fix/remove-hardcoded-maps-key`,
      `fix/directions-straight-line-fallback`, `docs/google-maps-env-setup`) — 보류 중, 필요할 때 정리
