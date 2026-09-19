# 작업 기록 (2026-08-07 ~ 08-10)

작업하던 컴퓨터를 반납해서 다른 기기에서 이어가야 하고, 그동안의 Claude Code 대화에는
다시 접근할 수 없다. 여기에 지금까지의 결정과 남은 일을 전부 남긴다.

---

## 다른 컴퓨터에서 다시 시작하기

```bash
git clone https://github.com/mingsungme/haeuso-finde.git
cd haeuso-finde
npm i
cp .env.example .env     # 그다음 .env에 Google Maps API 키를 직접 입력
npm run dev
```

`.env`는 git에 올리지 않으므로(의도된 것) **키를 다시 넣어야 지도가 뜬다.**
키는 GCP `project kms` 프로젝트 → API 및 서비스 → 사용자 인증 정보에서 확인.

---

## 1. 저장소 정리

- 원래는 `upload_here/해우소 찾기.zip`을 통째로 올리는 방식이었다 → 압축을 풀어 실제 소스 트리로
  교체하고, 이후로는 브랜치 → PR → 머지 방식으로 관리한다.
- `.gitignore` 추가 (`node_modules`, `dist`, `.env` 등).
- 원본은 Figma Make로 생성한 코드 번들에서 출발했다.

## 2. 보안 사고 — Google Maps API 키 유출

- Figma Make 번들에 `GOOGLE_MAPS_API_KEY`가 fallback 값으로 하드코딩돼 있었고, 그걸 모르고
  그대로 커밋해 public 저장소에 올라갔다 → GitHub 시크릿 스캐닝에 즉시 걸림.
- 대응: 유출된 키는 GCP에서 삭제 확인, 코드의 하드코딩 fallback 제거
  ([GoogleMapsProvider.tsx](src/app/components/GoogleMapsProvider.tsx)), `.env` 기반으로 전환.
- 새 키는 `project kms`에서 발급. Maps JavaScript API / Places API (New) / Geocoding API /
  Routes API 4개 활성화 + 결제 계정 연결까지 완료(결제 계정 미연결이 지도가 안 뜨던 진짜 원인이었다).
- git 히스토리에는 옛 키 **문자열**이 남아 있지만 그 키는 이미 폐기돼 실질적 위험은 없다.

## 3. 한국 지역 제약 — 길찾기가 동작하지 않음

- Google Routes API는 한국에서 WALKING / DRIVING / BICYCLING 경로를 반환하지 않는다
  (정밀지도 국외 반출 규제). 직접 호출해 확인했고 **TRANSIT만 응답**했다.
- 대응: [MapView.tsx](src/app/components/MapView.tsx)에서 하버사인 직선거리 + 예상 도보시간으로
  대체하고, 점선(형태)과 "실제 도보 경로 아님"(문구) 두 층위로 추정치임을 알린다.
- **다음 계획: TMap 보행자 경로 API 연동** (무료 구간이 넉넉한 편). 연동하면 이 우회를 걷어내고
  실제 경로를 그릴 수 있다.

## 4. 검색 반경 — 피드백 검증 결과

"지도 내 영역이 30m 이내면 좋겠다"는 피드백을 받아 실제 API로 검증했다.
서울 3개 지점, 반경별 결과 수(20은 `maxResultCount` 상한이라 "20곳 이상"):

| 반경 | 서울역 | 연남동(주택가) | 강남역 |
|---|---|---|---|
| 30m | 0 | 0 | 0 |
| 100m | 0 | 0 | 0 |
| 300m | 20+ | 1 | 3 |
| 500m | 20+ | 2 | 10 |
| 1000m | 20+ | 20+ | 15 |
| 1500m | 20+ | 20+ | 19 |

- **30m·100m는 어디서든 결과가 0이다.** 공중화장실이 그 간격으로 있지 않으므로 쓸 수 없다.
- 다만 "1500m(도보 약 20분)는 급할 때 의미 없다"는 지적 자체는 타당하다. 현재 기본값은 1500m.
- 또한 **같은 300m라도 서울역은 20곳 넘고 연남동은 1곳** — 밀도가 지역마다 달라서
  고정 반경으로는 어느 한쪽이 반드시 실패한다.
