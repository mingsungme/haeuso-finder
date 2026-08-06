**Add your own guidelines here**
<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
# design.md

## 1. Design Concept & Philosophy
* **Concept:** 해우소(解憂所) - 비워내는 곳
* **Core Value:** 본질(Essence), 정화(Purification), 비움(Emptiness)
* **Philosophy:** 급박함의 끝에서 마주하는 온전한 비움의 공간. 장식적인 위트나 가벼움을 완전히 걷어내고, 근심을 덜어내는 행위와 그 이후의 '평온한 상태'에 집중합니다.

---

## 2. Color System & Variations

### Brand & Semantic Colors (0-900 Scale)

#### 🟢 Primary: 대나무 숲 초록 (Bamboo Green) - 메인 버튼, 활성화
* `primary-0`: `#F0F5F2` (극도의 투명한 초록빛 배경)
* `primary-100`: `#D1E2D9` (활성화된 카드/칩의 옅은 배경)
* `primary-200`: `#B2CEBF` (보조 인디케이터, 옅은 선)
* `primary-300`: `#8CB59E` (비활성화 상태의 초록 요소)
* `primary-400`: `#5E8F74` (중간 강조, 서브 아이콘)
* **`primary-500`**: `#2C5E43` **[Base] 핵심 액션 버튼(CTA), 활성화 맵 핀**
* `primary-600`: `#244E37` (버튼 Hover/Pressed 상태)
* `primary-700`: `#1C3D2B` (딥 테마 텍스트)
* `primary-800`: `#142C1F` (깊은 명암 구조)
* `primary-900`: `#0C1A13` (심연의 초록 블랙)

#### 🌾 Secondary: 달빛 미색 (Moonlight Cream) - 앱 기본 배경 & 대지
* `secondary-0`: `#FFFEFA` (가장 강조되는 Surface, 카드 내부 배경)
* `secondary-100`: `#FAF8F3` (부드러운 내지 톤)
* `secondary-200`: `#FBF9F5` (레이어 구분을 위한 섬세한 톤)
* `secondary-300`: `#F8F5EE` (인풋 필드 배경)
* **`secondary-400`**: `#F7F4EB` **[Base] 앱 전체 기본 배경색 ($color-bg-default)**
* **`secondary-500`**: `#EDE8DA` **[Base] 구글 맵 대지(Land) 영역 기본 색상**
* `secondary-600`: `#DFD8C4` (비활성화 버튼 배경, 지도 구역 경계)
* `secondary-700`: `#C6BBA3` (지도 내 서브 구역 배경)
* `secondary-800`: `#9E927A` (깊은 토프 베이지, 음영 구조)
* `secondary-900`: `#665E4E` (어두운 갈색조 중성색)

#### 🔴 Accent: 홍단 단풍색 (Autumn Red) - 긴급, 위험, 이용 불가
* `accent-0`: `#FAF0EF` (에러/경고 알림창 배경)
* `accent-100`: `#F4D6D2` (긴급 배지 배경)
* `accent-200`: `#EDBCB6` (완충용 옅은 붉은 톤)
* `accent-300`: `#E1938A` (보조 경고 텍스트)
* `accent-400`: `#D97064` (주목도가 높은 중간 레드)
* **`accent-500`**: `#D04A3C` **[Base] "매우 급함", 가장 가까운 화장실 핀, 에러**
* `accent-600`: `#B03E32` (긴급 버튼 Pressed 상태)
* `accent-700`: `#91332A` (가독성 확보용 딥 레드 text)
* `accent-800`: `#712820` (중후한 주칠 느낌의 묵직한 레드)
* `accent-900`: `#521D17` (먹색이 섞인 진홍색 블랙)

### Neutral Colors (Grayscale)
* `color-text-main`: `#222523` (먹묵색 / Ink Black) - 번잡함을 지운 깊고 차분한 차콜 블랙
* `color-text-sub`: `#6C726E` (기와 회색 / Giwa Gray) - 부가 정보, 거리 및 시간 표시
* `color-border`: `#E5E0D3` (은은한 한지선) - 요소의 경계를 최소한으로 긋는 분할선

### 🗺️ Google Maps Spec (Water Color)
녹지(공원, 산) 영역과 완벽하게 시각적 경계를 이루는 정갈한 파란색 계열의 물빛입니다.
* `map-water`: `#B2C9D6` (한 이불 쪽빛 / Soft Indigo) - 은은하게 대비되는 담백한 청색조

