# 해우소 찾기 - 설정 가이드

공중 화장실 찾기 앱 "해우소 찾기"를 사용하기 위한 설정 가이드입니다.

## Google Maps API 키 설정

이 앱은 Google Maps JavaScript API를 사용합니다. 지도를 표시하려면 API 키가 필요합니다.

### 1. Google Cloud Console에서 API 키 발급

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "라이브러리"로 이동
4. "Maps JavaScript API" 검색 및 활성화
5. "사용자 인증 정보" > "사용자 인증 정보 만들기" > "API 키" 선택
6. API 키 복사

### 2. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가합니다.

```bash
cp .env.example .env
```

그다음 `.env` 파일을 열어 실제 API 키로 변경합니다.

```bash
VITE_GOOGLE_MAPS_API_KEY=여기에_발급받은_API_키_입력
```

**예시:**
```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. 개발 서버 재시작

환경 변수 변경 후 개발 서버를 재시작해야 적용됩니다.

## API 키 보안

⚠️ **중요:** API 키는 민감한 정보입니다.

- `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다
- 공개 저장소에 API 키를 업로드하지 마세요
- Google Cloud Console에서 API 키 사용 제한을 설정하세요:
  - HTTP 리퍼러 제한 (웹사이트 제한)
  - API 제한 (Maps JavaScript API만 허용)

## 지도 색상 커스텀 (Map ID)

이 앱은 최신 마커(AdvancedMarkerElement)를 쓰기 때문에 지도에 **Map ID**가 반드시 붙는다.
그리고 Map ID가 붙은 지도는 **코드에 적은 색상 설정을 무시하고 콘솔에 저장된 스타일만 따른다.**
그래서 색상은 GCP 콘솔에서 지정하고, 코드에는 Map ID만 넣는다.

`VITE_GOOGLE_MAPS_MAP_ID`를 비워두면 구글이 제공하는 개발용 `DEMO_MAP_ID`(기본 색상)로 뜬다.
지도는 정상 동작하므로, 색상 작업은 나중에 해도 된다.

### 1. Map ID 만들기

