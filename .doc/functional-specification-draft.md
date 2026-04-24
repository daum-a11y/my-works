# My Works 기능명세서

## 1. 작성 기준

### 1.1 목적

My Works React 서비스의 모든 화면과 기능을 개발자, QA, 운영자가 같은 기준으로 이해할 수 있도록 기능 단위로 정의한다. 이 문서는 페이지 성향을 요약하는 문서가 아니라, 각 화면에서 제공하는 세부 기능과 그 동작, 입력/검증, 결과, 예외, 코드 근거를 정리한 기능명세서다.

### 1.2 참고한 기능명세서 형식

- 참고 자료: Velog, “프론트 개발자의 기능명세서 작성하는 법”
- 적용 기준: 화면, 세부 페이지, epic, 기능, 부가 설명, 구현 여부, 디자인 여부를 먼저 확정하고, 각 기능이 팀원이 이해할 수 있을 만큼 세부적으로 작성되어야 한다는 기준을 적용했다.
- 본 문서의 표 컬럼: 화면, 세부 페이지, Epic, 기능 ID, 기능, 상세 스펙, 입력/검증, 출력/상태, 코드 근거, 구현 여부, 디자인 여부, QA 기준.

### 1.3 코드 기준

- 기준 브랜치: `feat/uiux`
- 라우트 기준: `src/router/RootRouter.tsx`
- 내비게이션 기준: `src/router/navigation.ts`
- 페이지 기준: `src/pages/**`
- 인증 기준: `src/auth/**`
- API 기준: `src/api/**`
- 도메인 타입 기준: `src/types/domain.ts`

### 1.4 공통 권한 정책

| 권한/상태 | 접근 가능 범위 | 제한 동작 |
| --- | --- | --- |
| Guest | `/login`, `/forgot-password`, `/auth/recovery`, `/healthz` | 보호 라우트 접근 시 `/login`으로 이동 |
| Pending member | `/pending-approval` | 업무 화면 접근 시 승인 대기 화면으로 이동 |
| Active user | 대시보드, 업무보고, 내 업무 내역, 프로젝트, 프로젝트/태스크 통계, 프로필, 설정 | 관리자/리소스/조직 관리 라우트 접근 시 `/dashboard`로 이동 |
| Admin | 전체 사용자 기능 + 조직/리소스/관리자 화면 | 없음 |

## 2. 기능명세서 요약표

