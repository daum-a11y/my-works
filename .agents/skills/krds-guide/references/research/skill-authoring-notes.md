# KRDS 기반 Codex 스킬 작성 메모

보조 출처:

- 로컬 스킬 작성 가이드: `/Users/jiho/.codex/skills/.system/skill-creator/SKILL.md`
- KRDS 조사 자료:
  - [README.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/README.md)
  - [principles-utility-02.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/principles-utility-02.md)
  - [style-guide-01-07.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/style-guide-01-07.md)
  - [component-inventory.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/component-inventory.md)
  - [pattern-inventory.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/pattern-inventory.md)
  - [token-naming-utility-03.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/token-naming-utility-03.md)

## 1. 어떤 스킬을 만들면 좋은가

이번 조사 기준으로는 다음 두 가지 방향이 가능합니다.

### 방향 A. KRDS 실무 적용 스킬

용도:

- 화면/컴포넌트/패턴 설계 요청 시 KRDS 기준으로 판단
- 접근성/토큰/패턴까지 함께 반영

장점:

- 실제 구현과 리뷰에 바로 씀
- 컴포넌트/패턴/스타일을 한 번에 다룸

단점:

- 범위가 넓어져 `SKILL.md`가 비대해지기 쉬움

### 방향 B. KRDS 문서 탐색 스킬

용도:

- 사용자의 요구를 KRDS 문서 트리에서 어느 페이지를 봐야 하는지 안내
- 필요한 참고 문서를 찾아 읽게 만드는 라우터 역할

장점:

- SKILL.md를 짧게 유지 가능
- reference 파일을 효율적으로 나누기 쉬움

단점:

- 실제 구현 규칙은 별도 reference를 더 읽어야 함

실무적으로는 A를 만들되, 내부 구조는 B처럼 라우팅형으로 설계하는 편이 좋습니다.

## 2. 권장 폴더 구조

```text
krds-guide/
├── SKILL.md
└── references/
    ├── style-guide.md
    ├── components.md
    ├── patterns.md
    ├── detail-page-anatomy.md
    └── known-gaps.md
```

현재 조사 원본은 `references/research` 아래에 있으므로, 실제 실무용 reference를 더 압축할 때는 다음 매핑이 자연스럽습니다.

- `style-guide-01-07.md` -> `references/style-guide.md`
- `component-inventory.md` -> `references/components.md`
- `pattern-inventory.md` -> `references/patterns.md`
- `README.md`의 관찰 메모 -> `references/known-gaps.md`

## 3. SKILL.md에는 무엇만 넣어야 하는가

`skill-creator` 가이드 기준으로 `SKILL.md`는 얇아야 합니다.  
KRDS 스킬의 `SKILL.md`에는 아래 정도만 넣는 것이 좋습니다.

### 3.1 트리거 설명

예:

- KRDS 기준으로 UI를 만들거나 고쳐야 할 때
- 공공기관/정부 서비스 UI를 설계할 때
- 접근성, 컴포넌트, 패턴, 토큰을 KRDS 기준으로 맞출 때
- 화면이 KRDS 표준형/확장형 중 무엇인지 판단해야 할 때

### 3.2 작업 순서

예:

1. 결과물이 `표준형`인지 `확장형`인지 판단
2. 요청이 `스타일`, `컴포넌트`, `기본 패턴`, `서비스 패턴` 중 어디에 해당하는지 분기
3. 필요하면 해당 reference만 읽기
4. 접근성/적용 수준/토큰 규칙으로 결과 검토

### 3.3 즉시 기억해야 할 강한 규칙

- 본문 16px 미만 금지, 기본은 17px 기준
- line-height 150% 미만 지양
- 색상은 매직넘버 기반으로 판단
- 상태 전달을 색상만으로 하지 않음
- 표준형 래디어스 최대 12px
- 8-point spacing
- 표준형 콘텐츠 폭 최대 1200px
- 아이콘 기본 24px / 1.6px

## 4. references로 반드시 분리할 내용

다음 내용은 `SKILL.md`에 직접 넣으면 너무 길어집니다.

- 컴포넌트 전체 인벤토리
- 기본 패턴/서비스 패턴 전체 목록
- 상세 페이지 구조 예시
- 색상/타이포/레이아웃 세부 수치
- 요약 페이지 카운터 불일치 같은 사이트 관찰 메모

즉, `SKILL.md`는 판단 흐름, `references`는 사실 자료 역할로 분리해야 합니다.

## 5. KRDS 스킬의 추천 판단 플로우

