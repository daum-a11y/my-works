# report_required 전수조사

작성일: 2026-03-31

## 요약

현재 워크트리 기준으로 `report_required` / `reportRequired`는 앱 코드, 관리자 화면, 테스트, 문서에는 남아 있다.

반면 `supabase/sql` 기준 스키마 파일에는 `report_required`가 존재하지 않는다.

즉 현재 저장소 상태는 아래처럼 나뉜다.

- 앱 코드: 사용 중
- 관리자 화면: 사용 중
- 테스트: 사용 중
- 문서: 언급 있음
- `supabase/sql`: 컬럼 정의 없음

## 앱 코드 사용처

### 도메인 / 데이터 매핑

- [src/lib/domain.ts](/Users/gio.a/Documents/workspace/next/my-works/src/lib/domain.ts):28
  - `Member.reportRequired: boolean`
- [src/lib/data-client.ts](/Users/gio.a/Documents/workspace/next/my-works/src/lib/data-client.ts):506
  - `record.report_required`를 `reportRequired` boolean으로 변환

### 대시보드

- [src/features/dashboard/DashboardPage.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/features/dashboard/DashboardPage.tsx):19
  - `member?.reportRequired === true`일 때 업무 현황 캘린더 노출

### 업무보고

- [src/features/reports/use-reports-slice.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/reports/use-reports-slice.ts):161
  - `canEditReports = Boolean(member?.reportRequired)`
- [src/features/reports/use-reports-slice.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/reports/use-reports-slice.ts):304
  - 저장 시 `member.reportRequired` 검사
- [src/features/reports/use-reports-slice.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/reports/use-reports-slice.ts):374
  - 삭제 시 `member.reportRequired` 검사
- [src/features/reports/use-reports-slice.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/reports/use-reports-slice.ts):561
  - 오버헤드 등록 시 `member?.reportRequired` 검사

## 관리자 화면 사용처

### 타입 / 클라이언트

- [src/features/admin/admin-types.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/admin-types.ts):133
- [src/features/admin/admin-types.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/admin-types.ts):151
  - 관리자용 멤버 타입에 `reportRequired` 존재

- [src/features/admin/admin-client.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/admin-client.ts):197
  - `record.report_required` -> `reportRequired` 변환
- [src/features/admin/admin-client.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/admin-client.ts):574
- [src/features/admin/admin-client.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/admin-client.ts):590
- [src/features/admin/admin-client.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/admin-client.ts):599
- [src/features/admin/admin-client.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/admin-client.ts):610
  - 관리자 멤버 조회 / 저장 payload 및 select 컬럼에 `report_required` 사용

### 관리자 멤버 UI

- [src/features/admin/members/AdminMemberRow.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/AdminMemberRow.tsx):18
- [src/features/admin/members/AdminMemberRow.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/AdminMemberRow.tsx):46
  - 목록에서 `대상 / 비대상` 표기

- [src/features/admin/members/member-admin-form.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/member-admin-form.ts):12
- [src/features/admin/members/member-admin-form.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/member-admin-form.ts):27
- [src/features/admin/members/member-admin-form.ts](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/member-admin-form.ts):39
  - 폼 기본값 / 변환값에 `reportRequired` 사용

- [src/features/admin/members/AdminMemberEditorPage.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/AdminMemberEditorPage.tsx):128
- [src/features/admin/members/AdminMemberEditorPage.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/AdminMemberEditorPage.tsx):296
- [src/features/admin/members/AdminMemberEditorPage.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/AdminMemberEditorPage.tsx):299
- [src/features/admin/members/AdminMemberEditorPage.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/AdminMemberEditorPage.tsx):303
  - 멤버 편집 화면에서 `reportRequired` 읽기/수정

## 테스트 사용처

- [src/test/dashboard-page.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/test/dashboard-page.test.tsx):50
- [src/test/dashboard-page.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/test/dashboard-page.test.tsx):125
- [src/test/dashboard-page.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/test/dashboard-page.test.tsx):136

- [src/test/reports-page.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/test/reports-page.test.tsx):185

- [src/test/app-shell.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/test/app-shell.test.tsx):87

- [src/features/admin/members/AdminMembersPage.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/AdminMembersPage.test.tsx):49
- [src/features/admin/members/AdminMembersPage.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/AdminMembersPage.test.tsx):112
- [src/features/admin/members/AdminMembersPage.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/src/features/admin/members/AdminMembersPage.test.tsx):129

## SQL / 문서 사용처

### `supabase/sql`

현재 `supabase/sql` 디렉터리에는 `report_required` 문자열이 존재하지 않는다.

확인 대상:

- `supabase/sql/000_initial_ops_schema.sql`
- `supabase/sql/007_drop_members_account_num.sql`
- `supabase/sql/008_drop_members_report_required.sql`
- `supabase/sql/009_public_health_check.sql`

### 문서

- [docs/php-analysis/erd.md](/Users/gio.a/Documents/workspace/next/my-works/docs/php-analysis/erd.md):33
- [docs/transition/auth-members-lifecycle-2026-03-26.md](/Users/gio.a/Documents/workspace/next/my-works/docs/transition/auth-members-lifecycle-2026-03-26.md):114
- [docs/bak/interim-react-work-plan.md](/Users/gio.a/Documents/workspace/next/my-works/docs/bak/interim-react-work-plan.md):150
- [docs/bak/interim-react-migration-review.md](/Users/gio.a/Documents/workspace/next/my-works/docs/bak/interim-react-migration-review.md):114

### 참고 덤프

- [db_a11yop_2507071945.sql](/Users/gio.a/Documents/workspace/next/my-works/db_a11yop_2507071945.sql):331
  - `report_required` 컬럼 존재

## 결론

현재 워크트리 기준으로 `report_required`는 아래처럼 충돌 상태다.

- 앱 / 관리자 화면 / 테스트 / 문서에는 남아 있음
- `supabase/sql` 기준 스키마에는 없음

따라서 이후 작업은 아래 둘 중 하나를 먼저 확정해야 한다.

1. `report_required`를 다시 스키마 기준으로 복구하고 앱/문서를 유지
2. 앱/관리화면/테스트/문서에서 `report_required` 의존 코드를 제거
