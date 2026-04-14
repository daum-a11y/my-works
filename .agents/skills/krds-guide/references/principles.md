# KRDS Design Principles Reference

Use this file when the user asks for KRDS-aligned product direction, UX rationale, decision criteria, or high-level review principles.

Official source:

- `utility_02`: <https://www.krds.go.kr/html/site/utility/utility_02.html>

Detailed research note:

- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/principles-utility-02.md`

## 1. How to Use This Reference

Use these principles before choosing components or patterns when the question is about:

- service direction
- UX rationale
- tradeoffs
- prioritization
- review standards

These principles sit above individual components and patterns.

## 2. User-Centered Service

Core idea:

- decisions should be based on actual users, their goals, and their context

Apply this by:

- defining user types beyond demographics
- understanding goal, frequency, and task difficulty
- considering the full journey from entry to completion

In reviews, flag designs that optimize for internal structure but not user outcome.

## 3. Inclusive Service for Everyone

Core idea:

- the service must work for people with different abilities, ages, languages, and situations

Apply this by:

- considering accessibility from the first design stage
- removing the hardest barriers first
- offering alternative paths without making them feel like second-class options

In reviews, flag solutions that assume one ideal user or one ideal interaction mode.

## 4. Common Experience with Room for Service-Specific Needs

Core idea:

- government services should feel consistent across institutions, without forcing every service into the same exact shape

Apply this by:

- using KRDS guidance as the common base
- adapting flexibly to service goals and context
- preserving familiarity across services

In reviews, flag needless novelty and also flag rigid reuse that ignores the service's actual task.

## 5. Fast and Simple Service

Core idea:

- reduce unnecessary decisions and actions

Apply this by:

- minimizing steps only when it does not break comprehension or safety
- checking whether each step is necessary
- considering pace as well as count

Important nuance:

- fewer steps is not always better if the task requires careful confirmation

## 6. Easy to Understand and Use

Core idea:

- users should understand the content and interaction model without extra help whenever possible

Apply this by:

- using familiar language and interaction patterns
- making information flow logical and predictable
- helping users recover from mistakes
- collecting feedback on confusing moments and fixing them quickly

In reviews, flag vague language, surprising interactions, and dead-end error handling.

## 7. Service that Reflects Diverse Situations

Core idea:

- users differ in skill, frequency, device, environment, and preferred way of working

Apply this by:

- observing how people actually use the service
- offering multiple suitable paths for frequent tasks
- allowing advanced options without burdening new users
- supporting continuity across device contexts

In reviews, flag one-size-fits-all flows that remove user autonomy.

## 8. Trustworthy Service

Core idea:

- users must clearly recognize the service as official and rely on the accuracy of its information

Apply this by:

- using official identity surfaces consistently
- keeping information current and accurate
- communicating update delays when accuracy cannot be refreshed immediately

In reviews, flag weak official-service cues and outdated or ambiguous information.

## 9. Review Order

When reviewing a screen or flow with KRDS principles, check in this order:

1. user goal support
2. inclusion and accessibility
3. consistency with common government-service experience
4. simplicity of path
5. clarity and recoverability
6. support for diverse contexts
7. trust signals and information accuracy

## 10. What to Produce

When the user asks for a KRDS-grounded plan or review, explicitly state:

- which principle is driving the recommendation
- what user problem it addresses
- whether the issue is structural or local
- what KRDS layer should be consulted next: pattern, component, or style
