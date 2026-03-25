# My Works

이 저장소는 접근성팀 업무보고 운영툴의 React 이관 앱입니다.

## 앱 구성

- `src`: 앱 소스
- `public`: 정적 자산
- `supabase/legacy-supabase-migration.md`: 레거시 MariaDB dump를 Supabase로 옮기는 절차
- `supabase/migrations`: 1차 스키마와 RLS 초안
- `supabase/functions/export-tasks`: 업무보고 다운로드 함수 초안
- `docs/legacy-cleanup-targets.md`: 신규 스키마에서 제외한 레거시 정리 대상

## 실행

```bash
pnpm install
pnpm dev
```

## Supabase 반영

앱 코드는 아래 SQL 객체를 전제로 동작합니다.

- `members_public_view`
- `active_members_public_view`
- `project_pages_public_view`
- `bind_auth_session_member(...)`
- `admin_search_tasks(...)`

따라서 DB에는 아래 migration까지 적용돼 있어야 합니다.

- `supabase/migrations/20260324_000001_initial_ops_schema.sql`

현재 초기 migration에 공개 view/RPC/RLS 보정이 포함돼 있습니다. 이 단계가 빠지면 회원 조회, 페이지 조회, 세션-멤버 바인딩, 관리자 내보내기에서 런타임 오류가 날 수 있습니다.

## 환경변수

루트의 `.env.example`를 참고합니다.
