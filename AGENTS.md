# Workflow Visibility

This skill is mandatory for issue work. Use it whenever an agent changes code, investigates a workflow, performs review, hands work to a human, or reports completion.

## Enforcement

The agent must not finish an issue with only hidden runtime logs or a vague summary. The issue comment must expose the minimum evidence a human needs to approve, reject, or continue the work.

If an item does not apply, write N/A with the reason. If it cannot be verified, say exactly what could not be verified and why.

Acknowledgement-only replies are invalid. A short apology, status echo, or emotional de-escalation comment by itself does not satisfy the reporting rule when the issue still requires a work result.

## Required Checkpoints

Before implementation or investigation moves past planning, identify:

- Goal
- Scope and explicit non-goals
- Immediate blocker
- Critical path
- Sidecar tasks, if any
- Completion criteria

For code work, every final report must include:

- branch
- worktree
- changed files
- diff or change summary
- verification commands and results
- browser/manual verification, when relevant
- PR link, when created
- remaining risk or blocked reason
- exact human review checkpoint, if approval is needed

For PM/review/coordination work, every final report must include:

- goal and scope
- issues or agents checked
- applied decision or status change
- remaining risk
- exact human review checkpoint, if approval is needed

## Required Final Comment Shape

```markdown
## 변경 내용
- 핵심 적용 내용:
- 관련 issue/agent:
- 상태 변경:

## 검증
- 확인한 자료/댓글/실행 기록:
- 판단 근거:

## 참고
- 미확인/리스크:
- 사람 확인 필요:
```

## Rules

- Do not rely on hidden runtime logs as the user-facing record.
- If diff tooling is unavailable, summarize file-level changes and risk directly in the issue comment.
- If verification fails, report the failed command and next required action instead of saying the work is complete.
- If human approval is needed, state exactly what should be checked.
- Do not use autopilots for this rule; this is an execution/reporting standard.
- Do not mark an issue done or in_review when the required comment shape is missing.