| 화면 | 세부 페이지 | Epic | 기능 ID | 기능 | 상세 스펙 | 입력/검증 | 출력/상태 | 코드 근거 | 구현 여부 | 디자인 여부 | QA 기준 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 인증 | 로그인 `/login` | 계정 인증 | AUTH-LOGIN-001 | 이메일/비밀번호 로그인 | 사용자가 이메일과 비밀번호를 입력해 Supabase 인증 세션을 생성한다. 인증 성공 후 회원 상태를 조회해 active면 대시보드, pending이면 승인 대기 화면으로 이동한다. | 이메일 필수, 이메일 trim/lowercase, 비밀번호 필수. 누락 시 제출 차단. | 성공: `/dashboard` 또는 `/pending-approval`. 실패: 로그인 오류 메시지. 로딩 중 버튼 비활성. | `src/pages/auth/LoginPage.tsx`, `src/auth/AuthContext.tsx` | 구현됨 | 구현됨 | 빈 이메일, 빈 비밀번호, 잘못된 비밀번호, active 계정, pending 계정 확인 |
| 인증 | 로그인 `/login` | 계정 인증 | AUTH-LOGIN-002 | 로그인 상태 리다이렉트 | 이미 인증된 사용자가 로그인 URL에 접근하면 로그인 폼을 보여주지 않고 상태별 목적지로 보낸다. recovery 세션은 비밀번호 재설정 화면으로 보낸다. | 세션 상태, recovery flow 여부. | active: `/dashboard`, pending: `/pending-approval`, recovery: `/auth/recovery`. | `src/router/RootRouter.tsx`, `src/auth/AuthContext.tsx` | 구현됨 | 해당 없음 | 로그인 상태에서 `/login` 직접 접근 결과 확인 |
| 인증 | 비밀번호 찾기 `/forgot-password` | 계정 복구 | AUTH-PW-001 | 재설정 메일 요청 | 이메일을 입력받아 Supabase 비밀번호 재설정 메일을 발송한다. 발송 시 recovery redirect URL을 사용한다. | 이메일 필수, trim/lowercase. | 성공 안내 표시. 실패 시 Supabase 오류 또는 환경 설정 오류 표시. | `src/pages/auth/ForgotPasswordPage.tsx`, `src/auth/AuthContext.tsx` | 구현됨 | 구현됨 | 빈 이메일, 정상 이메일, API 실패, 성공 안내 확인 |
| 인증 | 비밀번호 재설정 `/auth/recovery` | 계정 복구 | AUTH-PW-002 | 새 비밀번호 저장 | recovery 세션 사용자가 새 비밀번호를 입력해 Supabase 사용자 비밀번호를 변경한다. | 새 비밀번호 필수, 확인값 필수, 8자 이상, 두 값 일치. | 성공 시 로그인 화면으로 이동/안내. 실패 시 validation 또는 Supabase 오류. | `src/pages/auth/PasswordRecoveryPage.tsx`, `src/auth/AuthContext.tsx` | 구현됨 | 구현됨 | 7자 이하, 불일치, 정상 변경, 만료 링크 상태 확인 |
| 인증 | 승인 대기 `/pending-approval` | 계정 승인 | AUTH-PENDING-001 | 승인 대기 안내 | pending 회원이 업무 화면을 사용할 수 없음을 안내하고, 로그아웃 또는 로그인 복귀 흐름을 제공한다. | 인증 상태와 member status 확인. | pending이면 안내 화면. guest는 `/login`, active는 `/dashboard`. | `src/router/RootRouter.tsx`, `src/pages/auth/PendingApprovalPage.tsx` | 구현됨 | 구현됨 | guest/pending/active 상태별 접근 확인 |
| 공통 | 보호 라우트 | 권한/라우팅 | ROUTE-GUARD-001 | 보호 라우트 인증 가드 | `/dashboard` 이하 업무 화면 진입 전 인증 상태를 확인한다. 비로그인은 로그인으로, pending은 승인 대기로 보낸다. | `status`, `session.member.status`. | 로딩 spinner, login redirect, pending redirect, 정상 layout. | `src/router/RootRouter.tsx`, `src/layouts/AppLayout.tsx` | 구현됨 | 구현됨 | 보호 URL 직접 접근 시 상태별 이동 확인 |
| 공통 | 관리자 라우트 | 권한/라우팅 | ROUTE-ADMIN-001 | 관리자 권한 가드 | 조직/리소스/관리자 화면은 admin만 접근 가능하다. 일반 사용자는 대시보드로 이동한다. | `session.member.role === 'admin'`. | admin은 화면 표시, user는 `/dashboard`, guest는 `/login`. | `src/router/RootRouter.tsx` | 구현됨 | 해당 없음 | user가 `/admin/members` 직접 접근 시 차단 확인 |
| 공통 | 앱 레이아웃 | 내비게이션 | SHELL-NAV-001 | 메뉴 표시 | baseNavigation과 adminNavigation을 기준으로 좌측/상단 메뉴를 표시한다. admin 메뉴는 admin에게만 노출된다. | 현재 사용자 권한, pathname. | 현재 메뉴 active, 권한별 메뉴 표시. | `src/router/navigation.ts`, `src/layouts/AppLayout.tsx` | 구현됨 | 구현됨 | admin/user 메뉴 차이 확인 |
| 공통 | 앱 레이아웃 | 내비게이션 | SHELL-BREAD-001 | 브레드크럼 생성 | 현재 pathname을 navigation 정의와 비교해 홈/그룹/세부 메뉴 브레드크럼을 생성한다. | pathname. | 현재 경로에 맞는 breadcrumb. 매칭 실패 시 홈만 표시. | `src/router/navigation.ts` | 구현됨 | 구현됨 | 주요 메뉴별 breadcrumb 라벨 확인 |
| 대시보드 | `/dashboard` | 업무 현황 | DASH-001 | 진행 프로젝트 조회 | 오늘 기준 진행 중인 프로젝트를 조회하고 종료일/상태 기준으로 목록화한다. | 로그인 사용자, dashboard query. | 진행 프로젝트 표, 빈 상태, 로딩, 오류. | `src/pages/dashboard/DashboardPage.tsx`, `src/pages/dashboard/DashboardProjectsTable.tsx`, `src/api/stats` | 구현됨 | 구현됨 | 진행/종료/예정 프로젝트 샘플 표시 확인 |
| 대시보드 | `/dashboard` | 업무 현황 | DASH-002 | 업무 작성 캘린더 | 선택 월의 일자별 업무 작성 여부와 업무 시간을 캘린더에 표시한다. 월 이동이 가능하다. | 기준 월, 사용자 ID. | 캘린더, 작성/미작성 상태, 월 이동 상태. | `src/pages/dashboard/DashboardCalendarSection.tsx`, `src/pages/dashboard/dashboardApiTransform.ts` | 구현됨 | 구현됨 | 월 이동, 업무 있는 날/없는 날 표시 확인 |
| 업무보고 | `/person/report` | 업무보고 | REPORT-001 | 최근 업무보고 조회 | 사용자의 업무보고 목록을 조회해 최신순으로 표시한다. 프로젝트, 페이지, 타입, 시간, 내용이 함께 표시된다. | 세션 사용자, 조회 query. | 목록/빈 상태/로딩/오류. | `src/pages/reports/ReportsPage.tsx`, `src/pages/reports/useReportsSlice.ts` | 구현됨 | 구현됨 | 업무 없음/있음, 정렬, 컬럼 표시 확인 |
| 업무보고 | `/person/report` | 업무보고 | REPORT-002 | 업무 등록 | 날짜, 업무 타입, 프로젝트/페이지, 소요시간, 내용, 비고를 입력해 새 업무를 저장한다. 저장 후 목록과 관련 dashboard/search query를 갱신한다. | 날짜 필수, 타입 필수, 소요시간 0 이상 정수, 프로젝트/페이지 연결 검증, 내용 기본값 보정. | 성공 메시지, 목록 갱신, 폼 초기화. 실패 시 validation/API 오류. | `src/pages/reports/ReportsEditorForm.tsx`, `src/pages/reports/useReportsSlice.ts`, `src/api/reports` | 구현됨 | 구현됨 | 정상 등록, 필수값 누락, 시간 오류, API 실패 확인 |
| 업무보고 | `/person/report` | 업무보고 | REPORT-003 | 업무 수정 | 기존 업무를 선택하면 폼에 값을 로드하고 수정 저장한다. 저장 후 목록과 통계 query를 갱신한다. | 업무 ID, 등록과 동일한 validation. | 성공 메시지, 수정값 반영, 편집 상태 해제. | `src/pages/reports/ReportsEditorForm.tsx`, `src/pages/reports/useReportsSlice.ts` | 구현됨 | 구현됨 | 기존값 로딩, 일부 수정, 취소, 저장 실패 확인 |
| 업무보고 | `/person/report` | 업무보고 | REPORT-004 | 업무 삭제 | 선택한 업무를 삭제하고 목록/통계 캐시를 갱신한다. | 업무 ID, 삭제 권한. | 삭제 성공 메시지, 목록 제거, 합계 갱신. 실패 시 오류. | `src/pages/reports/ReportsResultsTable.tsx`, `src/pages/reports/useReportsSlice.ts` | 구현됨 | 구현됨 | 삭제/취소/삭제 실패 확인 |
| 업무보고 | `/person/report` | 업무보고 | REPORT-005 | 업무 타입 선택 | 업무 타입1 선택 시 타입2 후보를 필터링하고, 타입 정책에 따라 서비스/프로젝트 입력 필요 여부를 결정한다. | 타입1/타입2 기준정보, 활성 여부. | 타입2 옵션 갱신, 종속 필드 표시/검증. | `src/pages/reports/ReportsEditorForm.tsx`, `src/utils/taskType.ts` | 구현됨 | 구현됨 | 타입1 변경 시 타입2 초기화, 비활성 타입 제외 확인 |
| 업무보고 | `/person/report` | 업무보고 | REPORT-006 | 프로젝트/페이지 선택 | 프로젝트 선택 후 해당 프로젝트의 하위 페이지 후보를 표시한다. 프로젝트와 페이지 관계가 맞지 않으면 저장을 차단한다. | 프로젝트 ID, 페이지 ID, 프로젝트-페이지 매핑. | 페이지 옵션 갱신, 연결 오류 표시. | `src/pages/reports/ReportsEditorForm.tsx`, `src/api/projects` | 구현됨 | 구현됨 | 프로젝트 변경 시 페이지 후보 변경 확인 |
| 업무보고 | `/person/report` | 업무보고 | REPORT-007 | 오버헤드 자동 등록 | 특정 조건의 업무 입력 시 오버헤드성 업무를 자동 생성하거나 관련 메타를 함께 저장한다. | 업무 타입/시간/날짜 조건. | 자동 생성/메타 반영, 목록 갱신. | `src/pages/reports/useReportsSlice.ts`, `src/pages/reports/reportUtils.ts` | 구현됨 | 구현됨 | 조건 충족/불충족 시 자동 처리 차이 확인 |
| 업무보고 | `/person/report` | 업무보고 | REPORT-008 | 기간 조회/탭 전환 | 선택 기간과 탭 기준으로 업무 목록을 필터링한다. 날짜 네비게이터로 조회 범위를 변경한다. | 시작일/종료일, 탭 값. | 목록 갱신, 빈 상태, 로딩. | `src/pages/reports/ReportsDateNavigator.tsx`, `src/pages/reports/ReportsPage.tsx` | 구현됨 | 구현됨 | 기간 변경, 탭 전환, 빈 결과 확인 |
| 내 업무 내역 | `/person/search` | 업무 검색 | SEARCH-001 | 기간·검색어 조회 | 사용자의 업무 이력을 기간과 검색어 조건으로 조회한다. | 시작일, 종료일, 검색어, 페이지. 날짜 범위 유효성. | 결과 표, 페이지네이션, 빈 상태, 오류. | `src/pages/search/SearchPage.tsx`, `src/pages/search/useSearchPage.ts`, `src/api/reports` | 구현됨 | 구현됨 | 검색어/기간/페이지 변경 확인 |
| 내 업무 내역 | `/person/search` | 업무 검색 | SEARCH-002 | 검색 결과 Excel 다운로드 | 현재 검색 조건의 업무 결과를 Excel 파일로 내려받는다. 결과가 없으면 다운로드를 제한한다. | 현재 검색 조건과 결과 목록. | Excel 다운로드, 실패 안내. | `src/pages/search/SearchPage.tsx`, `src/utils/excel.ts` | 구현됨 | 구현됨 | 결과 있음/없음, 파일 컬럼 확인 |
| 프로젝트 | `/projects` | 프로젝트 관리 | PROJECT-LIST-001 | 프로젝트 목록 조회 | 프로젝트명, 기간, 상태 조건으로 프로젝트 목록을 조회한다. 각 프로젝트의 기간, 청구그룹/플랫폼/서비스그룹, 하위 페이지 수를 표시한다. | 필터, 검색어, 정렬. | 목록/빈 상태/로딩/오류. | `src/pages/projects/ProjectsPage.tsx`, `src/pages/projects/useProjectsPage.ts` | 구현됨 | 구현됨 | 필터, 검색, 빈 결과 확인 |
| 프로젝트 | `/projects` | 프로젝트 관리 | PROJECT-LIST-002 | 프로젝트 수정 진입 | 목록 행의 수정 버튼을 누르면 프로젝트 편집 화면으로 이동한다. | 프로젝트 ID. | `/projects/:projectId/edit` 이동. | `src/pages/projects/ProjectsResultsTable.tsx` | 구현됨 | 구현됨 | 행 클릭/수정 버튼 이동 확인 |
| 프로젝트 | `/projects/new`, `/projects/:projectId/edit` | 프로젝트 편집 | PROJECT-EDIT-001 | 프로젝트 저장 | 프로젝트 기본정보와 하위 페이지/태스크를 입력해 신규 생성 또는 수정한다. 저장 후 목록/상세 query를 갱신한다. | 프로젝트명, 기간, 청구그룹, 플랫폼, 서비스그룹, 페이지명, tracking 상태 등 필수값. | 성공 메시지, 편집 화면/목록 이동, validation 오류. | `src/pages/projects/ProjectEditorPage.tsx`, `src/pages/projects/useProjectsPage.ts`, `src/api/projects` | 구현됨 | 구현됨 | 신규 저장, 수정 저장, 필수값 누락, 날짜 오류 확인 |
| 프로젝트 | `/projects/:projectId/edit` | 프로젝트 편집 | PROJECT-EDIT-002 | 프로젝트 삭제 | 기존 프로젝트를 삭제하거나 삭제 가능한 상태로 처리한다. | 프로젝트 ID, 삭제 가능 조건. | 삭제 후 `/projects` 이동, 실패 시 오류. | `src/pages/projects/ProjectEditorPage.tsx`, `src/api/projects` | 구현됨 | 구현됨 | 삭제 성공/실패, 관련 데이터 존재 시 정책 확인 |
| 프로젝트 | 프로젝트 편집 | 페이지/태스크 관리 | PROJECT-PAGE-001 | 페이지 추가 | 프로젝트 하위 페이지 행을 추가하고 이름, URL, 타입, 추적 상태 등을 입력한다. | 페이지명 필수, URL 형식/중복 정책 확인. | 행 추가, 저장 시 신규 페이지 생성. | `src/pages/projects/ProjectEditorPage.tsx`, `src/pages/projects/ProjectEditorActionRow.tsx` | 구현됨 | 구현됨 | 행 추가, 필수값 누락, 저장 반영 확인 |
| 프로젝트 | 프로젝트 편집 | 페이지/태스크 관리 | PROJECT-PAGE-002 | 페이지 수정 | 기존 페이지 정보를 수정하고 저장한다. | 페이지 ID, 수정 필드. | 수정값 반영, 통계/모니터링 화면 반영. | `src/pages/projects/ProjectEditorPage.tsx`, `src/api/projects` | 구현됨 | 구현됨 | 페이지명/상태 변경 후 목록 반영 확인 |
| 프로젝트 | 프로젝트 편집 | 페이지/태스크 관리 | PROJECT-PAGE-003 | 페이지 삭제 | 프로젝트 하위 페이지를 삭제한다. 연결된 업무가 있으면 정책상 차단 또는 예외 처리한다. | 페이지 ID, 연결 업무 존재 여부. | 삭제 성공/실패 메시지, 행 제거. | `src/pages/projects/ProjectEditorPage.tsx`, `src/api/projects` | 구현됨 | 구현됨 | 연결 업무 있음/없음 삭제 결과 확인 |
| 조직 관리 | `/org/summary` | 업무보고 현황 | ORG-SUMMARY-001 | 월별 사용자 업무 현황 조회 | admin이 월별 사용자별 업무 입력 시간과 부족/초과 상태를 확인한다. | 기준 월, 사용자 목록, 근무일 기준. | 사용자별 요약, 부족 시간, 상세 캘린더. | `src/pages/resource/ResourceSummaryPage.tsx`, `src/api/resources` | 구현됨 | 구현됨 | 월 변경, 사용자 필터, 부족 시간 계산 확인 |
| 조직 관리 | `/org/search` | 업무보고 관리 | ADMIN-REPORT-001 | 전체 업무보고 검색 | admin이 전체 사용자의 업무보고를 기간, 사용자, 검색어 조건으로 조회한다. | 기간, 사용자 다중 선택, 검색어, 정렬. | 결과 표, 빈 상태, 페이지네이션. | `src/pages/admin/reports/AdminReportsPage.tsx`, `src/api/admin` | 구현됨 | 구현됨 | 사용자 필터, 기간, 검색어, 빈 결과 확인 |
| 조직 관리 | `/org/search` | 업무보고 관리 | ADMIN-REPORT-002 | 검색 결과 정렬 | 업무보고 결과를 날짜, 사용자, 프로젝트, 시간 등 컬럼 기준으로 정렬한다. | 정렬 컬럼, 정렬 방향. | 표 순서 변경. | `src/pages/admin/reports/AdminReportsPage.tsx` | 구현됨 | 구현됨 | 각 컬럼 정렬 토글 확인 |
| 조직 관리 | `/org/search` | 업무보고 관리 | ADMIN-REPORT-003 | Excel 다운로드 | 현재 검색 조건의 전체 업무보고를 Excel로 다운로드한다. | 현재 필터 조건, 결과 목록. | Excel 파일 다운로드. | `src/pages/admin/reports/AdminReportsPage.tsx`, `src/utils/excel.ts` | 구현됨 | 구현됨 | 필터 적용 상태 다운로드 파일 확인 |
| 조직 관리 | `/org/search` | 업무보고 관리 | ADMIN-REPORT-004 | 업무보고 삭제 | admin이 특정 업무보고를 삭제한다. | task ID, admin 권한. | 삭제 후 목록 갱신, 실패 오류. | `src/pages/admin/reports/AdminReportsPage.tsx`, `src/api/admin` | 구현됨 | 구현됨 | 삭제 성공/실패, 일반 사용자 접근 차단 확인 |
| 조직 관리 | `/org/search/new`, `/org/search/:taskId/edit` | 업무보고 편집 | ADMIN-REPORT-EDIT-001 | 업무보고 대리 등록/수정 | admin이 특정 사용자의 업무보고를 신규 등록하거나 기존 업무를 수정한다. | 대상 사용자, 날짜, 타입, 프로젝트/페이지, 시간, 내용. | 저장 후 `/org/search` 또는 이전 검색 조건으로 이동. | `src/pages/admin/reports/AdminReportEditorPage.tsx`, `src/api/admin` | 구현됨 | 구현됨 | 신규/수정, 대상 사용자 변경, 필수값 오류 확인 |
| 리소스 | `/resource/type` | 리소스 집계 | RESOURCE-TYPE-001 | 업무 타입별 연간 집계 | admin이 연도별 업무 타입 MM 집계를 확인한다. | 기준 연도. | 월별/타입별 MM 표, 합계, 빈 상태. | `src/pages/resource/ResourceTypePage.tsx`, `src/pages/resource/ResourceTypeTableSection.tsx`, `src/api/resources` | 구현됨 | 구현됨 | 연도 변경, 합계, 빈 데이터 확인 |
| 리소스 | `/resource/svc` | 리소스 집계 | RESOURCE-SVC-001 | 서비스그룹별 연간 집계 | admin이 서비스그룹/서비스별 MM 집계를 확인한다. | 기준 연도. | 월별/서비스별 MM 표, 합계. | `src/pages/resource/ResourceServicePage.tsx`, `src/pages/resource/ResourceServiceTableSection.tsx` | 구현됨 | 구현됨 | 그룹 접기/펼치기, 합계 확인 |
| 리소스 | `/resource/month`, `/resource/month/:type` | 월간 리포트 | RESOURCE-MONTH-001 | 월간 리포트 조회 | admin이 기준 월의 총 MM, 휴무, 버퍼, 사용자별 초과/부족, 타입/서비스/보고서 탭 데이터를 확인한다. | 기준 월, type route param. | 월간 요약, 표, 차트, 이전/다음 월 이동. | `src/pages/resource/ResourceMonthPage.tsx`, `src/pages/resource/ResourceMonthContextSection.tsx` | 구현됨 | 구현됨 | 월 이동, 탭 이동, route param 확인 |
| 프로젝트 통계 | `/stats/projects` | 프로젝트 통계 | STATS-PROJECT-001 | 프로젝트 통계 조회 | 사용자/관리자가 월 범위 기준 프로젝트 통계를 조회한다. | 시작 월, 종료 월, 프로젝트 조건. | 요약 카드, 상세 테이블, 빈 상태. | `src/pages/stats/ProjectStatsPage.tsx`, `src/pages/stats/ProjectStatsSummarySection.tsx` | 구현됨 | 구현됨 | 월 범위, 상세 테이블, 빈 결과 확인 |
| 프로젝트 통계 | `/stats/projects` | 프로젝트 통계 | STATS-PROJECT-002 | 프로젝트 상세 이동 | 통계 행에서 프로젝트 편집 화면으로 이동한다. | 프로젝트 ID. | `/projects/:projectId/edit` 링크 이동. | `src/pages/stats/ProjectStatsDetailsTable.tsx` | 구현됨 | 구현됨 | 행 링크 이동 확인 |
| 태스크 현황 | `/stats/monitoring` | 모니터링 통계 | STATS-MON-001 | 모니터링 월 범위 조회 | 월 범위 기준 모니터링 대상 태스크와 상태를 조회한다. | 시작 월, 종료 월. | 요약, 표, 빈 상태, 로딩. | `src/pages/stats/TaskMonitoringPage.tsx`, `src/pages/stats/TaskMonitoringFilterForm.tsx` | 구현됨 | 구현됨 | 기간 변경, 빈 결과, 오류 확인 |
| 태스크 현황 | `/stats/monitoring` | 모니터링 통계 | STATS-MON-002 | 차트/표 전환 | 모니터링 데이터를 요약 차트와 상세 표로 표시한다. | 보기 모드, 조회 결과. | 차트/표 상태 전환. | `src/pages/stats/TaskMonitoringSummarySection.tsx`, `src/pages/stats/TaskMonitoringResultsTable.tsx` | 구현됨 | 구현됨 | 차트/표 토글 확인 |
| 태스크 현황 | `/stats/monitoring` | 모니터링 통계 | STATS-MON-003 | 태스크 상태 수정 | 모니터링 결과 행에서 추적 상태를 inline 수정한다. | 태스크/페이지 ID, 상태값. | 저장 후 행 상태 갱신, 실패 시 오류. | `src/pages/stats/TaskMonitoringResultsTable.tsx`, `src/api/stats` | 구현됨 | 구현됨 | 상태 변경 성공/실패, 권한 확인 |
| 관리자 | `/admin/members` | 사용자 관리 | ADMIN-MEMBER-001 | 사용자 목록 조회 | admin이 사용자 목록을 검색/필터링한다. 상태, 권한, 업무보고 대상 여부를 확인한다. | 검색어, 상태 필터, 정렬. | 사용자 목록, 빈 상태, 로딩. | `src/pages/admin/members/AdminMembersPage.tsx`, `src/pages/admin/members/useAdminMembersPage.ts` | 구현됨 | 구현됨 | 검색, 상태 필터, 정렬 확인 |
| 관리자 | `/admin/members/new` | 사용자 관리 | ADMIN-MEMBER-002 | 사용자 추가/초대 | admin이 사용자 기본정보와 권한을 입력해 신규 사용자를 초대한다. | 이름, 이메일, 역할, 승인 상태, 업무보고 대상 여부. | 초대 성공, 목록 이동, 오류. | `src/pages/admin/members/AdminMemberEditorPage.tsx`, `src/pages/admin/members/adminMemberForm.ts` | 구현됨 | 구현됨 | 필수값, 이메일 형식, 초대 실패 확인 |
| 관리자 | `/admin/members/:memberId/edit` | 사용자 관리 | ADMIN-MEMBER-003 | 사용자 정보 수정 | admin이 기존 사용자의 역할, 승인 상태, 활성 여부, 업무보고 대상 여부를 수정한다. | member ID, 변경 필드. | 저장 후 목록 이동, 권한 변경 반영. | `src/pages/admin/members/AdminMemberEditorPage.tsx` | 구현됨 | 구현됨 | role/status/reportRequired 변경 확인 |
| 관리자 | `/admin/type` | 업무 타입 관리 | ADMIN-TYPE-001 | 업무 타입 목록 조회 | admin이 업무 타입 기준정보를 표시 순서, 활성 여부와 함께 조회한다. | 검색/정렬 조건. | 타입 목록, 빈 상태. | `src/pages/admin/types/AdminTaskTypesPage.tsx` | 구현됨 | 구현됨 | 목록/정렬/신규 이동 확인 |
| 관리자 | `/admin/type/new`, `/admin/type/:taskTypeId/edit` | 업무 타입 관리 | ADMIN-TYPE-002 | 업무 타입 저장 | admin이 타입1/타입2, 리소스 집계 타입, 서비스그룹 필요 여부, 표시 순서를 저장한다. | 타입명 필수, 표시 순서, 활성 여부. | 저장 성공, 업무보고 선택지 반영. | `src/pages/admin/types/AdminTaskTypeEditorPage.tsx`, `src/pages/admin/types/AdminTaskTypeEditorForm.tsx` | 구현됨 | 구현됨 | 저장/수정/비활성 반영 확인 |
| 관리자 | `/admin/platform` | 플랫폼 관리 | ADMIN-PLATFORM-001 | 플랫폼 목록 조회 | admin이 프로젝트에서 사용하는 플랫폼 기준정보를 조회한다. | 검색/정렬 조건. | 플랫폼 목록, 빈 상태. | `src/pages/admin/platforms/AdminPlatformsPage.tsx` | 구현됨 | 구현됨 | 목록/신규/수정 이동 확인 |
| 관리자 | `/admin/platform/new`, `/admin/platform/:platformId/edit` | 플랫폼 관리 | ADMIN-PLATFORM-002 | 플랫폼 저장 | admin이 플랫폼명을 신규 생성하거나 수정한다. | 플랫폼명 필수, 활성 여부. | 저장 후 목록 반영. | `src/pages/admin/platforms/AdminPlatformEditorPage.tsx` | 구현됨 | 구현됨 | 필수값, 저장, 수정 확인 |
| 관리자 | `/admin/cost-group` | 청구그룹 관리 | ADMIN-COST-001 | 청구그룹 목록 조회 | admin이 프로젝트 청구그룹 기준정보를 조회한다. | 검색/정렬 조건. | 목록, 빈 상태. | `src/pages/admin/cost-groups/AdminCostGroupsPage.tsx` | 구현됨 | 구현됨 | 목록/신규/수정 이동 확인 |
| 관리자 | `/admin/cost-group/new`, `/admin/cost-group/:costGroupId/edit` | 청구그룹 관리 | ADMIN-COST-002 | 청구그룹 저장 | admin이 청구그룹명을 생성/수정한다. | 청구그룹명 필수, 활성 여부. | 저장 후 프로젝트 편집 후보에 반영. | `src/pages/admin/cost-groups/AdminCostGroupEditorPage.tsx` | 구현됨 | 구현됨 | 필수값, 저장, 비활성 반영 확인 |
| 관리자 | `/admin/group` | 서비스 그룹 관리 | ADMIN-GROUP-001 | 서비스그룹 목록 조회 | admin이 서비스그룹/서비스명/분류/활성 상태를 조회한다. | 검색/정렬 조건. | 서비스그룹 목록, 빈 상태. | `src/pages/admin/groups/AdminServiceGroupsPage.tsx` | 구현됨 | 구현됨 | 목록, 수정 이동, 빈 상태 확인 |
| 관리자 | `/admin/group/new`, `/admin/group/:serviceGroupId/edit` | 서비스 그룹 관리 | ADMIN-GROUP-002 | 서비스그룹 저장 | admin이 업무/프로젝트 분류에 사용하는 서비스그룹을 생성/수정한다. | 그룹명, 서비스명, 분류, 활성 여부. | 저장 후 업무 타입/프로젝트/리소스 집계 후보에 반영. | `src/pages/admin/groups/AdminServiceGroupEditorPage.tsx` | 구현됨 | 구현됨 | 신규/수정/비활성 반영 확인 |
| 프로필 | `/profile` | 계정 설정 | PROFILE-001 | 내 프로필 조회 | 로그인 사용자가 자신의 이름, 이메일, 역할, 상태 등 계정 정보를 확인한다. | 세션 사용자. | 프로필 정보, 로딩/오류. | `src/pages/profile/UserProfilePage.tsx`, `src/pages/profile/UserProfileSections.tsx` | 구현됨 | 구현됨 | 사용자 정보 표시 확인 |
| 프로필 | `/profile` | 계정 설정 | PROFILE-002 | 비밀번호 변경 | 프로필 화면에서 비밀번호 변경 모달을 열고 새 비밀번호를 저장한다. 변경 후 재로그인 안내/이동을 제공한다. | 새 비밀번호, 확인값, 8자 이상, 일치. | 성공 안내, 로그인 이동, 오류. | `src/pages/profile/UserProfilePasswordModal.tsx`, `src/pages/profile/UserProfilePage.tsx` | 구현됨 | 구현됨 | 불일치, 8자 미만, 정상 변경 확인 |
| 설정 | `/settings` | 개인화 설정 | SETTINGS-001 | 테마/폰트 설정 | 사용자가 테마와 글꼴 선호를 변경한다. 설정은 preference context에 반영된다. | 테마 값, 폰트 값. | 즉시 UI 반영, 저장 상태. | `src/pages/settings/UserSettingsPage.tsx`, `src/preferences/**` | 구현됨 | 구현됨 | 테마/폰트 변경 후 반영 확인 |
| 시스템 | `/healthz` | 운영 상태 | HEALTH-001 | 헬스체크 표시 | 서비스 상태 확인용 화면을 표시한다. 인증 없이 접근 가능하다. | 없음. | 헬스체크 화면. | `src/pages/health/HealthCheckPage.tsx` | 구현됨 | 구현됨 | guest/auth 모두 접근 확인 |
| 시스템 | `*` | 예외 처리 | NOTFOUND-001 | 미등록 경로 안내 | 정의되지 않은 URL 접근 시 404 안내와 이동 버튼을 제공한다. 로그인 상태면 대시보드/업무보고, 비로그인이면 로그인으로 안내한다. | 현재 auth 상태. | 404 화면, 이동 버튼. | `src/pages/notFound/NotFoundPage.tsx` | 구현됨 | 구현됨 | 비로그인/로그인 상태별 버튼 목적지 확인 |

