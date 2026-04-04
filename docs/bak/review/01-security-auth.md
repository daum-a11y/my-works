# 보안 / 권한 / 인증 리뷰

현재 브랜치 기준 상태:
- 해결됨: `members_self_update` 권한 상승 경로 제거
- 해결됨: 일반 사용자 라우트와 RLS 충돌을 공개 view/RPC 기반으로 정리
- 해결됨: 관리자 비밀번호 초기화를 레거시 고정 비밀번호 경로에서 Supabase Auth 재설정 메일로 교체
- 해결됨: `upsert_project_page`의 기존 프로젝트 연결 권한 검증 추가
- 해결됨: 관리자 CRUD와 RLS 정책 불일치 해소
- 해결됨: 관리자 export Edge Function의 컬럼/RPC 불일치 해소
- 해결됨: `current_user_is_admin()`의 정책 재귀 위험을 `security definer` helper로 우회
- 잔여: 현재 비밀번호 입력 UI가 실제 재인증을 수행하지 않음

주의:
- SQL 권한 수정은 현재 `my-works/supabase/migrations/000_initial_ops_schema.sql`에 포함돼 있습니다.

## 1. 해결됨: `P0` 일반 사용자가 자기 행을 수정해 관리자 권한을 획득할 수 있던 문제

근거:
- `my-works/supabase/migrations/000_initial_ops_schema.sql`

조치:
- `members_self_update` 정책을 제거했습니다.
- `members`의 `insert/update/delete`를 관리자 전용 정책으로 분리했습니다.

## 2. 해결됨: `P1` 관리자 비밀번호 초기화가 레거시 API와 고정 비밀번호에 의존하던 문제

근거:
- `my-works/src/features/admin/admin-client.ts`
- `my-works/src/features/admin/members/AdminMembersPage.tsx`

조치:
- `PUT /api/v1/member/:userId/password` 호출과 `linkagelab` 고정 비밀번호 의존을 제거했습니다.
- 관리자 초기화는 `supabase.auth.resetPasswordForEmail()`로 전환했습니다.

## 3. 해결됨: `P2` `upsert_project_page`가 기존 프로젝트 연결 권한을 검증하지 않던 문제

근거:
- `my-works/supabase/migrations/000_initial_ops_schema.sql`

조치:
- 대상 프로젝트의 생성자/담당자/관리자만 페이지를 추가할 수 있게 함수 내부 검증을 넣었습니다.

## 4. 해결됨: `P1` 관리자 CRUD와 실제 RLS 정책이 불일치하던 문제

근거:
- `my-works/src/features/admin/admin-client.ts`
- `my-works/supabase/migrations/000_initial_ops_schema.sql`

조치:
- `members`, `task_types`, `service_groups`에 관리자 전용 `insert/update/delete` 정책을 추가했습니다.

## 5. 잔여: `P1` 현재 비밀번호 변경 UI가 실제로 현재 비밀번호를 검증하지 않음

근거:
- `my-works/src/features/profile/ProfilePage.tsx`
- `my-works/src/features/settings/UserProfilePage.tsx`
- `my-works/src/features/auth/AuthContext.tsx`

설명:
- UI는 현재 비밀번호를 받지만, 실제 구현은 `supabase.auth.updateUser({ password })`만 호출합니다.
- 현재 비밀번호 재인증이 필요하다면 로그인 재검증 흐름이 추가돼야 합니다.

## 6. 해결됨: `P1` 관리자 내보내기 Edge Function이 현재 스키마와 어긋나던 문제

근거:
- `my-works/supabase/functions/export-tasks/index.ts`
- `my-works/supabase/migrations/000_initial_ops_schema.sql`

조치:
- Edge Function이 `user_active`를 읽도록 수정했습니다.
- 누락된 `admin_search_tasks` RPC를 migration에 추가했습니다.

## 7. 해결됨: `P2` `current_user_is_admin()`의 RLS 재귀 의존 위험

근거:
- `my-works/supabase/migrations/000_initial_ops_schema.sql`

조치:
- `current_member_id()`, `current_user_is_admin()`를 `security definer` helper로 재정의했습니다.
