# KRDS 컴포넌트 인벤토리

출처:

- 요약 페이지: <https://www.krds.go.kr/html/site/component/component_summary.html>
- 샘플 상세 페이지:
  - 공식 배너: <https://www.krds.go.kr/html/site/component/component_02_01.html>
  - 도움 패널: <https://www.krds.go.kr/html/site/component/component_08_01.html>
  - 따라하기 패널: <https://www.krds.go.kr/html/site/component/component_08_02.html>

## 1. 상위 메뉴 구조

컴포넌트 섹션의 상위 분류:

- 아이덴티티
- 탐색
- 레이아웃 및 표현
- 액션
- 선택
- 피드백
- 도움
- 입력
- 설정
- 콘텐츠
- 모바일

## 2. 요약 페이지 관찰 메모

요약 페이지가 `총 37건`이라고 표시하지만, 실제 노출 메뉴는 그보다 많습니다.  
스킬 작성 시에는 `카운터 숫자`보다 `실제 목록`을 기준으로 삼는 편이 안전합니다.

또한 현재 노출된 링크 기준으로 보면 컴포넌트 번호 체계에 빈 슬롯이 있습니다.

- `component_04_12.html`은 현재 요약 페이지에 노출되지 않습니다.
- 선택 카테고리에서는 `component_06_05.html`, `component_06_06.html`이 비어 있습니다.
- 입력 카테고리는 `component_09_01` ~ `component_09_04`가 연속으로 존재합니다.

즉, KRDS 컴포넌트의 파일명은 `카테고리 번호 + 순번`처럼 보이지만, 실제로는 중간 누락이나 비노출 문서가 있을 수 있으므로
스킬에서 URL을 추정 생성하기보다 검증된 링크 맵을 참조하는 편이 안전합니다.

## 3. 세부 메뉴 목록

아래 목록은 요약 페이지에 실제로 노출된 메뉴 기준입니다.

### 3.1 아이덴티티

- 공식 배너 (Masthead): <https://www.krds.go.kr/html/site/component/component_02_01.html>
- 운영기관 식별자 (Identifier): <https://www.krds.go.kr/html/site/component/component_02_02.html>
- 헤더 (Header): <https://www.krds.go.kr/html/site/component/component_02_03.html>
- 푸터 (Footer): <https://www.krds.go.kr/html/site/component/component_02_04.html>

### 3.2 탐색

- 건너뛰기 링크 (Skip link): <https://www.krds.go.kr/html/site/component/component_03_01.html>
- 메인 메뉴 (Main menu): <https://www.krds.go.kr/html/site/component/component_03_02.html>
- 브레드크럼 (Breadcrumb): <https://www.krds.go.kr/html/site/component/component_03_03.html>
- 사이드 메뉴 (Side navigation): <https://www.krds.go.kr/html/site/component/component_03_04.html>
- 콘텐츠 내 탐색 (In-page navigation): <https://www.krds.go.kr/html/site/component/component_03_05.html>
- 페이지네이션 (Pagination): <https://www.krds.go.kr/html/site/component/component_03_06.html>

### 3.3 레이아웃 및 표현

- 구조화 목록 (Structured list): <https://www.krds.go.kr/html/site/component/component_04_01.html>
- 긴급 공지 (Critical alerts): <https://www.krds.go.kr/html/site/component/component_04_02.html>
- 달력 (Calendar): <https://www.krds.go.kr/html/site/component/component_04_03.html>
- 디스클로저 (Disclosure): <https://www.krds.go.kr/html/site/component/component_04_04.html>
- 모달 (Modal): <https://www.krds.go.kr/html/site/component/component_04_05.html>
- 배지 (Badge): <https://www.krds.go.kr/html/site/component/component_04_06.html>
- 아코디언 (Accordion): <https://www.krds.go.kr/html/site/component/component_04_07.html>
- 이미지 (Image): <https://www.krds.go.kr/html/site/component/component_04_08.html>
- 캐러셀 (Carousel): <https://www.krds.go.kr/html/site/component/component_04_09.html>
- 탭 (Tab): <https://www.krds.go.kr/html/site/component/component_04_10.html>
- 표 (Table): <https://www.krds.go.kr/html/site/component/component_04_11.html>
- 텍스트 목록 (Text list): <https://www.krds.go.kr/html/site/component/component_04_13.html>
- 파비콘 (Favicon): <https://www.krds.go.kr/html/site/component/component_04_14.html>

### 3.4 액션

- 링크 (Link): <https://www.krds.go.kr/html/site/component/component_05_01.html>
- 버튼 (Button): <https://www.krds.go.kr/html/site/component/component_05_02.html>
- 플로팅 버튼 (FAB): <https://www.krds.go.kr/html/site/component/component_05_03.html>

### 3.5 선택