## 3. 화면별 주요 세부 기능 보강

### 3.1 업무보고 기능 분해

업무보고는 단일 “업무보고 페이지”가 아니라 아래 세부 기능 조합으로 동작한다.

| 세부 기능 | 동작 | 필수 확인 |
| --- | --- | --- |
| 일자 선택 | 업무 날짜를 선택하고 저장 payload에 반영한다. | 오늘/과거/미래 날짜 처리 정책 |
| 타입1 선택 | 업무 유형 상위 분류를 선택하고 타입2 후보를 재계산한다. | 타입1 변경 시 타입2 초기화 |
| 타입2 선택 | 실제 저장되는 업무 유형을 확정한다. | 비활성 타입 제외 |
| 프로젝트 선택 | 업무와 프로젝트를 연결한다. | 선택 프로젝트의 페이지 후보만 노출 |
| 페이지 선택 | 프로젝트 하위 페이지/태스크를 연결한다. | 프로젝트-페이지 매핑 불일치 저장 차단 |
| 소요시간 입력 | 업무 시간을 분 단위로 저장한다. | 음수/소수/빈 값 차단 |
| 내용/비고 입력 | 업무 내용과 부가 설명을 저장한다. | 긴 텍스트 표시 깨짐 없음 |
| 저장 | 신규 업무를 생성하거나 기존 업무를 수정한다. | 성공 후 목록/query 갱신 |
| 삭제 | 업무 ID 기준으로 업무를 제거한다. | 삭제 후 합계 재계산 |
| 기간 조회 | 지정 기간의 업무 목록을 다시 조회한다. | 기간 변경 시 목록 갱신 |