- 결론(미구현): 고정 반경 대신 **단계적 확장**. 300m로 먼저 찾고 결과가 적으면 500m → 1000m로
  넓히면서 "300m 안에 없어 500m까지 넓혔다"고 사용자에게 알린다.
  → 단, 아래 5번 데이터를 쓰면 이 문제 자체가 사라진다.

## 5. 서울시 공중화장실 데이터 확보

- [data/seoul-public-restrooms.raw.json](data/seoul-public-restrooms.raw.json) — 원본 그대로
  (4,410건 / 26개 자치구 / 좌표 누락 0건). 아직 앱에서 쓰지 않는다.
- 필드 매핑과 가공 시 함정은 [data/README.md](data/README.md)에 정리했다.
  (`coord_x`가 경도이고 `coord_y`가 위도, 다중값 끝에 파이프가 남음, 빈 값이 `null`이 아니라 공백 등)
- **이 데이터를 쓰면 4번의 반경 문제가 없어진다.** 전체 좌표를 들고 있으면 거리순 정렬 후
  가까운 N개를 바로 뽑을 수 있어 "반경"이라는 개념이 필요 없다.

## 6. 디자인 시스템 검증 (OKLCH)

팔레트를 OKLCH로 변환해 위계를 점검한 결과, 명도 간격은 고른 편이었지만 두 가지 문제가 있다.

- **채도 불균형**: primary `C 0.071` vs accent `C 0.172` (2.4배). 명도가 비슷해도 accent가 훨씬
  강하게 튀어서 의도한 대등한 위계가 깨진다.
- **중성색이 두 갈래**: 본문·보조 텍스트는 색상각 157°(녹색 기운), 경계선·배경은 90°(황색 기운).
- 개선 방향(미적용): 중성 램프를 하나의 색상각으로 통일하고, primary 채도를 올려 semantic 3색의
  지각 강도를 맞춘다. `design.md`와 `src/styles/theme.css`를 함께 고쳐야 한다.

## 7. 포트폴리오 덱

- [portfolio/slides.html](portfolio/slides.html) — 최종 결과물. 스크린샷이 인라인돼 있어 파일
  하나만 있으면 열린다. 구성: 컨셉 → 실제 화면 → 지도 커스터마이징 → 디자인 시스템 → 설계 판단 → 클로징.
- 빌드 방법·스크린샷 다시 찍는 법은 [portfolio/README.md](portfolio/README.md) 참고.
- 방향: UX/UI·프로덕트 디자이너 포트폴리오이므로 기술 스택은 최소화하고, 제약 상황에서 무엇을
  선택했는지(검토한 대안 포함)를 전면에 둔다.
- 이 프로젝트는 API 실습 규모라 포폴의 메인이 아니라 **서브 프로젝트로 포지셔닝**하는 게 맞다.

## 8. 저장소 이름

- 원래 이름이 `-`였다(한글로 지었다가 GitHub가 한글을 전부 걸러냄).
- `haeuso-finder`로 바꾸려다 **`haeuso-finde`로 오타**가 났다(끝의 `r` 누락). 아직 그대로다.

---

## 남은 할 일

**바로 할 것**

- [ ] 저장소 이름 오타 수정: `haeuso-finde` → `haeuso-finder`
      (GitHub → Settings → General → Repository name. 예전 URL은 자동 리다이렉트되니 급하진 않다)
- [ ] 서울시 데이터 가공 — 앱에서 쓸 형태로 정제(좌표·24시간 여부·접근성 파싱). `data/README.md`의
      함정 목록을 먼저 볼 것

**그다음**

- [ ] 데이터 전환 후 검색 로직 교체(반경 검색 → 거리순 상위 N개). 4번 문제가 함께 해결됨
- [ ] TMap 보행자 경로 API 연동 → 직선거리 추정을 실제 경로로 교체
- [ ] OKLCH 검증 결과 반영(중성 램프 통일 + primary 채도 조정)
- [ ] 배포(Vercel) — 아래 "배포 메모" 참고
- [ ] 포폴 덱 보강 — 유저 플로우/와이어프레임 등 과정 자료가 아직 없다

**보류**

- [ ] 머지 끝난 원격 브랜치 정리 (`unpack-project-source`, `fix/remove-hardcoded-maps-key`,
      `fix/directions-straight-line-fallback`, `docs/google-maps-env-setup`) — 일부러 남겨둠

