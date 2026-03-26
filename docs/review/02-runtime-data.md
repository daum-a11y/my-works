# 런타임 / 데이터 무결성 리뷰

현재 브랜치 기준 상태:
- 해결됨: 비관리자 주요 화면의 `members`/`project_pages` 조회가 RLS와 충돌하던 문제
- 해결됨: KST 기준 날짜가 하루씩 밀리던 로직
- 해결됨: 비활성 프로젝트에 연결된 과거 보고가 검색/수정 화면에서 깨지던 문제
- 해결됨: 보고 저장 중 더블클릭으로 중복 제출되던 문제
- 해결됨: 프로젝트 변경 시 페이지가 첫 항목으로 자동 치환되던 문제
- 해결됨: 잘못된 시간 입력이 `0`으로 저장되던 문제
- 해결됨: 업무 유형 마스터와 무관한 fallback 조합이 저장되던 문제
- 해결됨: QA 진행중 판정이 종료일 당일 오전에 false가 되던 문제

주의:
- `members_public_view`, `project_pages_public_view`, `bind_auth_session_member` 같은 SQL 경로는 현재 초기 migration에 포함돼 있습니다.

## 1. 해결됨: `P1` 비관리자 사용자가 주요 화면에서 즉시 실패할 가능성

근거:
- `my-works/src/lib/data-client.ts`
- `my-works/src/features/auth/AuthContext.tsx`
- `my-works/supabase/migrations/20260324_000001_initial_ops_schema.sql`

조치:
- 일반 화면은 `members_public_view`, `project_pages_public_view`를 사용하도록 바꿨습니다.
- 로그인 시 `bind_auth_session_member` RPC로 `auth_user_id`를 최초 바인딩하도록 추가했습니다.

## 2. 해결됨: `P1` KST 기준 날짜가 하루씩 밀리던 로직

근거:
- `my-works/src/lib/utils.ts`
- `my-works/src/features/dashboard/DashboardPage.tsx`
- `my-works/src/features/admin/admin-types.ts`
- `my-works/src/features/admin/reports/AdminReportsPage.tsx`
- `my-works/src/features/stats/QaStatsPage.tsx`

조치:
- 날짜 전용 값은 `toLocalDateInputValue()`, `parseLocalDateInput()` 기준으로 통일했습니다.
- `toISOString().slice(0, 10)` 기반 기본값과 비교 로직을 제거했습니다.

## 3. 해결됨: `P1` 비활성 프로젝트에 연결된 과거 보고가 검색/수정 화면에서 깨지던 문제

근거:
- `my-works/src/lib/data-client.ts`
- `my-works/src/features/reports/use-reports-slice.ts`
- `my-works/src/features/search/search-page.tsx`

조치:
- `getProjects()`가 활성 프로젝트만이 아니라 전체 프로젝트를 읽도록 바꿨습니다.
- 과거 보고가 참조하는 프로젝트/페이지 이름이 유지되도록 했습니다.

## 4. 해결됨: `P1` 신규 보고 중복 제출 방어 부재

근거:
- `my-works/src/features/reports/use-reports-slice.ts`
- `my-works/src/features/reports/reports-page.tsx`
- `my-works/src/features/search/search-page.tsx`
- `my-works/src/features/admin/reports/AdminReportsPage.tsx`

조치:
- 저장 mutation pending 중에는 다시 저장하지 않도록 가드를 추가했습니다.
- 저장 버튼을 pending 동안 비활성화했습니다.

## 5. 해결됨: `P2` 프로젝트 변경 시 페이지가 자동으로 첫 항목으로 바뀌던 문제

근거:
- `my-works/src/features/reports/use-reports-slice.ts`
- `my-works/src/features/search/search-page.tsx`
- `my-works/src/features/admin/reports/AdminReportsPage.tsx`

조치:
- 프로젝트가 바뀌면 페이지 선택은 빈 값으로 초기화하고, 사용자가 다시 명시적으로 고르게 바꿨습니다.

## 6. 해결됨: `P2` 잘못된 시간 입력이 조용히 `0시간`으로 저장되던 문제

근거:
- `my-works/src/features/reports/report-domain.ts`
- `my-works/src/features/reports/use-reports-slice.ts`
- `my-works/src/features/search/search-page.tsx`
- `my-works/src/features/admin/reports/AdminReportsPage.tsx`

조치:
- `parseReportHoursInput()` 검증을 추가했습니다.
- 빈 값, 잘못된 문자열, 음수 입력은 저장을 막고 에러로 처리합니다.

## 7. 해결됨: `P2` 업무 유형 마스터가 비어도 fallback 값으로 저장 가능하던 문제

근거:
- `my-works/src/features/reports/report-domain.ts`
- `my-works/src/features/reports/use-reports-slice.ts`
- `my-works/src/features/search/search-page.tsx`

조치:
- 저장 직전에 `validateTaskTypeSelection()`으로 현재 마스터 조합을 다시 검증하도록 추가했습니다.

## 8. 해결됨: `P2` QA 진행중 판정이 종료일 당일 오전에 false가 되던 문제

근거:
- `my-works/src/features/stats/QaStatsPage.tsx`

조치:
- `startDate`, `endDate` 비교를 로컬 날짜 파서 기준으로 맞췄습니다.