### 3.2 프로젝트 편집 기능 분해

| 세부 기능 | 동작 | 필수 확인 |
| --- | --- | --- |
| 프로젝트 기본정보 저장 | 프로젝트명, 기간, 플랫폼, 청구그룹, 서비스그룹을 저장한다. | 필수값, 날짜 범위 validation |
| 페이지 행 추가 | 하위 페이지/태스크 입력 행을 추가한다. | 빈 행 저장 차단 |
| 페이지 행 수정 | 기존 페이지명, URL, 추적 상태 등을 수정한다. | 수정 후 통계/모니터링 반영 |
| 페이지 행 삭제 | 하위 페이지를 삭제한다. | 연결 업무 존재 시 정책 확인 |
| 목록 복귀 | 저장/취소 후 프로젝트 목록으로 이동한다. | 변경 전 취소 동작 확인 |

### 3.3 관리자 기능 분해

| 세부 기능 | 동작 | 필수 확인 |
| --- | --- | --- |
| 업무보고 전체 조회 | 전체 사용자 업무를 기간/사용자/검색어로 조회한다. | 일반 사용자 접근 차단 |
| 업무보고 대리 입력 | admin이 특정 사용자 업무를 대신 등록한다. | 대상 사용자 필수 |
| 기준정보 관리 | 업무 타입, 플랫폼, 청구그룹, 서비스그룹을 관리한다. | 비활성 기준정보가 사용자 입력 후보에 미치는 영향 |
| 사용자 관리 | 사용자 초대, 역할, 승인 상태, 업무보고 대상 여부를 관리한다. | role/status 변경 후 라우팅/권한 반영 |
| 리소스 집계 | 업무 타입/서비스그룹/월간 리포트를 집계한다. | MM 합계와 월 이동 검증 |