- 라디오 버튼 (Radio button): <https://www.krds.go.kr/html/site/component/component_06_01.html>
- 체크박스 (Checkbox): <https://www.krds.go.kr/html/site/component/component_06_02.html>
- 셀렉트 (Select): <https://www.krds.go.kr/html/site/component/component_06_03.html>
- 태그 (Tag): <https://www.krds.go.kr/html/site/component/component_06_04.html>
- 토글 스위치 (Toggle switch): <https://www.krds.go.kr/html/site/component/component_06_07.html>

### 3.6 피드백

- 단계 표시기 (Step indicator): <https://www.krds.go.kr/html/site/component/component_07_01.html>
- 스피너 (Spinner): <https://www.krds.go.kr/html/site/component/component_07_02.html>

### 3.7 도움

- 따라하기 패널 (Tutorial panel): <https://www.krds.go.kr/html/site/component/component_08_02.html>
- 맥락적 도움말 (Contextual help): <https://www.krds.go.kr/html/site/component/component_08_03.html>
- 코치마크 (Coach mark): <https://www.krds.go.kr/html/site/component/component_08_04.html>
- 툴팁 (Tooltip): <https://www.krds.go.kr/html/site/component/component_08_05.html>
- 음성지원 (TTS): <https://www.krds.go.kr/html/site/component/component_08_06.html>

### 3.8 입력

- 도움 패널 (Help panel): <https://www.krds.go.kr/html/site/component/component_08_01.html>
- 날짜 입력 필드 (Date input): <https://www.krds.go.kr/html/site/component/component_09_01.html>
- 텍스트 영역 (Textarea): <https://www.krds.go.kr/html/site/component/component_09_02.html>
- 텍스트 입력 필드 (Text input): <https://www.krds.go.kr/html/site/component/component_09_03.html>
- 파일 업로드 (File upload): <https://www.krds.go.kr/html/site/component/component_09_04.html>

참고:

- 요약 페이지 표기상 `도움 패널`은 입력 카테고리로 노출됩니다.
- 실제 성격은 도움/보조 탐색에 가깝지만, 문서상 분류는 입력 쪽에 걸쳐 있으므로 스킬에서도 이 예외를 기억해야 합니다.

### 3.9 설정

- 언어 변경 (Language switcher): <https://www.krds.go.kr/html/site/component/component_10_01.html>
- 화면 크기 조정 (Resize): <https://www.krds.go.kr/html/site/component/component_10_02.html>

### 3.10 콘텐츠

- 접근 가능한 미디어 (Accessible multimedia): <https://www.krds.go.kr/html/site/component/component_11_01.html>
- 숨긴 콘텐츠 (Visually hidden): <https://www.krds.go.kr/html/site/component/component_11_02.html>

### 3.11 모바일

- 범위슬라이드 (Range slider): <https://www.krds.go.kr/html/site/component/component_12_01.html>
- 뒤로가기 버튼 (Back button): <https://www.krds.go.kr/html/site/component/component_12_02.html>
- 바텀시트 (Bottom sheet): <https://www.krds.go.kr/html/site/component/component_12_03.html>
- 수량 토글 (Quantity toggle): <https://www.krds.go.kr/html/site/component/component_12_04.html>
- 토스트 (Toast): <https://www.krds.go.kr/html/site/component/component_12_05.html>
- 스낵바 (Snackbar): <https://www.krds.go.kr/html/site/component/component_12_06.html>
- 탭바 (Tab bars): <https://www.krds.go.kr/html/site/component/component_12_07.html>
- 스플래시 스크린 (Splash screen): <https://www.krds.go.kr/html/site/component/component_12_08.html>

## 4. 각 컴포넌트군의 핵심 해석

### 아이덴티티

브랜드/신뢰/정부성 식별을 담당합니다.  
표준형 스타일을 적용하는 서비스라면 커스터마이즈 자유도가 가장 낮은 축입니다.

### 탐색

사용자의 현재 위치 파악, 정보 구조 이동, 반복 영역 건너뛰기와 직접 연결됩니다.  
접근성 지침과 가장 강하게 결합되는 축입니다.

### 레이아웃 및 표현

정보를 어떤 밀도와 계층으로 배치할지 정하는 축입니다.  
스타일 가이드의 레이아웃/형태/색상 규칙과 같이 읽어야 합니다.

### 액션

버튼과 링크의 위계, 중요한 행동의 시각적 강조, 고정 액션의 노출 방식을 결정합니다.

### 선택/입력

폼과 상태 전환을 구성합니다.  
기본 패턴 문서의 입력폼, 필터링·정렬, 개인 식별 정보 입력과 같이 보는 편이 맞습니다.

### 도움/피드백

도움을 어디까지 화면에 노출할지, 사용자를 어디에서 막고 어디에서 유도할지를 담당합니다.  
복잡한 공공 서비스일수록 이 축이 중요해집니다.

### 모바일

