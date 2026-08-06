# Open the Door - 설정 가이드

공중 화장실 찾기 앱 "Open the Door"를 사용하기 위한 설정 가이드입니다.

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

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가:

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

## 추가 API (선택사항)

실제 운영 환경에서는 다음 API들을 추가로 활성화하면 더 많은 기능을 사용할 수 있습니다:

- **Places API**: 실시간 장소 데이터 검색
- **Geocoding API**: 주소-좌표 변환
- **Directions API**: 경로 안내 기능

## 문제 해결

### "Google Maps JavaScript API error: InvalidKeyMapError"
- API 키가 올바르게 설정되지 않았습니다
- `.env` 파일의 키를 확인하세요
- 개발 서버를 재시작하세요

### "This page can't load Google Maps correctly"
- Google Cloud Console에서 Maps JavaScript API가 활성화되었는지 확인
- 결제 계정이 연결되어 있는지 확인 (무료 크레딧 사용 가능)

## 무료 사용량

Google Maps Platform은 매월 $200의 무료 크레딧을 제공합니다:
- Maps JavaScript API: 월 28,000회 로드까지 무료
- 대부분의 개인 프로젝트는 무료 한도 내에서 사용 가능

자세한 정보: [Google Maps Platform 가격 정책](https://developers.google.com/maps/billing-and-pricing/pricing)