## 4. 상세 기능 플로우

이 장은 요약표의 각 기능을 실제 구현/QA에 사용할 수 있도록 절차, 입력 검증, 데이터 처리, 예외, 완료 기준으로 다시 풀어쓴다.

### 4.1 인증/계정 기능

#### AUTH-LOGIN-001 이메일·비밀번호 로그인

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 사용자가 `/login` 화면에서 이메일과 비밀번호를 입력하고 로그인 버튼을 누른다. |
| 선행 조건 | Supabase URL/API key 환경변수가 설정되어 있어야 한다. 이미 recovery 세션이면 로그인 폼을 보여주지 않고 `/auth/recovery`로 이동한다. |
| 입력값 | `email`, `password` |
| 검증 규칙 | 이메일은 필수이고 trim/lowercase 후 사용한다. 비밀번호는 필수다. 둘 중 하나라도 비면 API를 호출하지 않는다. |
| 처리 순서 | 1) form submit 2) zod validation 3) `login(email, password)` 호출 4) Supabase `signInWithPassword` 5) auth state 변경 6) auth user와 매핑된 member 조회 7) member status/role 확인 8) 라우팅 처리 |
| 데이터 처리 | Supabase Auth 세션 생성, `members` 조회, 최종 로그인 갱신. |
| 성공 결과 | active member는 `/dashboard`, pending member는 `/pending-approval`로 이동한다. |
| 예외/오류 | 환경변수 없음, 계정 없음, 비밀번호 오류, member 매핑 실패, pending 상태. |
| 화면 상태 | 제출 중 버튼 비활성, 오류 메시지 영역 표시, 성공 시 replace navigation. |
| QA 기준 | 빈 이메일, 빈 비밀번호, 잘못된 계정, pending 계정, active 계정, recovery 세션 직접 접근을 각각 확인한다. |

