# 원본 대비 `my-works` 전수 대조 감사

작성일: 2026-03-24
대상 결과물: `/Users/gio.a/Documents/workspace/next/my-works`

## 1. 대조 기준

이번 감사의 원본 기준은 아래 2축이다.

1. 1차 사용자 기능 원본
   - `/Users/gio.a/Documents/workspace/next/php-operation_tool`
   - 기준 문서:
     - `docs/transition/interim-react-migration-review.md`
     - `docs/transition/interim-react-work-plan.md`
     - `docs/php-analysis/*`
2. 2차 관리자 기능 원본
   - `/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage`
   - 기준 문서:
     - `docs/transition/phase2-admin-review.md`
     - `docs/admin-analysis/*`

즉, 이번 검토는 `my-works` Git diff가 아니라 `php-operation_tool + linkagelab-a11y-workmanage -> my-works` 교차 대조다.

## 2. 전수 대조 파일 범위

전체 파일 수:

- `php-operation_tool`: 212개
- `linkagelab-a11y-workmanage`: 133개
- `my-works`: 94개

애플리케이션 동작과 직접 연결된 소스 파일 전수 카운트:

- `php-operation_tool`
  - `webapp/pages/*.php`: 15개
  - `webapp/dbcon/*.php`: 69개
  - `webapp/login/*.php`: 4개
  - `webapp/js/*.js`: 27개
- `linkagelab-a11y-workmanage`
  - `front/src` 내 `.js/.vue`: 70개
  - `server/*.js`: 13개
- `my-works`
  - `apps/ops-web/src/features/*.{ts,tsx}`: 26개
  - `apps/ops-web/src/lib/*`, `apps/ops-web/src/app/*`: 7개
  - `supabase/*.{sql,ts}`: 2개

범위 제외로 문서에 명시된 항목:

- `추천 모니터링`
- `앱 운영정보`
- `알림`, `manager_*`
- 2차 기준의 `Type master CRUD`, `Service master CRUD`, `아지트 QA알리미`, `비활성 프로젝트 관리 UI`

즉, 이번 감사는 위 제외 항목을 따로 표시하되, 나머지 페이지/기능은 전부 대조 대상으로 본다.

## 3. 1차 사용자 기능 대조표

| 원본 | 현재 매핑 | 판정 | 확인 결과 |
| --- | --- | --- | --- |
| 로그인/로그아웃 | `features/auth/*`, `app/AppRouter.tsx`, `app/AppShell.tsx` | 부분 | 로그인/로그아웃 흐름은 있으나, 앱 전역 React Query 공급자가 빠져 로그인 후 주요 화면이 런타임에서 깨질 수 있음. 멤버 활성 컬럼도 잘못 읽고 있어 비활성 사용자 차단이 정확하지 않음. |
| 사용자 권한 구분 | `AuthContext.tsx`, `AppRouter.tsx` | 부분 | 일반/관리자 분기와 `/admin/*` 보호는 존재. 다만 `members.user_active`가 아니라 `is_active`를 읽어 권한/활성 판정이 오염됨. |
| 업무보고 등록/수정/삭제/조회 | `features/reports/*`, `lib/data-client.ts` | 부분 | 기본 CRUD는 있음. 그러나 원본의 동적 입력 폼이 빠졌고, 현재 코드는 모든 업무에 `projectId`, `pageId`를 강제한다. 서비스 직접입력형/프로젝트형 분기가 사라졌고, 오늘 누적시간/미입력시간/오버헤드 보조도 없음. |
| 프로젝트 등록/수정/조회 | `features/projects/ProjectsFeature.tsx`, `lib/data-client.ts` | 부분 | 프로젝트/페이지 조회 및 저장은 있음. 다만 원본의 반기/검색 필터, 프로젝트 수정 시 과거 업무 동기화 계약, 페이지 삭제 흐름은 현재 구현에서 확인되지 않음. |
| 프로젝트 페이지 등록/수정/조회 | `features/projects/ProjectsFeature.tsx`, `lib/data-client.ts` | 부분 | 페이지 추가/수정은 있음. 삭제와 레거시 텍스트 이력 동기화는 없음. |
| 트래킹 관리 | `features/tracking/TrackingFeature.tsx`, `lib/domain.ts`, `000001_initial_ops_schema.sql` | 부분 | 현재는 상태/담당자/플래그/비고만 유지. 원본의 아지트공유일/URL, 1차~4차 점검일, Highest/High/Normal, 보고일수 컬럼이 전부 사라짐. |
| 개인 검색/다운로드 | `features/search/search-page.tsx` | 부분 | 기간 검색은 있음. 원본과 후속 운영툴 모두 지원하던 다운로드가 없음. 어제/오늘 빠른 선택도 없음. |
| 대시보드 | `features/dashboard/DashboardPage.tsx` | 부분 | 진행중 모니터링/QA 요약은 있음. `추천 모니터링`은 문서상 제외 범위라 미반영은 범위상 허용. |
| QA 통계 | `features/stats/QaStatsPage.tsx` | 부분 | 핵심 리스트는 있음. 원본 차트/요약 구조보다 단순화됨. |
| 모니터링 통계 | `features/stats/MonitoringStatsPage.tsx` | 부분 | 핵심 리스트는 있음. 원본 차트/요약/상세 필드보다 단순화됨. |
| 비밀번호 변경 | `features/settings/UserProfilePage.tsx` | 구현 | 비밀번호 변경 기본 흐름은 있음. |