---

## 3. Typography System

### Display & Headings (비움의 정서를 전달하는 서체)
* **Font Family:** `Diphylleia`, serif
* **Usage:** 스플래시 화면, 메인 헤더 타이틀, 브랜딩 감성 텍스트

| Token | Size | Weight | Line Height | Description |
| :--- | :--- | :--- | :--- | :--- |
| `font-display` | 32px | Regular (400) | 140% | 스플래시 및 대형 타이틀 |
| `font-h1` | 24px | Regular (400) | 140% | 메인 페이지 타이틀 |
| `font-h2` | 20px | Regular (400) | 135% | 섹션 타이틀, 카드 제목 |

### Body & Captions (명료한 정보 전달을 위한 본문)
* **Font Family:** `Pretendard`, sans-serif
* **Usage:** 위치 정보, 지도 텍스트, 버튼, 검색 및 상세 안내 (가독성 최우선)

| Token | Size | Weight | Line Height | Description |
| :--- | :--- | :--- | :--- | :--- |
| `font-body-lg` | 16px | Medium (500) | 150% | 본문 강조, 리스트 항목 |
| `font-body-md` | 14px | Regular (400) | 150% | 기본 본문, 주소 정보 |
| `font-button` | 14px | Bold (700) | 100% | 메인 액션 버튼 텍스트 |
| `font-caption` | 12px | Regular (400) | 140% | 캡션, 맵 핀 라벨, 최소 단위 정보 |

---

## 4. Layout & Spacing (4pt Grid System)

비움의 미학을 극대화하기 위해 여백을 여유롭게 배치하여 시각적 공백(여백의 미)을 확보합니다.

* **Base Unit:** 4px
* **Spacing Tokens:**
  * `space-4`: 4px (텍스트와 아이콘 사이 간격)
  * `space-8`: 8px (컴포넌트 내부 요소 간 격리)
  * `space-12`: 12px (정보 단위 내 밀접 간격)
  * `space-16`: 16px (기본 카드 패딩, 리스트 간격)
  * `space-24`: 24px (컨테이너 간 간격, 시각적 숨통을 트여주는 여백)
* **App Side Margin (화면 좌우 여백):** 20px (여백을 넓게 잡아 화면 중심 정보에 몰입하도록 유도)

---

## 5. Corner Radius (곡률 규칙)

인위적으로 날카로운 각을 세우지 않고, 자연스럽게 다듬어진 정서적 곡률을 4단위로 설정합니다.

* `radius-4`: 4px (최소형 인디케이터 태그, 체크박스)
* `radius-8`: 8px (검색 바, 입력 필드)
* `radius-12`: 12px (기본 정보 카드 UI, 메인 버튼)
* `radius-20`: 20px (바텀 시트 상단, 대형 팝업 - 감싸 안는 듯한 안정감)
* `radius-full`: 999px (완전 알약 형태 - 둥근 플로팅 버튼, 카테고리 칩)

---

## 6. Elevation & Shadows (깊이감)

여백과 면이 자연스럽게 분리되도록 짙은 그림자 대신 한지 너머로 비치는 은은한 투영 효과를 줍니다.

* **Elevation-Low (기본 카드 UI):**
  * `box-shadow: 0px 4px 12px rgba(44, 94, 67, 0.04);` (은은한 초록빛이 감도는 고요한 그림자)
* **Elevation-High (지도 위 플로팅 버튼, 바텀시트):**
  * `box-shadow: 0px 8px 24px rgba(34, 37, 35, 0.06);` (먹묵색 기반의 차분하게 떠오르는 깊이감)

---

## 7. Iconography & Visual Rules
* **Stroke Style:** 아이콘의 획과 코너는 **Round(둥글게)** 마감하여 날카로운 시각적 자극을 최소화합니다.
* **Layout Principle:** 화면 내에 정보나 그래픽 요소를 빽빽하게 채우지 않고, 반드시 **30% 이상의 여백을 유지**하여 유저가 앱을 켰을 때 심리적 해방감을 느끼도록 유도합니다.
* **Touch Target:** 급박한 상태에서의 오터치를 방지하기 위해 실질적인 물리 터치 영역은 **48x48px** 이상을 철저히 준수합니다.