#### AUTH-PW-001 비밀번호 재설정 메일 요청

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 사용자가 `/forgot-password`에서 이메일을 입력하고 재설정 메일 발송을 요청한다. |
| 입력값 | `email` |
| 검증 규칙 | 이메일 필수. trim/lowercase. |
| 처리 순서 | 1) 이메일 입력 2) form validation 3) `resetPassword(email)` 호출 4) recovery redirect URL 생성 5) Supabase reset email 요청 6) 성공 안내 표시 |
| 데이터 처리 | DB 직접 저장 없음. Supabase Auth의 reset mail flow 사용. |
| 성공 결과 | 메일 발송 안내. 사용자는 메일 링크로 `/auth/recovery`에 진입한다. |
| 예외/오류 | 이메일 누락, Supabase 미설정, 메일 발송 실패. |
| QA 기준 | 빈 이메일, 정상 이메일, Supabase error mocking, 성공 메시지를 확인한다. |

#### AUTH-PW-002 새 비밀번호 저장

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | recovery 링크로 진입한 사용자가 새 비밀번호와 확인값을 입력하고 저장한다. |
| 입력값 | `password`, `confirmPassword` |
| 검증 규칙 | 비밀번호 8자 이상, 확인값 일치 필수. |
| 처리 순서 | 1) recovery 세션 확인 2) 비밀번호 입력 3) validation 4) Supabase `updateUser({ password })` 5) 성공 안내 6) 로그인 화면 복귀 |
| 데이터 처리 | Supabase Auth 사용자 비밀번호 변경. |
| 성공 결과 | 비밀번호 변경 완료. 이후 새 비밀번호로 로그인 가능. |
| 예외/오류 | recovery 세션 없음, 링크 만료, 8자 미만, 확인값 불일치, Supabase update 실패. |
| QA 기준 | 만료 링크, 짧은 비밀번호, 불일치, 정상 변경 후 로그인 가능 여부 확인. |

### 4.2 업무보고 기능

#### REPORT-001 최근 업무보고 조회

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 사용자가 `/person/report`에 진입한다. |
| 선행 조건 | active user/admin, 업무보고 대상자 여부 확인. |
| 처리 순서 | 1) 현재 선택 날짜 초기화 2) `getTasksByDate(member, selectedDate)` 호출 3) 프로젝트/페이지/업무 타입/청구그룹/플랫폼 기준정보 조회 4) API record를 화면 row로 변환 5) 최신순/선택일 기준 표시 |
| 데이터 처리 | `src/api/tasks.ts`의 `getTasksByDate`, 프로젝트/기준정보 API 조회. |
| 출력 | 업무일자, 청구그룹, 업무 타입, 플랫폼, 서비스그룹, 프로젝트, 페이지, 소요시간, 내용/비고. |
| 상태 | 로딩, 빈 상태, 오류, 목록 표시. |
| QA 기준 | 업무 없는 날짜, 업무 여러 건 날짜, 기준정보 누락 row, API 오류를 확인한다. |

#### REPORT-002 업무 등록

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 날짜, 업무 유형, 프로젝트/페이지, 소요시간, 내용/비고를 입력하고 저장한다. |
| 입력값 | `taskDate`, `taskType1`, `taskType2`, `projectId`, `subtaskId`, `taskUsedtime`, `taskDescription`, `taskNote` |
| 검증 규칙 | 날짜 유효성, 업무 타입 기준정보 존재 여부, 소요시간 숫자/0 이상, 프로젝트-페이지 매핑 일치, 업무보고 권한. |
| 처리 순서 | 1) draft 상태 갱신 2) 저장 클릭 3) 날짜/타입/시간/연결관계 validation 4) save payload 구성 5) `saveTask(member, input)` 호출 6) 관련 query invalidation 7) 성공 메시지와 목록 갱신 |
| 데이터 처리 | `src/api/tasks.ts`의 `save_task` RPC 호출. 저장 후 `reports`, `search`, `dashboard`, `dashboard-stats` query invalidation. |
| 성공 결과 | 업무 목록에 신규 row 표시, 선택 상태 초기화, 입력 폼 재사용 가능. |
| 예외/오류 | 날짜 없음, 타입 없음, 시간 오류, 프로젝트/페이지 불일치, 권한 없음, RPC 실패. |
| QA 기준 | 필수값 하나씩 누락, 정상 저장, 저장 후 대시보드/내역 반영, API 실패 메시지를 확인한다. |

#### REPORT-003 업무 수정

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 목록에서 업무를 선택해 폼에 로드하고 값을 바꾼 뒤 저장한다. |
| 입력값 | 기존 `taskId` + 등록과 동일한 필드. |
| 검증 규칙 | 등록과 동일하며 수정 대상 ID가 있어야 한다. |
| 처리 순서 | 1) row 선택 2) row 데이터를 draft로 변환 3) 사용자가 수정 4) validation 5) `saveTask`에 taskId 포함 6) 목록/통계 query 갱신 |
| 데이터 처리 | 같은 `save_task` RPC가 upsert/update 역할을 수행. |
| 성공 결과 | 기존 row가 수정값으로 교체된다. |
| 예외/오류 | 대상 업무 없음, validation 실패, update 실패, 권한 오류. |
| QA 기준 | 날짜/시간/타입/프로젝트 각각 수정, 취소, 저장 실패를 확인한다. |

#### REPORT-004 업무 삭제

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 목록에서 삭제 버튼을 누른다. |
| 입력값 | `taskId` |
| 검증 규칙 | taskId 필수, 삭제 중 중복 클릭 차단. |
| 처리 순서 | 1) 삭제 액션 2) `deleteTask(member, taskId)` 호출 3) `delete_task` RPC 4) 관련 query invalidation 5) 목록에서 제거 |
| 데이터 처리 | `src/api/tasks.ts`의 `delete_task` RPC. |
| 성공 결과 | 삭제된 업무가 목록에서 사라지고 합계/대시보드가 갱신된다. |
| 예외/오류 | taskId 없음, 권한 없음, RPC 실패. |
| QA 기준 | 정상 삭제, 삭제 실패, 삭제 중 버튼 상태, 삭제 후 검색/대시보드 반영 확인. |

