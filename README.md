# My Works

`ops-web`는 접근성팀 업무보고 운영툴의 1차 React 이관 앱입니다.

## 앱 구성

- `apps/ops-web`: 1차 사용자 앱
- `supabase/migrations`: 1차 스키마와 RLS 초안
- `supabase/functions/export-tasks`: 업무보고 다운로드 함수 초안
- `docs/legacy-cleanup-targets.md`: 신규 스키마에서 제외한 레거시 정리 대상

## 실행

```bash
pnpm install
pnpm dev
```

## 환경변수

`apps/ops-web/.env.example`를 참고합니다.