---

## 배포 메모 (Vercel)

### 현재 구성 (2026-08-10 확인)

- 포트폴리오 도메인: **https://portfoliomsk.shop** (apex, www 모두 `76.76.21.21` = Vercel).
  응답 헤더 `Server: Vercel`, `http://`는 308로 `https://`에 리다이렉트된다.
- **네임서버는 `ns1.cafe24.com` — DNS는 Vercel이 아니라 카페24에서 관리한다.**
  따라서 서브도메인을 추가하려면 Vercel에서 클릭만으로 끝나지 않고
  **카페24 DNS 관리 화면에서 레코드를 직접 추가해야 한다.**

**이 앱은 별도 Vercel 프로젝트로 만들고 서브도메인으로 붙인다** (`haeuso.portfoliomsk.shop`).

`portfoliomsk.shop/haeuso` 같은 하위 경로로 붙이려면 rewrites나 모노레포 구성이 필요하고,
추가로 [vite.config.ts](vite.config.ts)에 `base: '/haeuso/'`를 넣어야 한다.
안 넣으면 에셋 경로가 루트 기준이라 **흰 화면만 뜬다.**

### 순서

1. Vercel에서 이 저장소로 새 프로젝트 생성 (Vite는 자동 인식 — 빌드 설정 건드릴 것 없음)
2. Settings → Environment Variables에 아래 값을 추가
   (Production / Preview / Development 모두 체크)

   | 변수 | 비고 |
   |---|---|
   | `VITE_GOOGLE_MAPS_API_KEY` | 빌드 시점에 번들로 구워진다 |
   | `VITE_GOOGLE_MAPS_MAP_ID` | 지도 색상용. 콘솔에서 만든 Map ID |
   | `TMAP_APP_KEY` | **`VITE_` 접두사 없음.** `/api/route` 함수가 런타임에 읽는다 |

   `TMAP_APP_KEY`만 성격이 다르다. 나머지 둘은 빌드 결과물에 박히지만 이건 서버에만 남으므로,
   값을 바꿔도 재배포 없이 함수 재시작만으로 반영된다.
3. **반드시 Redeploy.** `VITE_` 변수는 빌드 시점에 코드로 구워지므로, 변수만 추가하고
   재배포하지 않으면 기존 빌드에는 키가 없어 그대로 실패한다.
4. Vercel 프로젝트 → Settings → Domains에 `haeuso.portfoliomsk.shop` 추가.
   Vercel이 필요한 DNS 레코드(보통 CNAME → `cname.vercel-dns.com`)를 알려준다.
5. **카페24 DNS 관리에서** 그 레코드를 추가한다 (호스트 `haeuso`).
   전파되면 Vercel이 인증서를 자동 발급한다.
6. GCP 콘솔에서 키의 HTTP 리퍼러 제한에 배포 주소 추가 (아래)

### 리퍼러 제한

```
https://portfoliomsk.shop/*
https://www.portfoliomsk.shop/*
https://haeuso.portfoliomsk.shop/*
https://*.vercel.app/*
http://localhost:*/*
```

- apex와 `www` 둘 다 넣어야 한다. 하나만 넣으면 다른 쪽 접속에서 깨진다.
- 앱을 서브도메인에만 올릴 계획이어도, 포폴 본체에서 지도를 임베드할 가능성을 생각해
  apex/www를 함께 넣어두는 편이 안전하다.
- **`*.vercel.app`을 빠뜨리지 말 것.** Vercel은 브랜치마다 임시 프리뷰 URL을 만들기 때문에,
  없으면 프리뷰에서만 `RefererNotAllowedMapError`가 나서 원인을 찾기 어렵다.

### 알아둘 점

- `VITE_` 변수는 **클라이언트 번들에 그대로 들어간다.** 배포된 사이트의 JS를 열면 키가 보이는 게 정상이며,
  Google Maps 브라우저 키의 구조상 숨길 수 없다. **실제 보호 수단은 위의 리퍼러 제한이다.**
- 가능하면 배포용 키를 개발용과 분리해서 발급할 것. 한쪽이 문제가 생겨도 다른 쪽이 영향받지 않는다.
- 이 앱은 화면 전환이 URL이 아니라 상태(`useState`)로 되어 있어 **SPA rewrite 설정은 필요 없다.**