#### REPORT-005 업무 타입/프로젝트/페이지 종속 선택

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 업무 타입1을 선택하고 타입2, 프로젝트, 페이지를 순서대로 선택한다. |
| 입력값 | `type1`, `type2`, `projectId`, `subtaskId` |
| 검증 규칙 | 타입2는 선택된 타입1 하위 active 항목이어야 한다. 페이지는 선택 프로젝트에 속해야 한다. 서비스그룹/프로젝트 필요 여부는 타입 정책을 따른다. |
| 처리 순서 | 1) 타입1 변경 시 타입2 초기화 2) 타입2 후보 재계산 3) 프로젝트 검색/선택 4) 프로젝트별 subtask 조회 5) 페이지 선택 6) 저장 시 관계 검증 |
| 데이터 처리 | `getTaskTypes`, `searchReportProjects`, `getProjectSubtasksByProjectId` 사용. |
| 성공 결과 | 유효한 조합만 저장 payload로 전달된다. |
| 예외/오류 | 타입 조합 불일치, inactive 기준정보, 프로젝트-페이지 불일치. |
| QA 기준 | 타입1 변경 후 타입2 초기화, 프로젝트 변경 후 페이지 후보 변경, 불일치 저장 차단 확인. |

#### REPORT-006 오버헤드 자동 등록

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 오버헤드 시간을 입력하거나 관련 액션을 실행한다. |
| 입력값 | `taskUsedtime`, `reportDate` |
| 검증 규칙 | 시간은 0 이상 정수. `기타버퍼/오버헤드` 타입 기준정보가 존재해야 한다. |
| 처리 순서 | 1) 오버헤드 저장 액션 2) task type에서 `기타버퍼/오버헤드` 탐색 3) payload 자동 구성 4) `saveTask` 호출 5) 목록/통계 갱신 |
| 데이터 처리 | `useReportsSlice.saveOverheadReport`, `validateTaskTypeSelection`, `saveTask`. |
| 성공 결과 | 오버헤드 업무가 지정일에 등록된다. |
| 예외/오류 | 기준 타입 없음, 시간 오류, 저장 실패. |
| QA 기준 | 오버헤드 타입 존재/미존재, 정상 저장, 시간 오류 확인. |

### 4.3 검색/다운로드 기능

#### SEARCH-001 내 업무내역 조회

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 기간, 검색어, 페이지 크기를 조정해 내 업무를 검색한다. |
| 입력값 | `startDate`, `endDate`, `search`, `page`, `pageSize` |
| 검증 규칙 | 시작일/종료일 유효성, 시작일이 종료일보다 늦으면 안 된다. |
| 처리 순서 | 1) 필터 입력 2) 검색 실행 3) `searchTasksPage` RPC 호출 4) 결과 변환 5) 클라이언트 정렬/페이지 표시 |
| 데이터 처리 | `src/api/tasks.ts`의 `search_tasks_page` RPC. |
| 성공 결과 | 검색 결과 테이블과 페이지네이션 표시. |
| 예외/오류 | 날짜 오류, 결과 없음, API 실패. |
| QA 기준 | 월 기본값, 검색어 필터, 기간 오류, 페이지 변경, 빈 결과 확인. |

#### SEARCH-002 Excel 다운로드

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 현재 검색 조건으로 Excel 다운로드 버튼을 누른다. |
| 입력값 | 현재 `startDate`, `endDate`, `search` |
| 검증 규칙 | 다운로드 기간은 3개월 이내여야 한다. 결과가 없으면 의미 있는 안내가 필요하다. |
| 처리 순서 | 1) 기간 검증 2) `exportTasks` RPC 호출 3) 결과 row 변환 4) workbook 생성 5) 파일명 생성 후 다운로드 |
| 데이터 처리 | `src/api/tasks.ts`의 `search_tasks_export`, `src/utils/excel.ts`. |
| 성공 결과 | 업무내역 Excel 파일 다운로드. |
| 예외/오류 | 3개월 초과, API 실패, 파일 생성 실패. |
| QA 기준 | 3개월 이내/초과, 필터 적용 다운로드, 파일 컬럼 확인. |

### 4.4 프로젝트/페이지 관리 기능

#### PROJECT-EDIT-001 프로젝트 저장

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 프로젝트 신규/수정 화면에서 기본정보와 하위 페이지를 입력하고 저장한다. |
| 입력값 | 프로젝트명, 시작일, 종료일, 청구그룹, 플랫폼, 서비스그룹, 담당자/검수자, 하위 페이지 목록. |
| 검증 규칙 | 프로젝트명 필수, 날짜 범위 유효, 기준정보 ID 유효, 하위 페이지 필수값 검증. |
| 처리 순서 | 1) 기존 프로젝트 로딩 또는 신규 draft 생성 2) 기본정보 입력 3) 하위 페이지 행 추가/수정/삭제 4) 저장 클릭 5) 프로젝트 저장 6) 하위 페이지 저장/삭제 처리 7) 목록/상세 query 갱신 |
| 데이터 처리 | `saveProject`, `saveProjectSubtask`, `deleteProjectSubtask`, `deleteProject`. |
| 성공 결과 | 신규는 편집 URL로 이동하거나 목록 반영, 수정은 변경값 유지. |
| 예외/오류 | 필수값 누락, 날짜 역전, 기준정보 없음, 하위 페이지 저장 실패, 삭제 실패. |
| QA 기준 | 신규 저장, 수정 저장, 하위 페이지 추가/수정/삭제, 저장 실패, 취소 확인. |

#### PROJECT-PAGE-001 하위 페이지 관리

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 프로젝트 편집 화면에서 하위 페이지/태스크 행을 추가, 수정, 삭제한다. |
| 입력값 | 페이지명, URL, tracking 상태, 담당자/검수자, 비고 등 페이지 draft. |
| 검증 규칙 | 페이지명 필수. 프로젝트 ID가 있어야 저장 가능. 삭제 시 연결 업무 정책 확인 필요. |
| 처리 순서 | 1) 행 추가 2) 필드 입력 3) 저장 시 신규 행은 create, 기존 행은 update 4) 삭제 행은 delete 처리 5) 통계/모니터링에서 변경값 사용 |
| 데이터 처리 | `ProjectEditorPage.draft.ts`, `ProjectEditorPage.service.ts`, `src/api/projects.ts`. |
| 성공 결과 | 프로젝트 상세와 통계/모니터링 후보에 페이지가 반영된다. |
| 예외/오류 | 빈 행, URL 형식 문제, 연결 업무가 있는 삭제, API 실패. |
| QA 기준 | 빈 행 저장 차단, 페이지명 수정, tracking 상태 수정 후 모니터링 반영 확인. |

### 4.5 관리자 업무보고 기능

#### ADMIN-REPORT-001 전체 업무보고 검색

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | admin이 기간, 사용자, 검색어, 타입 조건으로 전체 업무보고를 검색한다. |
| 입력값 | 시작일, 종료일, memberIds, 검색어, 타입/프로젝트 조건, sort. |
| 검증 규칙 | admin 권한 필수, 기간 유효, 다운로드 시 3개월 제한. |
| 처리 순서 | 1) 필터 설정 2) 검색 실행 3) `admin_search_tasks` RPC 호출 4) 결과 변환 5) 정렬/페이지 표시 6) 필요 시 Excel export |
| 데이터 처리 | `searchTasksAdmin`, `AdminReportsPage.utils.ts`, `AdminReportsResultsTable.tsx`. |
| 성공 결과 | 전체 업무보고 결과 표시, 정렬/다운로드/수정/삭제 액션 제공. |
| 예외/오류 | 권한 없음, 날짜 오류, RPC 실패, 결과 없음. |
| QA 기준 | 일반 사용자 차단, 다중 사용자 필터, 정렬, 삭제, 다운로드 확인. |

