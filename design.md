# design.md

## 1. Design Concept & Philosophy
- **Concept:** 해우소(解憂所) - 비워내는 곳
- **Core Value:** 본질(Essence), 정화(Purification), 비움(Emptiness)
- **Philosophy:** 급박함의 끝에서 마주하는 온전한 비움의 공간. 장식적인 위트나 가벼움을 걷어내고, 근심을 완전히 덜어내는 행위와 그 이후의 '평온한 상태'에 집중합니다.

---

## 2. Color System

### Brand Colors
- `color-primary`: `#2C5E43` (대나무 숲 초록 / Bamboo Green) - 고요하게 가라앉은 숲의 색. 심리적 안정을 주는 메인 컬러.
- `color-secondary`: `#F7F4EB` (달빛 미색 / Moonlight Cream) - 자극 없는 한지 톤의 부드러운 화이트. 면적이 가장 넓은 기본 배경색.
- `color-accent`: `#D04A3C` (홍단 단풍색 / Autumn Red) - 비워내기 직전의 가장 절박한 지점(가장 가까운 화장실 핀)을 알리는 최소한의 포인트 색.

### Semantic Colors
- `color-success`: `#2C5E43` (근심을 비워냄 / 사용 가능)
- `color-warning`: `#DCA144` (주의 / 확인 필요 - 황토 들녘색)
- `color-error`: `#D04A3C` (비워낼 수 없음 / 이용 불가)

### Neutral Colors (Grayscale)
- `color-bg-default`: `#F7F4EB` (달빛 미색 - App Background)
- `color-surface`: `#FFFFFF` (순백색 - 비움의 상태를 시각화한 컴포넌트 바탕색)
- `color-text-main`: `#222523` (먹묵색 / Ink Black) - 번잡함을 지운 깊고 차분한 차콜 블랙
- `color-text-sub`: `#6C726E` (기와 회색 / Giwa Gray) - 부가 정보, 거리 및 시간 표시
- `color-border`: `#E5E0D3` (은은한 한지선) - 요소의 경계를 최소한으로 긋는 분할선

---

## 3. Typography System

### Display & Headings (비움의 정서를 전달하는 타이틀)
- **Font Family:** `Diphylleia`, serif
- **Usage:** 스플래시 화면, 메인 헤더 타이틀, "근심을 비워내는 곳" 등 정적인 브랜딩 텍스트

| Token | Size | Weight | Line Height | Description |
| :--- | :--- | :--- | :--- | :--- |
| `font-display` | 32px | Regular (400) | 140% | 스플래시 및 대형 타이틀 |
| `font-h1` | 24px | Regular (400) | 140% | 메인 페이지 타이틀 |
| `font-h2` | 20px | Regular (400) | 135% | 섹션 타이틀, 카드 제목 |

### Body & Captions (명료한 정보 전달을 위한 본문)
- **Font Family:** `Pretendard`, sans-serif
- **Usage:** 위치 정보, 지도 텍스트, 버튼, 실시간 상태 안내 (장식 없이 명확한 가독성)

| Token | Size | Weight | Line Height | Description |
| :--- | :--- | :--- | :--- | :--- |
| `font-body-lg` | 16px | Medium (500) | 150% | 본문 강조, 리스트 항목 |
| `font-body-md` | 14px | Regular (400) | 150% | 기본 본문, 주소 정보 |
| `font-button` | 14px | Bold (700) | 100% | 메인 액션 버튼 텍스트 |
| `font-caption` | 12px | Regular (400) | 140% | 캡션, 맵 핀 라벨, 최소 단위 정보 |

---

## 4. Layout & Spacing (4pt Grid System)

비움의 미학을 극대화하기 위해 여백을 여유롭게 배치하여 시각적 공백(여백의 미)을 확보합니다.

- **Base Unit:** 4px
- **Spacing Tokens:**
- `space-4`: 4px (텍스트와 아이콘 사이 간격)
- `space-8`: 8px (컴포넌트 내부 요소 간 격리)
- `space-12`: 12px (정보 단위 내 밀접 간격)
- `space-16`: 16px (기본 카드 패딩, 리스트 간격)
- `space-24`: 24px (컨테이너 간 간격, 시각적 숨통을 트여주는 여백)
- **App Side Margin (화면 좌우 여백):** 20px (여백을 넓게 잡아 화면 중심 정보에 몰입하도록 유도)

---

## 5. Corner Radius (곡률 규칙)

인위적으로 날카로운 각을 세우지 않고, 자연스럽게 다듬어진 정서적 곡률을 적용합니다.

- `radius-4`: 4px (최소형 인디케이터 태그)
- `radius-8`: 8px (검색 바, 입력 필드)
- `radius-12`: 12px (기본 정보 카드 UI, 메인 버튼)
- `radius-20`: 20px (바텀 시트 상단, 대형 팝업 - 감싸 안는 듯한 안정감)
- `radius-full`: 999px (완전 알약 형태 - 둥근 플로팅 버튼, 카테고리 칩)

---

## 6. Elevation & Shadows (깊이감)

여백과 면이 자연스럽게 분리되도록 짙은 그림자 대신 한지 너머로 비치는 은은한 투영 효과를 줍니다.

- **Elevation-Low (기본 카드 UI):**
- `box-shadow: 0px 4px 12px rgba(44, 94, 67, 0.04);` (은은한 초록빛이 감도는 고요한 그림자)
- **Elevation-High (지도 위 플로팅 버튼, 바텀시트):**
- `box-shadow: 0px 8px 24px rgba(34, 37, 35, 0.06);` (먹묵색 기반의 차분하게 떠오르는 깊이감)

---

## 7. Iconography & Visual Rules
- **Stroke Style:** 아이콘의 획과 코너는 **Round(둥글게)** 마감하여 날카로운 시각적 자극을 최소화합니다.
- **Layout Principle:** 화면 내에 정보나 그래픽 요소를 빽빽하게 채우지 않고, 반드시 **30% 이상의 여백을 유지**하여 유저가 앱을 켰을 때 심리적 해방감을 느끼도록 유도합니다.
- **Touch Target:** 급박한 상태에서의 오터치를 방지하기 위해 실질적인 물리 터치 영역은 **48x48px** 이상을 철저히 준수합니다.
