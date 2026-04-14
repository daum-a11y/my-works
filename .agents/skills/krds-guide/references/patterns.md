# KRDS Patterns Reference

Use this file when the task is about page flow, form flow, service journey, information architecture, or public-service UX behavior.

For the full 조사본, see:

- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/pattern-inventory.md`

## 1. Pattern Layers

KRDS has two distinct pattern layers.

### Basic patterns

Reusable page or task patterns:

- 개인 식별 정보 입력
- 도움
- 동의
- 목록 탐색
- 사용자 피드백
- 상세 정보 확인
- 오류
- 입력폼
- 첨부 파일
- 필터링·정렬
- 확인
- 모바일

### Service patterns

User-journey patterns for core service tasks:

- 방문
- 검색
- 로그인
- 신청
- 정책 정보 확인

## 2. Routing Rule

Choose patterns in this order:

1. Is this a service journey question?
   Use service patterns first.
2. Is this a page or task execution question?
   Use a basic pattern.
3. Is it only about a control or surface?
   Use component guidance.

## 3. Basic Pattern Document Shape

Basic pattern detail pages commonly contain:

- 유형
- 사용성 가이드라인
- 예시
- 접근성 가이드라인
- FAQ
- 변경 내역

These are useful when the user asks for a page-level solution.

## 4. Personal Information Input Rules

This is one of the highest-value KRDS patterns for real work.

### Common rules

- truly necessary information only
- explain why collection is needed
- allow copy and paste
- do not force defaults
- placeholders must not masquerade as entered values

### Name fields

- support diverse characters and spaces
- avoid excessive minimum-length assumptions
- do not force unnecessary first-name/last-name splits
- consider renamed users and foreign names

### Birth date

- do not default to a date picker
- do not force year/day select boxes when direct input is clearer
- make input format explicit

### Gender

- do not preselect
- exclude from required input when not necessary
- provide a `선택 안 함` option when relevant

### Phone number

- request only the needed phone-number type
- label clearly
- allow multiple common input formats
- use a combobox for country code when needed

When the task involves personal data entry, these rules outrank superficial visual alignment.

## 5. Service Pattern Document Shape

Service pattern detail pages commonly center on:

- 유형
- 이용 상황별 플로
- 사용성 가이드라인 체크리스트
- 적용 수준
- 변경 내역

This means service-pattern work must be described as a journey, not just a single screen.

## 6. Do / Better / Best

For service-pattern tasks, always say which level the proposal satisfies.

- `필수(Do)`: minimum required behavior
- `권장(Better)`: stronger but still broadly expected practice
- `우수(Best)`: high-quality enhancement

If the user asks for a review, evaluate the work using this frame explicitly.

## 7. Visit Pattern

Use the 방문 service pattern for first-contact or entry experiences.

The 조사본 notes these representative concerns:

- 정책 및 서비스 정보
- 기관 정보
- 내비게이션
- 캠페인 및 홍보 정보
- 긴급 알림
- 연락처

Representative user flow:

- 정보 탐색
- 정보 확인
- 이동

## 8. Application Pattern

Use the 신청 service pattern when the user needs:

- form submission
- issuance
- eligibility/result lookup
- reservation

The 조사본 shows flow concerns such as:

- 신청 대상 탐색
- 신청서 작성
- 확인/확정
- 자동 입력
- 도움말 확인
- 첨부
- 임시 저장

If a user asks for a public-service application UI, you usually need:

1. service pattern `신청`
2. basic patterns like `입력폼`, `확인`, `첨부 파일`
3. relevant input and feedback components

## 9. Search and Login

Use service patterns when the user asks for:

- large-result discovery
- authenticated personalization
- identity verification entry points

Do not reduce these to a single search box or sign-in form.

## 10. What to Check in Reviews

Flag these KRDS mismatches:

- journey-level task solved only as a screen mockup
- confirmation missing before irreversible action
- error state explains failure but not recovery
- filtering and sorting controls without exploration logic
- public-service application flow missing save, help, or attachment reasoning
- information pages lacking clear entry, scanning, and follow-up action structure
