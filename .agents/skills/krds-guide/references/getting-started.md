# KRDS Getting Started Reference

Use this file when the task is about KRDS adoption or setup work:

- designer onboarding to KRDS resources
- Figma library usage
- design asset composition and publication
- developer installation of KRDS kits
- design-token handoff from design tools into code
- resource download and environment preparation

Official sources:

- `outline_02`: <https://www.krds.go.kr/html/site/outline/outline_02.html>
- `outline_03`: <https://www.krds.go.kr/html/site/outline/outline_03.html>

Detailed research note:

- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/getting-started-outline.md`

## 1. Route the Request First

Choose the track before giving guidance.

- 디자이너 트랙:
  Figma 라이브러리, Sketch/XD 리소스, 디자인 에셋 탐색, 토큰 사용, 테마 전환
- 개발자 트랙:
  HTML Component Kit, React/Vue 패키지, CDN/NPM 설치, SCSS/CSS 통합, 토큰 코드 반영

If the request crosses design and code, read this file first, then load:

- [style.md](style.md) for token semantics and visual rules
- [naming.md](naming.md) for token naming and variable structure
- [components.md](components.md) for component-level implementation details

## 2. Designer Track

### Core stance

KRDS treats design setup as reusable-system onboarding, not one-off screen drawing.

- 튜토리얼로 라이브러리 다운로드, 파일 구성, 디자인 에셋 사용, 토큰 사용을 익히게 한다.
- 피그마 라이브러리는 스타일 가이드, 컴포넌트, 기본 패턴, 서비스 패턴이 디자인 토큰으로 연결된 구조다.
- Sketch/XD 리소스는 보조 리소스이며, 전체 라이브러리 사용에는 Figma가 권장된다.

### What to tell designers

- 시작 전에 `Pretendard GOV` 서체를 먼저 준비한다.
- 공식 리소스 페이지에서 서체와 디자인 리소스를 내려받는다.
- Figma 커뮤니티 파일을 열어 라이브러리 구조를 확인한다.
- 좌측 사이드바에서 스타일 가이드, 컴포넌트, 패턴, 아이콘 구성을 확인한다.
- 우측 사이드바에서 로컬 베리어블과 로컬 스타일을 확인한다.
- Assets 패널에는 대표 변형만 보일 수 있으므로 전체 변형은 각 상세 페이지에서 확인한다.
- 배치한 구성 요소의 타입, 크기, 상호작용 변형은 우측 패널에서 바꾼다.
- 다른 파일에서 재사용하려면 라이브러리를 게시한 뒤 개별 파일에 추가한다.

### Token guidance for designers

- 베리어블은 `primitive`, `semantic`, `mode`, `responsive` 컬렉션으로 나뉜다.
- `primitive`를 바꾸면 연결된 스타일이 전체적으로 갱신될 수 있으므로 영향 범위를 먼저 설명한다.
- 선명한 화면 모드와 반응형 전환은 베리어블 기반 테마 전환으로 이해시킨다.
- 기관별 색상 커스터마이징 요청이 오면 토큰 구조와 영향도를 먼저 설명하고, 필요 시 [style.md](style.md)와 [naming.md](naming.md)를 함께 읽는다.

## 3. Developer Track

### Core stance

KRDS developer onboarding is centered on applying the official kit and keeping tokens as the source of truth.

- 표준형 스타일은 `Pretendard GOV` 웹폰트 CDN을 기본 전제로 둔다.
- HTML Component Kit은 `NPM`, `GitHub 다운로드`, `CDN`의 세 경로로 접근할 수 있다.
- React/Vue는 별도 설치 후 Storybook 문서를 참고하는 흐름이다.

### Installation guidance

- 패키지 설치 경로가 가능한 프로젝트면 `NPM`을 우선 검토한다.
- 정적 포함만 필요한 경우 `CDN` 또는 GitHub 배포 파일 경로를 안내한다.
- SCSS를 사용할 때는 Kit 내부 참조 경로를 그대로 기대하지 말고 `/resources` 디렉터리 전체 복제와 경로 재설정을 먼저 검토한다.
- React/Vue 요청은 설치 방법과 함께 Storybook 기반 컴포넌트 문서를 참조하도록 안내한다.

### Token and styling guidance

- 디자인 툴에서 추출한 JSON 토큰을 CSS variable로 변환해 코드에 반영하는 흐름을 기본으로 둔다.
- KRDS는 스타일 작업에 SCSS를 권장하지만, CSS로도 사용할 수 있도록 컴파일된 파일을 함께 제공한다.
- 전체 라이브러리를 한 번에 가져올지, 공통 파일 후 개별 구성 요소만 가져올지 먼저 결정한다.
- JavaScript 동작이 필요한 경우 공식 JS 파일 로드 방식까지 함께 설명한다.
- 토큰 수정은 원본 Kit 파일 직접 수정이 아니라 프로젝트의 CSS/SCSS에서 CSS variable을 재선언하는 방식으로 안내한다.

## 4. What to Produce

For onboarding or setup requests, answer in this order:

- which KRDS track applies: designer, developer, or handoff
- required resources or packages
- setup sequence
- token or theming constraints
- which additional KRDS reference to load next

When the user asks for actual implementation work, pair this file with the concrete domain reference instead of stopping at setup guidance.