## 4. 2차 관리자 기능 대조표

2차 필수/재해석 기준은 `docs/transition/phase2-admin-review.md`를 따른다.

| 원본 | 현재 매핑 | 판정 | 확인 결과 |
| --- | --- | --- | --- |
| 전체 업무보고 검색 | `features/admin/reports/AdminReportsPage.tsx`, `admin-client.ts`, `export-tasks/index.ts` | 부분 | 검색/목록/수정/삭제/CSV 내보내기는 있음. 그러나 원본의 서비스명 필터, 사용자 다중 선택, 신규 행 추가는 없음. |
| 멤버 관리/신규 멤버 생성 | `features/admin/members/AdminMembersPage.tsx`, `admin-client.ts` | 부분 | 목록/생성/수정/활성/비활성은 있음. 비밀번호 초기화가 없음. 원본에는 `/member/:userId/password`가 실제 라우트로 존재함. |
| Type validation | 해당 없음 | 누락 | 2차 재해석 필수 범위인 orphan type 검출, 대상 row 조회, 일괄 치환 UI/라우트/RPC가 없음. |
| Service validation | 해당 없음 | 누락 | 2차 재해석 필수 범위인 orphan svc 검출, 대상 row 조회, 일괄 치환 UI/라우트/RPC가 없음. |
| 리소스 집계 | 해당 없음 | 조건부 미구현 | 후속 운영툴에는 `/resource/*` 라우트와 API가 있으나, 현재 `my-works`에는 대응 화면이 없음. 문서상 조건부 범위라 즉시 결함으로 단정하지는 않음. |
| 앱 운영정보 | 해당 없음 | 범위 제외 | `my-works/STATUS.md`에서 제외 범위로 명시됨. |
| 아지트 QA알리미 | 해당 없음 | 범위 제외 | `phase2-admin-review.md`에서 제외로 명시됨. |
| 비활성 프로젝트 관리 UI | 해당 없음 | 범위 제외 | `phase2-admin-review.md`에서 제외로 명시됨. |

## 5. 확정 결함 및 미반영 항목

### P0

1. `QueryClientProvider` 제거로 주요 화면 런타임 실패 가능
   - 1차 기준 `AppRouter.tsx`에는 `QueryClientProvider`가 있었고, 현재 버전에서는 사라졌다.
   - 현재 `DashboardPage`, `ReportsPage`, `ProjectsFeature`, `TrackingFeature`, `SearchPage`, `QaStatsPage`, `MonitoringStatsPage`, `AdminReportsPage`, `AdminMembersPage`가 모두 `useQuery`/`useMutation`를 사용한다.
   - 결과적으로 로그인 후 핵심 화면 전체가 런타임 오류로 깨질 수 있다.

2. 멤버 활성 컬럼 계약 불일치
   - 스키마 원본: `members.user_active`
   - 현재 사용자 앱 매핑: `lib/data-client.ts`는 `record.is_active`를 읽음
   - 현재 관리자 SQL/엣지 함수도 `is_active` 기준으로 작성됨
   - 영향:
     - 비활성 사용자 차단 오동작
     - 관리자 사용자 목록/활성 상태 오동작
     - export 관리자 권한 판정 오동작

### P1

3. 업무보고 입력 계약 축소
   - 원본 업무보고는 타입에 따라 프로젝트 검색형과 서비스 직접입력형이 갈린다.
   - 현재 `use-reports-slice.ts`는 모든 저장에 `projectId`, `pageId`를 강제한다.
   - 결과:
     - 서비스 직접입력형 업무를 현재 구조로는 입력할 수 없음
     - 원본 `report.php`의 핵심 입력 분기 로직이 반영되지 않음

4. 업무보고 타입 값이 DB 기준이 아니라 하드코딩
   - 원본은 `type_type1.php`, `type_type2.php`를 통해 동적으로 타입을 불러온다.
   - 현재 `report-domain.ts`는 `REPORT_TYPE1_OPTIONS`, `REPORT_TYPE2_OPTIONS`를 하드코딩한다.
   - 결과:
     - DB 기준 타입 변경이 사용자 화면에 반영되지 않음
     - `task_types` 테이블을 두고도 입력 화면은 별도 상수에 의존

5. 개인 검색 다운로드 누락
   - 원본 `report_personal.php`와 후속 운영툴 `ReportSearch.vue` 모두 다운로드를 제공한다.
   - 현재 `search-page.tsx`는 조회만 있고 다운로드가 없다.

