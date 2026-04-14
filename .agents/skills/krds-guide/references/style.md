# KRDS Style Reference

Use this file for style, token, and visual-system decisions.
Use [naming.md](naming.md) for token naming and notation rules.

For the full 조사본, see:

- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/style-guide-01-07.md`

## 1. Scope

This reference covers KRDS style `01` through `07`.

- `style_01`: 디자인 스타일 소개
- `style_02`: 색상
- `style_03`: 타이포그래피
- `style_04`: 형태
- `style_05`: 레이아웃
- `style_06`: 아이콘
- `style_07`: 디자인 토큰

## 2. First Decision

Choose the style mode first.

- 표준형 스타일:
  KRDS 기본 체계를 강하게 유지하는 공공서비스형 접근
- 확장형 스타일:
  서비스 정체성을 일부 확장하되 KRDS 구조와 접근성 기준은 유지

If the user asks for a government-style service and does not say otherwise, start from 표준형.

## 3. Color

### Core rules

- 색상은 역할 중심으로 써야 한다.
- 하나의 화면에서 과도한 브랜드 색 변형을 만들지 않는다.
- 색상만으로 상태를 전달하지 않는다.
- 텍스트, 보더, 아이콘 대비를 함께 검토한다.

### Magic numbers

KRDS 문서에서 반복적으로 보이는 기준값:

- `40`
- `50`
- `70`
- `90`

These are used as palette intensity anchors. Preserve role consistency when mapping tokens.

### System color mindset

- 기본 정보
- 성공
- 경고
- 위험

Status colors need textual or icon reinforcement.

### Practical check

- 핵심 액션은 분명해야 한다.
- 보조 액션은 과도하게 튀지 않아야 한다.
- 상태 색상은 동일 의미를 반복 유지해야 한다.

## 4. Typography

### Defaults

- 기본 서체: `Pretendard GOV`
- 기본 줄 간격: `150%`
- 기본 본문 크기 기준: `17px`
- rem 운용 기준: `62.5%`

### Weight

Use weight as hierarchy, not decoration.

- display / heading / body 위계 유지
- 같은 수준 텍스트에 불필요한 weight 혼합 금지

### Practical check

- 긴 한국어 문장이 줄바꿈될 때 읽기 흐름이 깨지지 않는가
- 본문과 보조 텍스트의 위계가 명확한가
- 모바일에서도 한 줄 길이가 과도하지 않은가

## 5. Shape

KRDS shape is restrained and systematic.

- 작은 반경부터 큰 반경까지 단계형 사용
- 문서상 대표 범위는 대체로 `2px` ~ `12px`
- `%`보다 `px` 기반 제어가 기본

Use `%` only when the shape is inherently proportional, such as circular treatment.

## 6. Layout

### What matters

- screen margin
- column
- gutter
- content width
- spacing

### Practical KRDS stance

- 콘텐츠 폭은 지나치게 넓히지 않는다.
- 정보 그룹은 간격 체계로 위계를 만든다.
- 전체 화면보다 실제 읽기 영역의 질서를 우선한다.

The 조사본 기준으로 최대 콘텐츠 폭 `1200px` 메모가 있으므로, wide desktop에서도 과도한 full-width 정보 배치는 피한다.

## 7. Icon

### Default constraints

- SVG 사용
- 기본 크기 축은 `24px`
- 대표 stroke 기준은 `1.6px`

Use icons as semantic supports. Do not replace text labels with icons where comprehension would drop.

## 8. Design Tokens

Use KRDS token flow:

1. primitive token
2. semantic token
3. component token

Do not jump straight from raw hex values to component styles if the task is supposed to follow KRDS systematically.

## 9. What to Say in Answers

When applying KRDS style guidance, explicitly state:

- whether the screen is 표준형 or 확장형
- which token layer is changing
- whether the decision affects accessibility
- whether the change is local or system-wide

## 10. When Reviewing Code

Flag these issues:

- arbitrary hex colors without role mapping
- mixed typography scales with no hierarchy
- over-rounded or inconsistent shape system
- layout widths and spacing that ignore KRDS rhythm
- icon usage that removes text comprehension