웹 KRDS만 보는 경우 놓치기 쉬운 영역입니다.  
앱/모바일웹 스킬을 만들 계획이라면 별도 트리거 문구로 분기시키는 편이 좋습니다.

## 5. 샘플 상세 페이지 구조

### 5.1 공식 배너 상세 페이지에서 확인된 구조

출처: <https://www.krds.go.kr/html/site/component/component_02_01.html>

관찰 포인트:

- 상단 탭:
  - 개요
  - 접근성
  - 코드
- 본문 구조:
  - 구조
  - 사용성 가이드라인
  - 접근성 가이드라인
  - 예시
  - 마크업 가이드
  - FAQ
  - 정보 변경 내역

핵심 규칙:

- 공식 배너는 모든 화면 최상단에 동일한 위치로 제공
- 지나치게 시선을 빼앗지 않도록 표현
- 텍스트와 스타일을 변형하지 않음
- 공식 정부 서비스가 아닌 사이트에서는 사용 금지
- 건너뛰기 링크를 공식 배너보다 먼저 제공

코드/마크업 힌트:

- 전체 영역 선택자: `#krds-masthead`

스킬 반영 포인트:

- 컴포넌트 스킬은 단순 외형 설명이 아니라
  `구조`, `사용성`, `접근성`, `코드` 네 축으로 답해야 합니다.

### 5.2 도움 패널 상세 페이지에서 확인된 구조

출처: <https://www.krds.go.kr/html/site/component/component_08_01.html>

관찰 포인트:

- 본문 우측 고정형 패널 성격
- 도움 패널과 따라하기 패널 간 전환 탭 존재
- 초기 상태와 상세 도움 상태를 분리
- 하단에 관련 페이지 링크/FAQ/문의 채널 제공 가능

도움 패널이 적합하지 않은 경우:

- 안내가 아주 짧은 경우
  - 맥락적 도움말 사용
- 단계별 절차 안내가 필요한 경우
  - 따라하기 패널 + 코치마크 사용

코드/마크업 힌트:

- 주요 선택자:
  - `.krds-help-panel`
  - `.btn-help-panel`
  - `.help-conts`
  - `.related-service`
- JS 함수 예:
  - `krds_helpPanel`
  - `setupHelpButtons()`
  - `toggleHelpPanel()`

스킬 반영 포인트:

- “짧은 힌트인가, 절차형 가이드인가, 상시 도움인가”를 먼저 분기해야 합니다.

### 5.3 따라하기 패널 상세 페이지에서 확인된 구조

출처: <https://www.krds.go.kr/html/site/component/component_08_02.html>

핵심 해석:

- 도움 패널보다 더 절차 지향적
- 실제 이용 절차를 단계별 수행하게 돕는 패널
- 코치마크 실행의 진입 패널 역할

스킬 반영 포인트:

- 복잡한 업무 플로는 도움 패널보다 따라하기 패널이 더 적합할 수 있습니다.
- 스킬에는 `도움 패널`과 `따라하기 패널`을 명확히 구분하는 규칙이 필요합니다.

## 6. 컴포넌트 문서 공통 패턴

컴포넌트 상세 문서는 대체로 다음 규칙을 따릅니다.

1. 개요 탭:
   구조, 용례, 사용성 가이드, 예시
2. 접근성 탭:
   반복 영역 건너뛰기, 초점, 키보드, 의미 전달 관련 규칙
3. 코드 탭:
   CSS 선택자, JS 함수, 마크업 가이드, HTML Component Kit 링크

즉, 스킬은 다음 질문에 답할 수 있어야 합니다.

- 이 컴포넌트는 언제 쓰는가
- 언제 쓰면 안 되는가
- 구조는 어떻게 나누는가
- 접근성 상 반드시 지켜야 하는 점은 무엇인가
- 코드 레벨에서는 어떤 selector / token / JS가 필요한가

## 7. 스킬로 옮길 때의 분할 기준

### SKILL.md에 넣을 것

- 컴포넌트 선택 분기
- 카테고리별 탐색 경로
- 공통 접근성 체크리스트
- 코드 탭을 읽어야 하는 경우

### references로 뺄 것

- 전체 컴포넌트 목록
- 카테고리별 세부 메뉴
- 샘플 상세 페이지 메모
- selector/JS 예시 모음

## 8. 스킬 규칙 초안

- 정부성/공식성 표현이 필요하면 아이덴티티 컴포넌트를 우선 확인
- 정보 구조 이동이 핵심이면 탐색 컴포넌트를 먼저 검토
- 복잡한 설명은 도움 패널, 짧은 설명은 맥락적 도움말, 단계 안내는 따라하기 패널
- 상태/진행 표시가 필요하면 피드백 컴포넌트를 우선
- 폼 관련 요청은 입력 컴포넌트만 보지 말고 기본 패턴 문서와 함께 판단