1. [GCP 콘솔](https://console.cloud.google.com/google/maps-apis) → **Google Maps Platform** → **지도 관리(Map Management)**
2. **지도 ID 만들기** 클릭
3. 이름을 적고, 지도 유형은 **JavaScript**를 선택한 뒤 저장
4. 생성된 Map ID 문자열을 복사

### 2. 먹선 스타일 적용

이 저장소에 앱 색상에 맞춘 스타일이 [docs/map-style.meokseon.json](./docs/map-style.meokseon.json)으로 들어 있다.
한지 톤으로 바탕을 비우고, **큰길 테두리만 먹색(`#585D59`)으로 긋는** 안이다. 급할 때 시간을 잡아먹는 건
거리보다 큰길 횡단이라서, 대로 건너편인 화장실이 한눈에 걸러지게 했다. 가게·시설 아이콘은 모두 숨긴다.

1. 콘솔 → **지도 스타일(Map Styles)** → **스타일 만들기**
2. 대화상자의 **JSON 탭**에서 위 파일 내용을 붙여넣거나 업로드
   (이미 만든 스타일을 열어 덮어쓰지 말고 **새 스타일로 만든다**)
3. 레거시 형식이라 변환 경고가 뜨는 게 정상이다. 변환은 근사적이라 큰길 테두리 굵기 등은 편집 화면에서 다시 맞춰야 할 수 있다.
4. 저장한 뒤, 스타일 상세에서 **지도 ID에 연결**을 눌러 1단계에서 만든 Map ID를 선택

콘솔에서 색을 직접 만졌다면, 나중에 재현할 수 있도록 편집 화면의 JSON을
`docs/map-style.meokseon.json`에 다시 덮어써 두는 편이 좋다. 콘솔에만 있으면 기록이 남지 않는다.

### 3. 환경 변수

```bash
VITE_GOOGLE_MAPS_MAP_ID=여기에_Map_ID_붙여넣기
```

**스타일 반영에는 시간이 걸린다.** 콘솔에서 저장해도 즉시 바뀌지 않고 몇 분 뒤에 적용되는
경우가 있으니, 바로 안 바뀐다고 설정을 다시 건드리지 말 것.

---

## 길안내 (TMAP 보행자 경로 API)

한국에서는 Google Directions/Routes API가 **도보 경로를 돌려주지 않는다.** 정밀 지도 데이터의
국외 반출 규제 때문이며, 키 설정이나 결제 문제가 아니라 바꿀 수 없는 제약이다.
그래서 실제 걷는 길은 **TMAP 보행자 경로안내 API**로 받아온다.

TMAP 앱키가 없어도 앱은 동작한다. 대신 경로가 **직선 추정**으로 표시되고,
길안내 화면 상단에 그 이유가 뜬다.

### 1. 앱키 발급

1. [SK open API](https://openapi.sk.com/) 가입 후 로그인
2. **프로젝트 생성** (이름은 자유롭게)
3. 사용할 API 목록에서 **Tmap API**를 골라 프로젝트에 추가
4. 프로젝트 상세 화면에 표시되는 **앱키(appKey)** 복사

무료 제공량이 있고 초과분은 과금되므로, 실제 사용량은 SK open API 콘솔에서 확인할 것.

### 2. 환경 변수

```bash
TMAP_APP_KEY=여기에_앱키_붙여넣기
```

**`VITE_` 접두사를 붙이지 말 것.** 붙이는 순간 이 값이 클라이언트 번들에 그대로 구워져
배포된 사이트에서 누구나 볼 수 있게 된다. 접두사가 없어야 서버에만 남는다.

### 3. 구조

브라우저는 TMAP을 직접 호출하지 않고 항상 `POST /api/route`를 거친다.

| | 담당 |
|---|---|
| 배포 (Vercel) | [api/route.ts](./api/route.ts) 서버리스 함수 |
| 로컬 개발 | [vite.config.ts](./vite.config.ts)의 `tmapDevApi` 미들웨어 |
| 실제 호출·응답 변환 | [api/_tmap.ts](./api/_tmap.ts) (양쪽이 공유) |

로컬에서 잘 되는데 배포에서만 안 된다면, 대개 Vercel에 `TMAP_APP_KEY`를 안 넣은 것이다.

## 문제 해결

### "Google Maps JavaScript API error: InvalidKeyMapError"
- API 키가 올바르게 설정되지 않았습니다
- `.env` 파일의 키를 확인하세요
- 개발 서버를 재시작하세요

### "This page can't load Google Maps correctly"
- Google Cloud Console에서 Maps JavaScript API가 활성화되었는지 확인
- 결제 계정이 연결되어 있는지 확인 (무료 크레딧 사용 가능)

### 지도는 뜨는데 마커가 안 보인다
- Map ID가 유효하지 않을 때 나타난다. `VITE_GOOGLE_MAPS_MAP_ID`를 비워 `DEMO_MAP_ID`로
  돌려보고, 마커가 다시 보이면 Map ID 쪽 설정 문제다.

### 지도 색이 안 바뀐다
- 콘솔에서 스타일을 만들었더라도 **Map ID에 연결**하지 않으면 적용되지 않는다.
- 저장 후 반영까지 몇 분 걸릴 수 있다.
- `VITE_` 변수는 빌드 시점에 구워지므로 dev 서버(또는 배포)를 다시 시작해야 한다.

### 길안내가 계속 "직선 추정"으로 나온다
길안내 화면 상단 배너에 이유가 그대로 찍힌다. 흔한 경우는 다음과 같다.

- `TMAP_APP_KEY 환경변수가 설정되지 않았습니다` → `.env`에 키가 없다. dev 서버 재시작 필요.
- HTTP 401 → 앱키가 틀렸거나 해당 프로젝트에 Tmap API가 추가되어 있지 않다.
- `보행자 경로를 찾지 못했습니다` → 출발지와 도착지가 너무 멀거나, 보행로가 없는 구간이다.

터미널에서 직접 찔러보면 원인을 빨리 좁힐 수 있다.

```bash
curl -i -X POST http://localhost:5173/api/route -H 'Content-Type: application/json' -d '{"origin":{"lat":37.5563,"lng":126.9723},"destination":{"lat":37.5615,"lng":126.9863},"destinationName":"명동역"}'
```

## 무료 사용량

Google Maps Platform은 매월 $200의 무료 크레딧을 제공합니다:
- Maps JavaScript API: 월 28,000회 로드까지 무료
- 대부분의 개인 프로젝트는 무료 한도 내에서 사용 가능

자세한 정보: [Google Maps Platform 가격 정책](https://developers.google.com/maps/billing-and-pricing/pricing)
