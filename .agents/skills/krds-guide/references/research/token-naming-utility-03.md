# KRDS 토큰 네이밍 정리

출처:

- 네이밍 원칙: <https://www.krds.go.kr/html/site/utility/utility_03.html>
- 디자인 토큰: <https://www.krds.go.kr/html/site/style/style_07.html>

## 1. 왜 따로 정리해야 하는가

기존 `style_07` 문서는 토큰의 역할과 구조를 설명하는 쪽에 가깝고,  
`utility_03` 문서는 실제 작업 파일, 토큰, 컴포넌트 명칭, 속성 표현의 네이밍 규칙을 더 직접적으로 설명합니다.

즉, 스킬 입장에서는 다음처럼 분리해서 이해하는 편이 맞습니다.

- `style_07`: 토큰 체계와 계층
- `utility_03`: 토큰과 관련 자산의 네이밍 규칙

## 2. KRDS 네이밍 기본 원칙

문서 전반에서 반복되는 원칙은 아래와 같습니다.

- 논리 구조를 우선한다.
- 시각적 속성을 이름에 넣지 않는다.
- 확장 가능한 구조를 택한다.
- 표기 방식을 일관되게 유지한다.
- 줄임말 대신 명확한 단어를 사용한다.

실무 해석:

- `blue-button` 같은 이름보다 역할 중심 이름을 사용해야 합니다.
- `bg`, `xs` 같은 약어보다 `background`, `xsmall` 같은 풀네임을 우선해야 합니다.
- 이름이 스타일 변경에 끌려다니면 안 되고, 역할과 구조를 유지해야 합니다.

## 3. 토큰에 영향을 미치는 네이밍 규칙

문서에서 토큰에 영향을 미친다고 설명하는 대상은 다음입니다.

- 컴포넌트 명칭
- 로컬 배리어블(Local variables)
- 로컬 스타일(Local styles)
- 코드에서 토큰으로 사용하는 이름

### 공통 규칙

- 모두 소문자 사용
- 토큰 관련 단어 구분은 공백 대신 기호 사용
- 토큰 분리자는 하이픈(`-`)을 기본으로 사용

### 컴포넌트 명칭 규칙

- 컴포넌트 내부 단어 구분은 언더바(`_`) 사용
- `컴포넌트__유형`처럼 컴포넌트와 유형 구분에는 더블 언더바(`__`) 사용

정리하면:

- 컴포넌트 내부명: `_`
- 컴포넌트와 유형 분리: `__`
- 토큰 세부 구분: `-`

### 로컬 배리어블 / 로컬 스타일 규칙

- 모두 소문자
- 띄어쓰기는 언더바(`_`)
- 토큰 속성 구분은 하이픈(`-`)

예시 해석:

- `size-height`
- `font-size`
- `color-primary-50`

## 4. 토큰에 영향을 미치지 않는 네이밍 규칙

토큰명과 직접 연결되지 않는 작업 파일 요소는 보다 사람이 읽기 쉬운 방식으로 씁니다.

대상:

- 페이지(Page)
- 프레임(Frame)
- 프로퍼티(Property)

### 페이지 / 프레임

- 띄어쓰기로 단어 구분
- 영문 + 한글 병기 가능
- 영문 사용 시 첫 글자만 대문자

예시 해석:

- `Main menu (메인 메뉴)`

### 프로퍼티

- `Name`: 첫 글자 대문자
- `value`: 전체 소문자

즉, 토큰 네이밍과 작업 파일 표시용 이름은 같은 규칙을 쓰지 않습니다.

## 5. 토큰 구분자

`utility_03`는 토큰 구분자로 하이픈(`-`)을 권장합니다.

이유:

- CSS와의 일관성
- 점(`.`)이나 슬래시(`/`)보다 가독성이 높음

스킬 규칙으로 옮기면:

- 토큰 출력 예시는 기본적으로 kebab-case 계열로 제시
- 코드 변수명은 프레임워크 관례를 따르되, 토큰 원형은 하이픈 기준으로 유지

## 6. 토큰 주요 카테고리 네이밍

문서에서 설명하는 대표 카테고리는 다음입니다.

### 색상

- `primary`, `secondary`, `gray`처럼 역할 중심 이름 사용
- `blue`, `red`처럼 단순 색 이름은 지양
- 계열 단계는 숫자 척도로 표현

예:

- `primary-10`
- `primary-20`

메모:

- 기본은 10 단위 증가
- 더 세밀한 단계가 필요하면 5 단위 허용

### 타이포그래피

- 유형을 직접 드러내는 이름 사용

예:

- `font-family`
- `font-size`
- `line-height`

### 숫자 토큰

문서상 숫자 토큰은 주로 아래에 걸립니다.

- spacing
- radius
- size-height

규칙:

- 작은 단계에서 큰 단계로 일관되게 정의
- 4px, 8px 배수를 기본으로 사용
- 필요 시 2px 또는 10px 단위 보강
- 시멘틱 크기는 `small`, `medium`, `large` 사용
- 역할이 아닌 단계 번호는 `1`, `2` 등도 가능

## 7. 토큰 네이밍 구조

문서에는 토큰 네이밍의 큰 구조를 다음처럼 설명합니다.

- `namespace > theme > category > component > type > modifier`

동시에 세부 속성 설명에서는 아래 축들을 더 자세히 나열합니다.

- namespace
- theme
- category
- component
- type
- variant
- element
- state
- size
- modifier

실무 해석:

- 상위 문장은 축의 대표 구조를 간략히 요약한 것
- 하위 문단은 실제로 붙을 수 있는 세부 축을 풀어 쓴 것

따라서 스킬에서는 아래 형태를 표준 참조 구조로 쓰는 편이 안전합니다.

`namespace-theme-category-component-type-variant-element-state-size-modifier`

모든 축을 항상 다 쓰는 것은 아니고, 필요한 축만 앞에서부터 순서대로 붙입니다.

## 8. 세부 속성 축별 해석

### namespace

- 시스템 식별자
- 예: `krds`

### theme

- 테마나 모드
- 예: `light`, `high-contrast`

### category

- 큰 범주
- 예: `color`, `typography`, `spacing`, `shape`

### component

- UI 컴포넌트 이름
- 예: `button`, `input`, `link`, `card`

### type

- 범주 안에서의 역할
- 예: `background`, `surface`, `icon`, `padding`, `text`

### variant

- 계층 또는 시스템 변형
- 예: `primary`, `secondary`, `tertiary`, `danger`, `warning`, `success`, `info`

### element

- 컴포넌트 하위 요소
- 예: `label`, `title`, `body`, `line`

### state

- 상태
- 예: `default`, `hover`, `pressed`, `focused`, `disabled`, `error`, `active`, `completed`, `selected`, `unselected`, `indeterminate`

주의:

- 문서상 `view`는 읽기 상태로 소개되지만 사용 금지 상태라고 적혀 있으므로 스킬에서는 기본 추천 상태로 쓰지 않는 편이 안전합니다.

### size

- 약어 대신 명확한 크기명 사용
- 예: `xxsmall`, `xsmall`, `small`, `medium`, `large`, `xlarge`, `xxlarge`

### modifier

- 추가 변형이나 표현 강도
- 예:
  - 형태: `rounded`, `square`
  - 채움/선: `fill`, `line`
  - 강조: `subtler`, `subtle`, `bold`, `bolder`
  - 밝기: `lighter`, `light`, `dark`, `darker`

## 9. 속성 접미사 메모

문서 후반부에는 자주 쓰이는 속성 접미사 계열도 정리되어 있습니다.

대표 예:

- `background`
- `surface`
- `divider`
- `border`
- `element`
- `action`
- `gap`
- `padding`
- `fill`
- `line`
- `alpha`
- `neutral`
- `on-*`
- `dim`
- `transparency`
- `inverse`
- `static`

스킬 반영 포인트:

- 토큰명 제안 시 역할 접미사를 우선 사용
- 시각 묘사형 이름보다 역할형 이름을 우선 사용

## 10. 스킬로 옮길 때의 강한 규칙

스킬에는 아래를 강한 규칙으로 넣는 편이 맞습니다.

1. 색 이름보다 역할 이름을 우선한다.
2. 토큰 원형은 하이픈(`-`) 구분자를 기본으로 한다.
3. 약어를 만들지 않는다.
4. 토큰명은 모두 소문자를 기본으로 한다.
5. 필요한 축만 앞에서부터 순서대로 붙인다.
6. 상태, 크기, modifier는 뒤쪽 축으로만 붙인다.
7. 시각 표현 자체를 이름의 기준으로 삼지 않는다.

## 11. 스킬이 사용자에게 설명해야 할 것

토큰 네이밍 관련 요청이 들어오면 스킬은 최소한 아래를 밝혀야 합니다.

- 현재 이름이 역할형인지 시각형인지
- primitive / semantic / component 중 어느 레벨의 토큰인지
- theme 축이 필요한지
- state, size, modifier가 정말 필요한지
- 코드 변수명과 디자인 토큰 원형을 어떻게 분리할지

## 12. 추천 답변 방식

### 네이밍 제안 요청

- 잘못된 이름
- 왜 문제인지
- KRDS식 대체 이름
- 축별 분해

### 코드 리팩터링 요청

- 기존 토큰명 분류
- 유지 가능한 alias
- 새 이름 규칙
- 영향 범위

### 디자인 시스템 리뷰 요청

- 표기 혼합 여부
- 약어 사용 여부
- 역할명/시각명 혼용 여부
- 상태명/크기명 순서 오류 여부