```text
1. 기관 유형 판단
   - 정부 상징 로고 기반인가 -> 표준형 우선
   - 독자 브랜드인가 -> 확장형 가능

2. 요청 단위 판단
   - 토큰/색/폰트/간격 문제 -> 스타일
   - 단일 UI 조각 문제 -> 컴포넌트
   - 반복 화면 과업 문제 -> 기본 패턴
   - 메인 화면/핵심 여정 문제 -> 서비스 패턴

3. 접근성 판단
   - 대비
   - 반복 영역 건너뛰기
   - 키보드 초점
   - 자동완성/입력 목적

4. 구현 판단
   - 토큰까지 필요한가
   - CSS 변수/SCSS 배열 패턴이 필요한가
   - HTML Component Kit 구조를 참조해야 하는가
```

## 6. 스킬의 출력 스타일 권장안

스킬이 실제 답변에서 내놓아야 하는 형식도 미리 정해두는 편이 좋습니다.

### 설계 요청일 때

- 적용 유형: 표준형/확장형
- 관련 KRDS 영역: 스타일/컴포넌트/패턴
- 반드시 지켜야 할 규칙
- 권장 대안
- 구현 시 주의할 접근성 포인트

### 구현 요청일 때

- 사용할 컴포넌트/패턴
- 토큰/스타일 기준
- 마크업/상태/상호작용 주의점
- 검증 체크리스트

### 리뷰 요청일 때

- KRDS 위반 지점
- 접근성 위반 지점
- 표준형/확장형 판단 오류
- 패턴 선택 오류

## 7. 스킬 메타데이터 초안

실제 메타데이터 문구 후보:

### 이름 후보

- `krds-guide`
- `krds-ui`
- `krds-public-service-ui`

### 설명 후보

`Use when designing, implementing, reviewing, or refactoring Korean public-service interfaces that should follow KRDS style, component, basic-pattern, service-pattern, accessibility, and token conventions.`

### 트리거 문장 후보

- KRDS 기준으로 화면을 만들어 달라
- 공공기관 UI를 KRDS에 맞게 정리해 달라
- 정부 서비스 컴포넌트/패턴을 KRDS 기준으로 골라 달라
- KRDS 토큰 기준으로 CSS를 맞춰 달라

## 8. 스킬이 경고해야 하는 known gaps

이 부분은 스킬 내부 참고 메모로 두는 것이 좋습니다.

### 8.1 스타일 문서 범위

- 현재 사이트는 `style_08` 엘리베이션이 별도로 존재
- 01~07만 읽으면 엘리베이션이 빠질 수 있음

### 8.2 요약 페이지 카운터

- 컴포넌트/기본 패턴 카운터와 실제 노출 메뉴 수 불일치
- 스킬은 카운터가 아니라 실제 메뉴를 기준으로 답변해야 함

### 8.3 카테고리 예외

- `도움 패널`은 문서상 입력 카테고리 쪽에 걸쳐 보임
- 도움/입력 경계가 문서상 완전히 깔끔하지 않음

## 9. 실제 스킬로 만들 때의 최소 작업 순서

1. `references/research` 자료를 목적별 reference로 연결 또는 압축
2. 짧은 `SKILL.md` 작성
3. 트리거 문구를 보수적으로 작성
4. 실제 테스트 프롬프트 5개 정도로 검증
5. 필요 시 엘리베이션(`style_08`) 보강

## 10. 테스트 프롬프트 예시

- KRDS 표준형 기준으로 로그인 화면 레이아웃을 제안해 달라
- 개인정보 입력 폼을 KRDS 기본 패턴 기준으로 검토해 달라
- 공공기관 서비스 메인 화면이 방문 패턴 기준에 맞는지 리뷰해 달라
- 버튼, 입력 필드, 도움 패널을 KRDS 컴포넌트 기준으로 구성해 달라
- 현재 CSS를 KRDS 토큰 규칙에 맞게 정리해 달라

## 11. 결론

KRDS 스킬은 단순 스타일 스킬이 아니라 다음을 함께 다루는 복합 스킬이어야 합니다.

- 정부/공공 서비스 맥락
- 표준형/확장형 분기
- 스타일 수치 규칙
- 컴포넌트 선택
- 기본 패턴/서비스 패턴 선택
- 접근성
- 토큰/코드 반영

따라서 실제 스킬은 “예쁜 UI 생성기”가 아니라 “KRDS 기준 판단기 + 구현 가이드”로 설계하는 것이 맞습니다.