6. 트래킹 데이터가 원본 대비 과소 이관
   - 원본 `PJ_PAGE_TBL`과 `track.php`는 아래 필드를 핵심으로 사용한다.
     - 아지트공유일 / 아지트URL
     - 1차~4차 점검일
     - Highest / High / Normal 수정 수
     - 보고일수
   - 현재 `project_pages` 스키마와 `TrackingFeature.tsx`는 위 필드를 전부 갖고 있지 않다.
   - 결과:
     - 현재 화면은 레거시 `트래킹 관리`의 일부만 재현한 상태다.

7. Type validation / Service validation 완전 누락
   - 후속 운영툴 서버에는 `admin/valid/type`, `admin/valid/svc`, `search/valid` API가 존재한다.
   - `phase2-admin-review.md`는 이를 2차 필수 범위로 재정의했다.
   - 현재 `my-works`에는 라우트, 화면, RPC 어느 쪽도 없다.

8. 관리자 멤버 관리에서 비밀번호 초기화 누락
   - 원본 서버 라우트: `PUT /api/v1/member/:userId/password`
   - 2차 검토 문서도 `비밀번호 초기화`를 사용자 관리 필수 기능으로 명시한다.
   - 현재 `AdminMembersPage.tsx`와 `admin-client.ts`에는 해당 기능이 없다.

9. 관리자 타입 조회 필드가 스키마와 맞지 않음
   - 스키마 `task_types`는 `type1`, `type2`, `display_label` 구조다.
   - 현재 `admin-client.ts`는 `select("id, name, display_order, is_active, requires_service_group")`를 조회한다.
   - 현재 `AdminReportsPage.tsx`도 `type.name`을 기준으로 필터/옵션을 만든다.
   - 결과:
     - 관리자 검색 필터와 편집기에서 타입 옵션이 깨질 가능성이 높다.

### P2

10. 관리자 전체 검색 필터가 원본보다 축소
   - 원본 `/search`는 서비스명 필터, 사용자 다중 선택, 신규 행 추가를 가진다.
   - 현재 `AdminReportsPage.tsx`는 서비스그룹까지만 있고 서비스명 필터가 없다.
   - 사용자 선택도 단일 선택이다.

11. 2차 SQL 추가가 현재 사용자 지시와 충돌
   - 현재 저장소에는 `supabase/migrations/20260324_000002_admin_phase2.sql`이 추가되어 있다.
   - 사용자가 현재 phase2에서 SQL 수정이 필요 없다고 명시한 조건과 충돌한다.
   - 따라서 이 파일은 기능 완성도와 별개로 사용자 지시 위반 여부를 다시 판단해야 한다.

## 6. 원본 페이지별 최종 판정

### 1차 원본(`php-operation_tool`)

- `login.php` / `clear.php` / `user_check.php`: 부분
- `dashboard.php`: 부분
- `report.php`: 부분
- `project.php`: 부분
- `track.php`: 부분
- `report_personal.php`: 부분
- `stati_qa.php`: 부분
- `stati_mo.php`: 부분
- `userset.php`: 구현
- `allreport.php`: 2차 관리자 기능으로 부분
- `members.php`: 2차 관리자 기능으로 부분
- `new_member.php`: 2차 관리자 기능으로 부분
- `type.php`: 누락
- `service_group.php`: 누락
- `appinfo.php`: 범위 제외
- `test.php`: 판단 대상 아님

### 2차 관리자 원본(`linkagelab-a11y-workmanage`)

- `/search`: 부분
- `/admin/member`: 부분
- `/admin/type`: 누락
- `/admin/group`: 누락
- `/resource/summary`: 조건부 미구현
- `/resource/month`: 조건부 미구현
- `/resource/type`: 조건부 미구현
- `/resource/svc`: 조건부 미구현
- `/admin/agitnoti`: 범위 제외
- `/profile`: 별도 동일 이관 범위 아님

## 7. 결론

현재 `my-works`는 다음 상태로 판단한다.

1. 1차 사용자 화면은 `기본 뼈대 + 일부 핵심 기능`까지는 올라와 있으나, 업무보고 입력 계약과 트래킹 데이터가 원본 대비 축소되어 있어 `동일 이관 완료`라고 볼 수 없다.
2. 2차 관리자 화면은 `전체 업무검색`, `사용자 관리` 일부만 들어와 있고, 문서상 필수 재해석 범위인 `Type validation`, `Service validation`, `비밀번호 초기화`가 빠져 있다.
3. 코드 정합성 측면에서는 `QueryClientProvider` 제거, `user_active`/`is_active` 불일치, `task_types.name` 조회 오판이 즉시 수정되어야 하는 결함이다.

즉, 현재 상태는 `1차/2차 일부 반영`이지, `원본 대비 전수 이관 완료`가 아니다.