#### ADMIN-REPORT-EDIT-001 업무보고 대리 등록/수정

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | admin이 특정 사용자의 업무보고를 신규 작성하거나 기존 업무를 수정한다. |
| 입력값 | 대상 사용자, 업무일, 타입1/타입2, 프로젝트/페이지, 시간, 내용, 비고. |
| 검증 규칙 | 대상 사용자 필수, 날짜/타입/시간 필수, 타입-프로젝트 정책 준수. |
| 처리 순서 | 1) 신규 또는 taskId 기반 기존 데이터 로딩 2) 대상 사용자 선택 3) 업무 상세 입력 4) validation 5) `admin_save_task` RPC 6) 검색 목록으로 복귀 |
| 데이터 처리 | `getTaskAdmin`, `saveTaskAdmin`, `AdminReportEditorPage.tsx`. |
| 성공 결과 | 해당 사용자의 업무로 저장되고 관리자 검색 결과에 반영된다. |
| 예외/오류 | 대상 사용자 없음, 업무 없음, validation 실패, RPC 실패. |
| QA 기준 | 신규/수정, 대상 사용자 변경, 타입/프로젝트 종속 검증, 목록 복귀 확인. |

### 4.6 기준정보 관리 기능

#### ADMIN-TYPE-002 업무 타입 저장/삭제/대체

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | admin이 업무 타입을 생성/수정/삭제하거나 사용 중인 타입을 다른 타입으로 대체한다. |
| 입력값 | type1, type2, resource type, serviceGroupRequired, displayOrder, active. |
| 검증 규칙 | type1/type2 필수, 중복 정책 확인, 사용 중 삭제 시 대체 타입 필요. |
| 처리 순서 | 1) 목록 조회 2) 신규/수정 진입 3) 필드 입력 4) 저장 5) 사용 중 삭제 시 usage summary 확인 6) 대체 타입 선택 7) replace 후 삭제 또는 비활성 처리 |
| 데이터 처리 | `saveTaskTypeAdmin`, `getTaskTypeUsageSummary`, `replaceTaskTypeUsage`, `deleteTaskTypeAdmin`, `reorderTaskTypes`. |
| 성공 결과 | 업무보고 타입 후보와 리소스 집계 기준에 반영된다. |
| 예외/오류 | 필수값 누락, 사용 중 타입 삭제 정책, 대체 타입 없음, API 실패. |
| QA 기준 | 신규 타입이 업무보고 후보에 표시되는지, 사용 중 삭제 시 대체 dialog가 뜨는지 확인. |

#### ADMIN-MEMBER-002 사용자 추가/초대/상태 변경

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | admin이 사용자 정보를 입력해 초대하거나 기존 사용자의 역할/승인/활성 상태를 수정한다. |
| 입력값 | 이름, 이메일, role, memberStatus, active, reportRequired, note. |
| 검증 규칙 | 이메일/이름 필수, role 값 유효, status 값 유효. |
| 처리 순서 | 1) 목록에서 신규/수정 진입 2) 기본정보 입력 3) 권한/상태 입력 4) 저장 또는 초대 5) 필요 시 비밀번호 재설정 메일 발송/삭제/복원 처리 |
| 데이터 처리 | `createMemberAdmin`, `inviteMemberAdmin`, `saveMemberAdmin`, `resetMemberPasswordAdmin`, `deleteMemberAdmin`. |
| 성공 결과 | 사용자 목록 반영, pending/active 상태에 따라 라우팅 정책 반영. |
| 예외/오류 | 이메일 중복, 초대 실패, 삭제 결과가 deleted/deactivated 외 값, API 실패. |
| QA 기준 | pending 사용자는 승인 대기 화면으로 가는지, admin/user role에 따라 메뉴가 바뀌는지 확인. |

### 4.7 통계/리소스 기능

#### RESOURCE-MONTH-001 월간 리포트 조회

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | admin이 월간 리포트 화면에서 기준 월과 탭을 선택해 리소스 데이터를 본다. |
| 입력값 | 기준 월, route type, 탭 상태. |
| 검증 규칙 | 월 형식 유효, route type이 허용된 타입인지 확인. |
| 처리 순서 | 1) 기준 월 초기화 2) 월간 리포트 query 3) summary/member/type/service 데이터 변환 4) 탭별 표/차트 렌더링 5) 이전/다음 월 이동 |
| 데이터 처리 | `getResourceMonthReport`, `resourceApiTransform`, `ResourceMonthPage.tables.tsx`. |
| 성공 결과 | 총 MM, 휴무/버퍼, 사용자별 초과/부족, 유형/서비스/보고서 탭 표시. |
| 예외/오류 | 데이터 없음, API 실패, 잘못된 route param. |
| QA 기준 | 월 이동, route param 탭, 합계 계산, 빈 데이터, 오류 상태 확인. |

#### STATS-MON-003 모니터링 상태 inline 수정

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 모니터링 결과 테이블에서 태스크/페이지 추적 상태를 변경한다. |
| 입력값 | project/subtask identifier, tracking status. |
| 검증 규칙 | 허용된 상태값만 선택 가능. 권한 확인 필요. |
| 처리 순서 | 1) 모니터링 결과 조회 2) 행에서 상태 select 변경 3) update API 호출 4) 성공 시 row 상태 갱신 5) 실패 시 기존 상태 유지/오류 표시 |
| 데이터 처리 | `TaskMonitoringResultsTable.tsx`, `getMonitoringStatsRows`, 상태 update API. |
| 성공 결과 | 표와 요약 차트가 갱신된 상태를 반영한다. |
| 예외/오류 | 저장 실패, 권한 없음, 대상 row 없음. |
| QA 기준 | 상태 변경 성공/실패, 저장 중 비활성, 새로고침 후 유지 확인. |

### 4.8 설정/프로필 기능

#### PROFILE-002 비밀번호 변경

| 항목 | 상세 명세 |
| --- | --- |
| 사용자 행동 | 프로필 화면에서 비밀번호 변경 모달을 열고 새 비밀번호를 입력한다. |
| 입력값 | newPassword, confirmPassword. |
| 검증 규칙 | 8자 이상, 확인값 일치. |
| 처리 순서 | 1) 모달 열기 2) 새 비밀번호 입력 3) validation 4) Supabase password update 5) 성공 안내 6) 로그인 화면으로 이동 또는 재로그인 유도 |
| 데이터 처리 | Supabase Auth update user. |
| 성공 결과 | 비밀번호 변경 완료와 재로그인 흐름 제공. |
| 예외/오류 | 짧은 비밀번호, 불일치, 세션 만료, update 실패. |
| QA 기준 | 모달 취소, validation, 정상 변경, 변경 후 기존 비밀번호 로그인 실패 여부 확인. |

## 4. QA 체크리스트

| 구분 | 체크 항목 |
| --- | --- |
| 라우팅 | `RootRouter.tsx`에 정의된 모든 라우트가 명세서에 존재하는가 |
| 기능 분해 | 각 화면이 페이지 설명이 아니라 실제 기능 단위로 분해되어 있는가 |
| 입력/검증 | 저장/조회/삭제 기능에 필수 입력과 validation이 적혀 있는가 |
| 데이터 처리 | 각 기능이 어떤 API/page/client를 통해 조회·저장·삭제되는지 추적 가능한가 |
| 상태 | 로딩, 빈 상태, 성공, 실패, 권한 없음 상태가 적혀 있는가 |
| 권한 | guest/pending/user/admin 접근 차이가 적혀 있는가 |
| 운영 리스크 | 코드로 확정 어려운 정책이 확인 필요로 분리되어 있는가 |

## 5. 변경 이력

| 날짜 | 변경 내용 | 작성자 |
| --- | --- | --- |
| 2026-04-24 | 기능명세서 재작성. 화면/세부페이지/Epic/기능/상세 스펙/구현·디자인 여부/QA 기준 포함. | haeppa |
