---
name: krds-guide
description: Use when the user wants UI design, implementation, refactoring, or review aligned with KRDS (Korea Design System), including KRDS style guidance, components, basic patterns, service patterns, accessibility expectations, and public-service UX decisions for Korean government-style digital services.
---

# KRDS Guide

Use this skill when the user asks for any of the following:

- KRDS Figma 라이브러리, 디자이너용 리소스, 개발자용 HTML/React/Vue Kit 설치 및 적용 방법을 정리해 달라고 할 때
- KRDS 디자인 원칙에 맞는 방향이나 판단 기준을 달라고 할 때
- KRDS 기준으로 화면이나 컴포넌트를 설계해 달라고 할 때
- KRDS 스타일에 맞게 UI를 수정하거나 리뷰해 달라고 할 때
- KRDS 컴포넌트/패턴을 골라 달라고 할 때
- 공공서비스형 UX 흐름을 KRDS 서비스 패턴에 맞춰 정리해 달라고 할 때
- KRDS 디자인 토큰, 레이아웃, 색상, 타이포그래피를 코드에 반영해 달라고 할 때
- KRDS 토큰 네이밍, 변수명, 컴포넌트명 규칙을 정리해 달라고 할 때

Do not use this skill for generic visual polish that has no KRDS requirement.

## Quick Routing

Classify the request first.

1. Getting-started, resource, library, setup, install, or design-to-code handoff question:
   Read [references/getting-started.md](references/getting-started.md).
2. Style or token question:
   Read [references/style.md](references/style.md).
3. Principle, UX rationale, or high-level review question:
   Read [references/principles.md](references/principles.md).
4. Token naming or naming-system question:
   Read [references/naming.md](references/naming.md).
5. Component choice or component implementation question:
   Read [references/components.md](references/components.md).
6. Flow, form, onboarding, confirmation, search, login, application, or information architecture question:
   Read [references/patterns.md](references/patterns.md).
7. If links, numbering, category placement, or document gaps are ambiguous:
   Read [references/known-gaps.md](references/known-gaps.md).

If the task is about setup or onboarding, read `getting-started.md` first.
Otherwise, read `style.md` first, then only the single most relevant domain reference.

## Working Rules

1. Use KRDS terminology exactly as documented. Do not invent component or pattern names.
2. Distinguish clearly between:
   - style rules
   - components
   - basic patterns
   - service patterns
3. When a request spans more than one layer, decide in this order:
   - service pattern
   - basic pattern
   - component
   - style/token
4. Prefer KRDS structural guidance over decorative redesign.
5. Treat KRDS design principles as upstream constraints before local visual preference.
6. Treat accessibility as a default requirement, not an optional add-on.
7. For service-pattern work, always state whether the proposal satisfies `필수(Do)`, `권장(Better)`, and `우수(Best)` levels.
8. For review tasks, call out KRDS mismatches concretely and map them back to the correct layer.

## Execution Flow

1. Identify the product surface:
   - government/public service
   - admin tool
   - citizen-facing service
   - mobile app or mobile web
2. Decide whether the problem is:
   - service-wide journey
   - page/task flow
   - component selection
   - visual system or token issue
3. Load only the references needed for that decision.
4. Produce a KRDS-grounded answer in this order:
   - applicable KRDS scope
   - required decisions
   - recommended components/patterns
   - accessibility constraints
   - implementation or review notes

## Output Shape

For design or planning requests, answer with:

- applicable KRDS layer
- selected pattern/component/style rules
- mandatory constraints
- optional improvements

For implementation requests, answer with:

- what KRDS rules are being applied
- what changed in code
- what remains intentionally unchanged

For review requests, answer with:

- KRDS mismatches first
- risk or usability consequence
- exact correction direction

## Non-Negotiable KRDS Checks

- Standard vs adaptive style choice must be intentional.
- Identity components are not free-form branding surfaces.
- Information density must follow KRDS layout and spacing logic.
- Form inputs must follow KRDS input constraints, not just visual similarity.
- Service tasks must be explained as user journeys, not only screens.

## Repository Research Notes

This skill was built from the detailed KRDS 조사 문서 in:

- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/getting-started-outline.md`
- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/style-guide-01-07.md`
- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/component-inventory.md`
- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/pattern-inventory.md`
- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/skill-authoring-notes.md`

Use those files only when the bundled references are insufficient.
