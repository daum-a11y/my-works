# 기존 원본 프로젝트 vs 현재 `my-works` 기능 대조 리포트

작성일: 2026-03-25 Asia/Seoul

## 비교 기준

- 1차 원본: `/Users/gio.a/Documents/workspace/next/php-operation_tool`
- 2차 원본: `/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage`
- 현재 개발본: `/Users/gio.a/Documents/workspace/next/my-works`

## 허용 차이

- 인증체계 변경
- 1차 작업에서 승인된 DB 설계 변경

위 두 항목을 제외하면, 원본에 있던 기능은 정리되어 있어야 하고, 원본에 없던 기능은 임의 추가로 본다.

## 원본에 있는데 현재 없어진 것

### 1. 개인 업무보고

원본 파일:
- `php-operation_tool/webapp/pages/report.php`
- `php-operation_tool/webapp/js/report.js`
- `linkagelab-a11y-workmanage/front/src/views/personal/ReportPersonal.vue`
- `linkagelab-a11y-workmanage/front/src/components/personal/ReportPersonalCreate.vue`
- `linkagelab-a11y-workmanage/front/src/components/personal/ReportPersonalTblRow.vue`

현재 대응 파일:
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`
- `my-works/apps/ops-web/src/features/reports/use-reports-slice.ts`
- `my-works/apps/ops-web/src/features/reports/report-domain.ts`

없어진 기능:
- `기본 입력 / TYPE 입력` 입력 모드 전환 탭
- 프로젝트 검색어 입력 + 검색 버튼 + 검색결과 선택 흐름
- 프로젝트 선택 시 플랫폼/서비스그룹/서비스명 자동 채움
- 업무 유형별 동적 입력 폼
  - `모니터링 > 이슈탐색`일 때 플랫폼/서비스그룹/서비스명/페이지명을 직접 입력하는 분기
  - `QA`일 때 프로젝트 검색 후 페이지명을 별도로 입력하는 분기
- 날짜 이전/다음/오늘 빠른 이동
- 기준일 입력 후 `이동` 버튼으로 날짜 전환
- `총 : n건 / sumMin 분` 배지 요약
- 과거 날짜에서 480분 미만일 때 `일간보고 작성이 안된 것 같네요` 경고
- 480분 초과 시 `8시간이상 근무하셨나요?` 경고
- 정렬 버튼
  - `type1`
  - `type2`
  - `플랫폼`
  - `서비스그룹`
  - `서비스명`
  - `프로젝트명`
  - `시간`
- 목록 컬럼 자체 누락
  - `플랫폼`
  - `서비스그룹`
  - `서비스명`
  - `링크`
- 오버헤드 입력 버튼
- 오늘의 입력시간 패널
- 미입력 시간 패널
- 행 단위 인라인 수정
- 행 단위 삭제 버튼
- 수정 중 취소 시 `_beforeEditingCache`로 복원하는 흐름
- 개인 업무보고는 원본에서 `프로젝트 선택 기반 자동채움 + 유형별 예외 입력`이었는데, 현재는 `projectId/pageId` 필수 선택 단일 구조로 축소됨

### 2. 개인 검색

원본 파일:
- `php-operation_tool/webapp/pages/report_personal.php`
- `linkagelab-a11y-workmanage/front/src/views/personal/ReportSearch.vue`
- `linkagelab-a11y-workmanage/front/src/components/search/SearchTblHead.vue`
- `linkagelab-a11y-workmanage/front/src/components/search/SearchTblSortingBtn.vue`

현재 대응 파일:
- `my-works/apps/ops-web/src/features/search/search-page.tsx`

없어진 기능:
- 검색 실행 버튼 기반 조회 흐름
- 개인 검색 다운로드 버튼
  - 원본은 `엑셀파일로 내려받기`
- 어제/오늘 빠른 날짜 버튼
- 정렬 버튼
  - `일자`
  - `type1`
  - `type2`
  - `플랫폼`
  - `서비스그룹`
  - `서비스명`
  - `프로젝트명`
  - `시간`
- 결과 테이블 컬럼 누락
  - `플랫폼`
  - `서비스그룹`
  - `서비스명`
  - `링크`
- 검색 결과 행 단위 수정
- 검색 결과 행 단위 삭제
- 원본의 검색 결과 요약 캡션 `총 n건 / n분`
- 원본은 기간 검색 후 결과를 내려받는 구조였는데, 현재는 다운로드가 제거됨

### 3. 프로젝트 관리

원본 파일:
- `php-operation_tool/webapp/pages/project.php`
- `php-operation_tool/webapp/js/project.js`

현재 대응 파일:
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`

없어진 기능:
- 프로젝트명 검색
- 반기 빠른 필터
  - `전년 하반기`
  - `올해 상반기`
  - `올해 하반기`
- 프로젝트 `종류(type1)` 선택
  - `QA`
  - `모니터링`
- 프로젝트 삭제
- 페이지 삭제
- 프로젝트 추가 모달의 서비스 검색 안내 흐름
- 프로젝트 수정 시 원본의 경고성 문구와 `해당페이지를 사용한 모든 사람들의 내용이 수정됩니다` 동작 맥락
- 원본은 프로젝트 리스트가 검색/반기 단위로 재조회되는 구조였는데, 현재는 전체 목록 고정 + 선택 편집 구조로 바뀜
- 프로젝트 하위 탭 분리
  - `QA`
  - `모니터링`
  - `전수조사`
  - `민원(외부)`
  - `컨설팅(내부)`
  - `Task`
- `QA` 전용 리스트 컬럼
  - `리뷰어`
  - `Highest`
  - `High`
  - `Normal`
  - `Low`
- `모니터링` 전용 리스트 컬럼
  - `Highest`
  - `High`
  - `Normal`
  - `Low`
- `전수조사` 전용 리스트 컬럼
  - `err`
- 각 하위 탭 행의 프로젝트 삭제 버튼
- 각 하위 탭 행의 보고서 URL 링크

### 4. 트래킹

원본 파일:
- `php-operation_tool/webapp/pages/track.php`
- `php-operation_tool/webapp/js/track.js`

현재 대응 파일:
- `my-works/apps/ops-web/src/features/tracking/TrackingFeature.tsx`

없어진 기능:
- 상단 빠른 필터 버튼
  - `파트전체`
  - `개인전체`
  - `미개선`
  - `개선`
  - `일부`
- 컬럼/필드 누락
  - `아지트공유일`
  - `아지트URL`
  - `1차점검일`
  - `2차점검일`
  - `3차점검일`
  - `4차점검일`
  - `개선여부`
  - `Highest`
  - `High`
  - `Normal`
  - `보고일수(report)`
  - `비고`
- 원본은 각 행의 위 필드를 한 번에 수정/저장했는데, 현재는 `담당자`, `상태`, `모니터링 진행중`, `QA 진행중`, `메모`만 수정 가능
- 원본의 `track_edit_select.php`, `track_edit_save.php` 기반 상세 편집 흐름

### 5. 모니터링/QA 통계

원본 파일:
- `php-operation_tool` 통계 화면 원본 분석 축
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceTop.vue`
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceTypeSummary.vue`
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceSvcSummary.vue`

현재 대응 파일:
- `my-works/apps/ops-web/src/features/stats/MonitoringStatsPage.tsx`
- `my-works/apps/ops-web/src/features/stats/QaStatsPage.tsx`

없어진 기능:
- 12개월 차트
- 월별 통계 표
- 최근 5개월 상세 패널
- 진행중 패널의 원본 상세 구성
- 일간 업무일지 작성현황 표
  - 사용자별 `PASS / 부족분 / 주말 총분` 표시
- 월간 사용자별 달력형 작성현황
  - 일자별 `-480분`, `PASS`, 주말 배지
  - 날짜 셀에서 개인 업무보고 화면으로 이동하는 링크
- 월별 화면에서 `이전 월 / 다음 월` 이동
- 월간 리소스 화면의 `업무타입별 월간 리소스` 표
- 월간 리소스 화면의 `서비스그룹별 월간 리소스` 표
- 월간 리소스 화면의 `월간 리소스 보고서양식`
- 월간 리소스 화면의 `서비스 그룹 표 펼치기/접기`
- 일간 리소스 화면의 `일간` / `월간` 분리 요약
- 월간 리소스 보고서 양식
- 타입별 월간 리소스 표
- 서비스그룹별 월간 리소스 표
- 일간/월간 리소스 요약 탭 구조
- QA 상세에서 원본의 서비스 축 분석
- 모니터링/QA 통계가 원본의 월 단위 집계 화면에서 현재 `진행중 항목 상세 리스트` 중심으로 단순화됨

### 6. 관리자 전체검색 / 업무보고 관리

원본 파일:
- `linkagelab-a11y-workmanage/front/src/views/search/Search.vue`
- `linkagelab-a11y-workmanage/front/src/components/search/SearchTblHead.vue`
- `linkagelab-a11y-workmanage/front/src/components/search/SearchTblRow.vue`
- `linkagelab-a11y-workmanage/front/src/components/search/SearchTblSortingBtn.vue`
- `linkagelab-a11y-workmanage/server/routes/a11y_work_route.js`

현재 대응 파일:
- `my-works/apps/ops-web/src/features/admin/reports/AdminReportsPage.tsx`
- `my-works/apps/ops-web/src/features/admin/admin-client.ts`

없어진 기능:
- 서비스명 필터
- 사용자 다중 체크박스 선택
- `전체` 사용자 선택 체크박스
- 빠른 날짜 버튼
  - 전날
  - 오늘
  - 다음날
- 행 추가 버튼으로 `신규 업무 생성` 행을 테이블 상단에 직접 열기
- 신규 행에서 입력하던 상세 필드
  - 사용자
  - 타입1/타입2
  - 플랫폼
  - 서비스그룹
  - 서비스명
  - 프로젝트명
  - 페이지명
  - 페이지 URL
  - 사용시간
  - 비고
- 결과 테이블의 정렬 버튼
  - `번호`
  - `일자`
  - `ID`
  - `type1`
  - `type2`
  - `플랫폼`
  - `서비스그룹`
  - `서비스명`
  - `프로젝트명`
  - `시간`
- 행 단위 인라인 수정
- 행 단위 인라인 삭제
- 엑셀 다운로드
  - 현재는 CSV로 변경됨

### 7. 관리자 타입 관리

원본 파일:
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminWorkType.vue`
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminWorkTypeManage.vue`
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminWorkTypeValid.vue`
- `linkagelab-a11y-workmanage/server/routes/a11y_work_route.js`

현재 대응 파일:
- 없음

없어진 기능:
- `/admin/type` 화면 전체
- 관리모드 / 유효성검증모드 전환
- 업무 타입 추가
- 업무 타입 수정
- 업무 타입 삭제
- `type_include_svc` 관리
- `type_active` 관리
- `type_etc` 관리
- 유효성 검증 PASS/FAIL 목록
- 유효하지 않은 `task_type1/task_type2` 일괄 치환

### 8. 관리자 서비스그룹/서비스명 관리

원본 파일:
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminSvc.vue`
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminSvcManage.vue`
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminSvcValid.vue`
- `linkagelab-a11y-workmanage/server/routes/a11y_work_route.js`

현재 대응 파일:
- 없음

없어진 기능:
- `/admin/group` 화면 전체
- 관리모드 / 유효성검증모드 전환
- 서비스그룹 추가
- 서비스명 추가
- 서비스 수정
- 서비스 삭제
- 서비스 활성/비활성 관리
- 서비스 분류(`카카오`, `공동체`, `외부`) 관리
- 유효성 검증 PASS/FAIL 목록
- 유효하지 않은 서비스그룹/서비스명 일괄 치환

### 9. 관리자 사용자 관리

원본 파일:
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminMember.vue`
- `linkagelab-a11y-workmanage/front/src/components/admin/AdminMemberRow.vue`

현재 대응 파일:
- `my-works/apps/ops-web/src/features/admin/members/AdminMembersPage.tsx`

없어진 기능:
- 사용자 삭제
- 다른 사용자 비밀번호 초기화
  - 원본 초기 비밀번호 안내: `linkagelab`
- 사용자 생성일 표시
- 마지막 로그인일 표시
- 사용자 행 단위 인라인 수정
- 활성/비활성 값을 숫자 원본 필드(`user_active`) 중심으로 직접 수정하는 흐름

### 10. 부재 페이지/라우트

원본 파일:
- `linkagelab-a11y-workmanage/front/src/router.js`
- `php-operation_tool/webapp/nav.php`
- `php-operation_tool/webapp/js/link.js`

현재 대응 파일:
- `my-works/apps/ops-web/src/app/AppRouter.tsx`

원본에 있었는데 현재 경로 또는 화면 자체가 없는 것:
- `/profile`
  - 원본은 프로필 정보 + 비밀번호 변경 화면
  - 현재는 `/settings/password`만 남고 프로필 화면이 없음
- `/admin/summary`
- `/admin/type`
- `/admin/group`
- `/resource`
- `/resource/summary`
- `/resource/month`
- `/resource/month/:type`
- `/resource/type`
- `/resource/svc`
- 404 화면

## 원본에 없는데 현재 생긴 것

### 1. 개인 업무보고/개인 검색에 생긴 기능

현재 파일:
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`
- `my-works/apps/ops-web/src/features/reports/use-reports-slice.ts`
- `my-works/apps/ops-web/src/features/search/search-page.tsx`
- `my-works/apps/ops-web/src/lib/data-client.ts`

원본에 없던 현재 기능:
- 자유 검색어 필터
- 프로젝트 필터
- 페이지 필터
- 타입1 필터
- 타입2 필터
- 최소 시간 필터
- 최대 시간 필터
- 필터 초기화 버튼
- 필터 변경 즉시 재조회 구조
- `새 보고` 버튼
- 초안 `초기화` 버튼
- 목록 행 선택으로 우측 편집기 로드
- 삭제 확인 단계(`삭제할까요?`식 2단계)
- `업무 내용`과 `메모`를 분리한 입력 구조
- `projectId/pageId`를 강제하는 단일 선택 구조

### 1-1. 개인 업무보고/검색 원본 하위 동작 대비 추가 구조

현재 파일:
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`
- `my-works/apps/ops-web/src/features/search/search-page.tsx`

원본에 없던 현재 기능:
- 검색 패널과 편집기를 한 화면 좌우 레이아웃으로 분리
- 목록 행 선택으로 편집 대상을 고정하는 구조
- 결과 요약 카드
  - 조회 결과 수
  - 합계 시간

### 2. 프로젝트/트래킹/통계에 생긴 기능

현재 파일:
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`
- `my-works/apps/ops-web/src/features/tracking/TrackingFeature.tsx`
- `my-works/apps/ops-web/src/features/stats/MonitoringStatsPage.tsx`
- `my-works/apps/ops-web/src/features/stats/QaStatsPage.tsx`

원본에 없던 현재 기능:
- 프로젝트 상단 요약 카드
  - 프로젝트 수
  - 페이지 수
  - 진행 페이지 수
  - 주의 필요 페이지 수
- 페이지 담당자 재지정 UI
- 페이지별 `모니터링 진행중` 토글
- 페이지별 `QA 진행중` 토글
- 트래킹 상단 요약 카드
- 트래킹 공통 상태 드롭다운
  - `중지` 포함 상태 집합을 한 컨트롤에 노출
- QA 종료 임박 배지
  - `오늘 종료`
  - `D-n`
  - `지남 n일`
- 현재 통계는 `monitoring_in_progress`, `qa_in_progress` 플래그를 직접 기준으로 동작

### 3. 관리자에 생긴 기능

현재 파일:
- `my-works/apps/ops-web/src/features/admin/reports/AdminReportsPage.tsx`
- `my-works/apps/ops-web/src/features/admin/members/AdminMembersPage.tsx`
- `my-works/apps/ops-web/src/features/admin/admin-client.ts`

원본에 없던 현재 기능:
- 관리자 검색에 `프로젝트` 필터
- 관리자 검색에 `페이지` 필터
- 관리자 검색에 `키워드` 필터
- 관리자 검색 결과 CSV 내보내기
- 사용자 처리 큐
  - `auth_unlinked`
  - `email_mismatch`
  - `role_invalid`
  - `inactive_candidate`
- Auth 연결 상태 표시
- Auth 이메일 표시
- `department` 필드/컬럼
- `전체 사용자 / 처리 대상 / 관리자 수` 요약 카드

### 4. 현재에만 있는 SQL/구조 추가

현재 파일:
- `my-works/supabase/migrations/20260324_000002_admin_phase2.sql`
- `my-works/STATUS.md`

원본에 없던 현재 요소:
- `20260324_000002_admin_phase2.sql`
- 상태 문서에 적힌 구조 변경/제거 선언
  - 업무보고 저장을 `projectId/pageId` 기반 선택 구조로 전환
  - 개인 검색 다운로드 UI 제거
  - 트래킹 화면의 새 항목 흐름 제거
  - 모니터링/QA 통계 기준을 `monitoring_in_progress`, `qa_in_progress`로 재정렬

## 승인된 DB/인증 변경 이후 현재 내부 불일치

현재 파일:
- `my-works/apps/ops-web/src/main.tsx`
- `my-works/apps/ops-web/src/app/AppRouter.tsx`
- `my-works/apps/ops-web/src/features/reports/use-reports-slice.ts`
- `my-works/apps/ops-web/src/features/admin/reports/AdminReportsPage.tsx`
- `my-works/apps/ops-web/src/features/admin/admin-client.ts`
- `my-works/apps/ops-web/src/lib/data-client.ts`
- `my-works/supabase/migrations/000_initial_ops_schema.sql`
- `my-works/supabase/migrations/20260324_000002_admin_phase2.sql`
- `my-works/supabase/functions/export-tasks/index.ts`

결함:
- `QueryClientProvider`가 빠져 있는데 `useQuery`, `useMutation`, `useQueryClient`를 다수 화면에서 사용함
- `members.user_active`를 써야 하는데 일부 현재 코드/SQL은 `is_active`를 기대함
- `task_types` 스키마는 `type1`, `type2`, `display_label` 축인데, 현재 관리자 코드는 `name` 필드를 기대함
- 승인된 DB 변경과 별개로, 현재 구현 내부에서 스키마 기대값이 서로 어긋나 있음

## 요약

현재 `my-works`는 원본 대비 다음 상태다.

- 원본에 있던 화면이 통째로 빠진 축이 있음
  - `profile`
  - `resource/*`
  - `admin/type`
  - `admin/group`
  - 404
- 남아 있는 화면도 세부 기능 누락이 큼
  - 개인 업무보고의 동적 입력/오버헤드/시간 경고/빠른 날짜 이동
  - 개인 검색의 다운로드/정렬/링크/서비스 축
  - 프로젝트의 검색/반기 필터/삭제
  - 트래킹의 핵심 상세 필드
  - 관리자 타입/서비스 관리와 유효성 검증
  - 관리자 사용자 삭제/비밀번호 초기화
  - 관리자 전체검색의 다중 사용자/서비스명/신규 행 추가
- 원본에 없던 기능도 임의 추가돼 있음
  - 자유 검색어/시간 범위 필터
  - 프로젝트/트래킹 요약 카드
  - 진행중 토글
  - 처리 큐/Auth 상태/부서 컬럼
  - CSV 전환 및 2차 SQL 파일 추가

## 추가 확인 2026-03-25 2차

### 원본에 있는데 현재 없어진 것

#### 대시보드
- `linkagelab-a11y-workmanage/front/src/views/DashBoard.vue`의 `내 업무보고 작성현황` 월간 캘린더 위젯(`TblMonthlyResourceByUser`, link-mode) 없음

#### 로그인
- `linkagelab-a11y-workmanage/front/src/views/Login.vue`의 `아이디` 입력 기반 로그인 흐름 없음
- `linkagelab-a11y-workmanage/front/src/views/Login.vue`의 HTTP 상태별 오류 문구 분기(`500/404/401`) 없음
- `php-operation_tool/webapp/login/login.php`의 `clear.php` 재로그인 안내 링크 없음
- `php-operation_tool/webapp/login/login.php`의 로그인 화면 캐릭터 애니메이션 UI 없음

#### 프로필
- `/profile` 화면 없음
- 프로필 화면의 `ID`, `이름` 조회 표 없음
- 프로필 화면의 `비밀번호 변경` 토글 버튼 없음
- 프로필 화면의 `변경할 비밀번호` / `비밀번호 재확인` 동일 여부 실시간 문구 없음
- 프로필 화면의 `변경` / `취소` 버튼 흐름 없음
- 프로필 화면의 비밀번호 변경 확인창(`정말 변경하시겠습니까`) 없음
- 프로필 화면의 비밀번호 변경 후 재로그인 강제 로그아웃 흐름 없음

#### 프로젝트 메인
- `linkagelab-a11y-workmanage/front/src/views/Project.vue`의 상단 탭 구조(`QA`, `모니터링`, `전수조사`, `민원 (외부)`, `컨설팅 (내부)`, `과제`) 없음
- `linkagelab-a11y-workmanage/front/src/views/Project.vue`의 전체폭 전환 버튼 없음
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectModalCreateBtn.vue`의 모달 기반 `생성` 버튼 없음

#### 리소스
- `linkagelab-a11y-workmanage/front/src/views/Resource.vue`의 상단 탭 구조(`요약`, `타입별 요약`, `그룹별 요약`, `월간 리소스`) 없음
- `linkagelab-a11y-workmanage/front/src/views/Resource.vue`의 전체폭 전환 버튼 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`의 이전달 / 다음달 이동 버튼 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`의 `WD`, `총 MM`, `휴무 제외 MM`, `무급휴가 MM` 배지 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`의 `휴가/휴무`, `프로젝트`, `일반(비프로젝트)`, `기타버퍼` 진행률 바 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`의 구성원별 월간 잔여/초과 시간 배지 목록 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`의 `업무타입별 월간 리소스` 표 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`의 `서비스그룹별 월간 리소스` 표 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`의 업무타입/서비스그룹 표 `접기/펼치기` 토글 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceTypeSummary.vue`의 연/월/타입별 `MM` 요약 표 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceTypeSummary.vue`의 연간/월간 합계 행 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceTypeSummary.vue`의 `접기/펼치기` 토글과 플래시 메시지 없음

### 원본에 없는데 현재 생긴 것

#### 대시보드
- `my-works/apps/ops-web/src/features/dashboard/DashboardPage.tsx`의 KPI 카드 3종(`진행중 모니터링`, `진행중 QA`, `누적 업무 수`) 추가
- `my-works/apps/ops-web/src/features/dashboard/DashboardPage.tsx`의 QA 종료예정 `D-day`/`지남 n일` 배지 추가

#### 로그인
- `my-works/apps/ops-web/src/features/auth/LoginPage.tsx`의 `이메일` 입력 기반 로그인 추가
- `my-works/apps/ops-web/src/features/auth/LoginPage.tsx`의 Supabase 환경변수 미설정 안내 박스 추가
- `my-works/apps/ops-web/src/features/auth/LoginPage.tsx`의 환경 미설정 시 필드/버튼 비활성 처리 추가

#### 프로필/비밀번호
- `my-works/apps/ops-web/src/features/settings/UserProfilePage.tsx`의 별도 `/settings/password` 화면 추가
- `my-works/apps/ops-web/src/features/settings/UserProfilePage.tsx`의 `현재 비밀번호` 입력 필드 추가
- `my-works/apps/ops-web/src/features/settings/UserProfilePage.tsx`의 `새 비밀번호`, `비밀번호 확인` Zod 검증 추가
- `my-works/apps/ops-web/src/features/settings/UserProfilePage.tsx`의 화면 내 성공/실패 상태 메시지 추가

#### 프로젝트 메인
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`의 프로젝트 요약 카드(`총 프로젝트`, `총 페이지`, `진행 페이지`, `주의 페이지`) 추가
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`의 단일 화면 프로젝트/페이지 편집기 구조 추가

## 추가 확인 2026-03-25 3차

### 원본에 있는데 현재 없어진 것
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceTop.vue`의 일간 날짜 이전/다음 이동 버튼 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceTop.vue`의 일간 날짜 직접 선택(date input) 없음
- `linkagelab-a11y-workmanage/front/src/components/common/TblYesterdayResource.vue`의 일간 업무일지 작성현황 표 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceTop.vue`의 월간 사용자 선택 드롭다운 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceTop.vue`의 월간 이전달/다음달 이동 버튼 없음
- `linkagelab-a11y-workmanage/front/src/components/common/TblMonthlyResourceByUser.vue`의 월간 달력형 작성현황 표 없음
- `linkagelab-a11y-workmanage/front/src/components/common/TblMonthlyResourceByUser.vue`의 일자 클릭 시 개인 업무보고로 이동하는 링크 모드 없음
- `linkagelab-a11y-workmanage/front/src/components/common/TblMonthlyResourceByUser.vue`의 근무일 480분 기준 잔여/초과 시간 배지(`badge-success`/`badge-warning`/`badge-danger`) 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceSvcSummary.vue`의 서비스 그룹/서비스명별 MM 요약 표 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceSvcSummary.vue`의 월 합계/년 합계 행 없음

### 원본에 없는데 현재 생긴 것
- `my-works/apps/ops-web/src/app/AppRouter.tsx`의 `/stats/qa` 전용 라우트 추가
- `my-works/apps/ops-web/src/app/AppRouter.tsx`의 `/stats/monitoring` 전용 라우트 추가

## 추가 확인 2026-03-25 4차

### 원본에 있는데 현재 없어진 것
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectModalCreate.vue`의 모달형 프로젝트 생성 흐름 없음
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectModalCreate.vue`의 `프로젝트 타입(type1)` 선택 필드 없음
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectModalCreate.vue`의 `프로젝트 세부 타입(type2)` 선택 필드 없음
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectModalCreate.vue`의 `서비스명` 선택 필드 없음
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectModalCreate.vue`의 프로젝트명 3자 이상 검증 문구(`3자 이상 입력하세요`) 없음
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectModalCreate.vue`의 `등록/취소` 버튼이 있는 모달 제출 UX 없음
- `linkagelab-a11y-workmanage/front/src/components/common/TblYesterdayResourceRow.vue`의 평일 `PASS` / `-n분` 상태 표시 규칙 없음
- `linkagelab-a11y-workmanage/front/src/components/common/TblYesterdayResourceRow.vue`의 주말 `badge-warning`, 평일 `badge-danger/badge-success` 색상 규칙 없음

### 원본에 없는데 현재 생긴 것
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`의 프로젝트 생성이 모달이 아닌 좌측 목록 + 우측 폼 편집 방식으로 변경됨
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`의 프로젝트 생성/수정 공용 편집기 구조 추가

## 추가 확인 2026-03-25 5차

### 원본에 있는데 현재 없어진 것
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectQaList.vue` 계열의 분리 탭형 프로젝트 목록(`QA`, `모니터링`, `전수조사`, `민원(외부)`, `컨설팅(내부)`, `과제`) 없음
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectQaList.vue` 계열의 공통 컬럼 `월`, `앱이름`, `리포터`, `시작일/종료일`, `관리` 기반 표 없음
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectQaList.vue`의 `리뷰어`, `Highest`, `High`, `Normal`, `Low` 컬럼 없음
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectMonitoringList.vue`의 `Highest`, `High`, `Normal`, `Low` 컬럼 없음
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectUtList.vue`의 `err` 컬럼 없음
- `linkagelab-a11y-workmanage/front/src/components/project/Project*TblRow.vue` 계열의 행별 삭제 버튼 없음
- `php-operation_tool/webapp/pages/dashboard.php`와 `linkagelab-a11y-workmanage/front/src/views/resource/*.vue` 기준의 월간 MM 요약 배지(`WD`, `총MM`, `휴무 제외 MM`, `무급휴가 MM`)를 보여주는 통계 영역 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`의 월간 비중 progress chart(`휴가/휴무`, `프로젝트`, `일반`, `기타버퍼`) 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`의 구성원별 월간 +/- 분 배지 패널 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`의 보고서 양식용 MM 표 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceTypeSummary.vue`의 연/월별 타입 MM 히스토리 표 없음
- `linkagelab-a11y-workmanage/front/src/views/resource/ResourceSvcSummary.vue`의 연/월별 서비스그룹 MM 히스토리 표 없음
- `php-operation_tool/webapp/pages/dashboard.php`의 모니터링 `내용` 독립 컬럼 없음

### 원본에 없는데 현재 생긴 것
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`의 페이지 편집 폼 필드 `페이지명`, `담당자`, `상태`, `URL`, `메모`, `모니터링 진행중`, `QA 진행중` 추가
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`의 `새 페이지` 버튼 추가
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`의 프로젝트/페이지 행 `선택` 버튼 추가
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`의 프로젝트 저장/페이지 저장 공용 편집기 구조 추가
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`의 프로젝트 목록 `플랫폼 배지`, `보고서 URL 요약`, `페이지 수` 표시 추가
- `my-works/apps/ops-web/src/features/projects/ProjectsFeature.tsx`의 상세 헤더 `리포터`, `검토자`, `시작일`, `종료일` 메타 블록 추가
- `my-works/apps/ops-web/src/features/stats/QaStatsPage.tsx`의 전용 QA 통계 페이지 추가
- `my-works/apps/ops-web/src/features/stats/MonitoringStatsPage.tsx`의 전용 모니터링 통계 페이지 추가
- `my-works/apps/ops-web/src/features/stats/QaStatsPage.tsx`의 QA KPI 카드(`총 진행`, `진행 중`, `진행 완료`) 추가
- `my-works/apps/ops-web/src/features/stats/MonitoringStatsPage.tsx`의 모니터링 KPI 카드(`총 진행`, `전체 수정`, `일부 수정`) 추가
- `my-works/apps/ops-web/src/features/stats/MonitoringStatsPage.tsx`의 모니터링 담당자 컬럼 추가
- `my-works/apps/ops-web/src/features/dashboard/DashboardPage.tsx`와 `MonitoringStatsPage.tsx`의 상태 배지 + 메모 복합 셀 추가

## 추가 확인 2026-03-25 6차

### 원본에 있는데 현재 없어진 것
- `php-operation_tool/webapp/pages/track.php`의 상단 버튼 필터 `파트전체`, `개인전체`, `미개선`, `개선`, `일부` 없음
- `php-operation_tool/webapp/dbcon/track_list.php`의 행별 `수정` 버튼 없음
- `php-operation_tool/webapp/pages/track.php` 기준 `URL`, `아지트공유일`, `아지트URL`, `1차점검일`, `2차점검일`, `3차점검일`, `4차점검일`, `Highest`, `High`, `Normal` 컬럼 없음
- `php-operation_tool/webapp/dbcon/track_edit_select.php` 기준 `아지트공유일`, `아지트URL`, `1~4차 점검일`, `Highest`, `High`, `Normal`, `보고일수` 편집 필드 없음
- `linkagelab-a11y-workmanage/front/src/components/project/ProjectMonitoringList.vue`, `ProjectQaList.vue` 계열의 트래킹 대응 탭 분리(`QA`, `모니터링`) 없음
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminWorkType.vue`의 관리모드/유효성검증모드 전환 없음
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminSvc.vue`의 관리모드/유효성검증모드 전환 없음
- `linkagelab-a11y-workmanage/front/src/components/admin/AdminMemberRow.vue`의 사용자 비밀번호 초기화 버튼 없음
- `linkagelab-a11y-workmanage/front/src/components/admin/AdminMemberRow.vue`의 사용자 삭제 버튼 없음
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminMember.vue`의 신규 사용자 인라인 추가 행 없음
- `linkagelab-a11y-workmanage/front/src/components/admin/AdminMemberRow.vue`의 인라인 사용자 수정 없음
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminWorkTypeManage.vue`의 타입 추가/수정/삭제/저장/취소 없음
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminSvcManage.vue`의 서비스 추가/수정/삭제/저장/취소 없음
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminWorkTypeManage.vue`의 `type1/type2/리소스타입/활성여부/비고` 입력군 없음
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminSvcManage.vue`의 `서비스그룹/서비스명/분류/활성여부` 입력군 없음
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminWorkTypeValid.vue`의 FAIL-PASS 목록, 대상 task 표, 일괄변경 없음
- `linkagelab-a11y-workmanage/front/src/views/admin/AdminSvcValid.vue`의 FAIL-PASS 목록, 대상 task 표, 일괄변경 없음

### 원본에 없는데 현재 생긴 것
- `my-works/apps/ops-web/src/features/tracking/TrackingFeature.tsx`의 행 `선택` 버튼과 우측 상세 패널 구조 추가
- `my-works/apps/ops-web/src/features/tracking/TrackingFeature.tsx`의 상세 헤더 `플랫폼`, `현재 상태`, `수정 시각`, `메모` 표시 추가
- `my-works/apps/ops-web/src/features/tracking/TrackingFeature.tsx`의 편집 필드 `담당자`, 읽기 전용 `프로젝트`, 읽기 전용 `페이지명`, `메모` 중심 편집기 추가
- `my-works/apps/ops-web/src/features/tracking/TrackingFeature.tsx`의 페이지 단위 `모니터링 진행중`, `QA 진행중` 체크박스 추가
- `my-works/apps/ops-web/src/features/tracking/TrackingFeature.tsx`의 요약 카드 `전체`, `개선`, `주의 필요` 추가
- `my-works/apps/ops-web/src/features/admin/reports/AdminReportsPage.tsx`의 전체 업무검색, CSV 내보내기, 업무저장, 업무삭제 추가
- `my-works/apps/ops-web/src/features/admin/reports/AdminReportsPage.tsx`의 업무 편집 입력군 `사용자/작성일/프로젝트/페이지/업무유형1/업무유형2/소요시간/업무내용/비고` 추가
- `my-works/apps/ops-web/src/features/admin/reports/AdminReportsPage.tsx`의 관리자 업무검색 필터 `시작일/종료일/사용자/프로젝트/페이지/업무유형1/업무유형2/서비스그룹/키워드` 추가
- `my-works/apps/ops-web/src/features/admin/members/AdminMembersPage.tsx`의 사용자 상세 편집 필드 `이메일`, `부서`, `활성` 추가
- `my-works/apps/ops-web/src/features/admin/members/AdminMembersPage.tsx`의 `Auth 미연결/이메일 불일치/권한값 점검 필요/비활성 사용자` 처리 큐 추가
- `my-works/apps/ops-web/src/features/admin/members/AdminMembersPage.tsx`의 `Auth User ID`, `Auth 이메일`, `처리 사유` 표시 추가
- `my-works/apps/ops-web/src/features/admin/members/AdminMembersPage.tsx`, `AdminReportsPage.tsx`의 단일 선택 후 우측 상세 패널 편집 구조 추가

## 추가 확인 2026-03-25 7차

### 원본에 있는데 현재 없어진 것
- `php-operation_tool/webapp/pages/report.php`, `linkagelab-a11y-workmanage/front/src/views/personal/ReportPersonal.vue`의 `기본 입력` / `TYPE 입력` 전환 구조 없음
- `php-operation_tool/webapp/pages/report.php`, `js/report.js`의 프로젝트 검색 버튼과 결과 선택 흐름 없음
- `js/report.js`의 프로젝트 선택 후 플랫폼/서비스그룹/서비스명/타입 자동채움 없음
- `php-operation_tool/webapp/pages/report.php`의 `오버헤드` 입력 없음
- `php-operation_tool/webapp/pages/report.php`, `report_personal.php`의 빠른 날짜 이동 버튼(`이전일/다음일/오늘`) 없음
- `php-operation_tool/webapp/pages/report.php`의 시간 경고/누락 시간 안내 패널 없음
- `linkagelab-a11y-workmanage/front/src/views/search/Search.vue`의 명시적 검색 버튼 없음
- `linkagelab-a11y-workmanage/front/src/views/search/Search.vue`의 엑셀 다운로드 버튼 없음
- `components/search/SearchTblSortingBtn.vue` 계열의 정렬 버튼 없음
- `components/search/SearchTblHead.vue` 기준 `플랫폼`, `서비스그룹`, `서비스명`, `링크` 컬럼 없음
- `components/search/SearchTblRow.vue` 기준 행 수정/삭제 버튼 없음

### 원본에 없는데 현재 생긴 것
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`의 `새 보고` 버튼 추가
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`의 초안 `초기화` 버튼 추가
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`의 `업무 내용`과 `메모` 분리 입력 구조 추가
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`의 `projectId/pageId` 강제 단일 선택 구조 추가
- `my-works/apps/ops-web/src/features/search/search-page.tsx`의 자유 검색어 필터 추가
- `my-works/apps/ops-web/src/features/search/search-page.tsx`의 프로젝트 필터, 페이지 필터, 타입1/타입2 필터 추가
- `my-works/apps/ops-web/src/features/search/search-page.tsx`의 최소 시간/최대 시간 필터 추가
- `my-works/apps/ops-web/src/features/search/search-page.tsx`의 필터 초기화 버튼 추가
- `my-works/apps/ops-web/src/features/search/search-page.tsx`의 필터 변경 즉시 재조회 구조 추가
- `my-works/apps/ops-web/src/features/search/search-page.tsx`의 목록 행 선택 후 우측 편집기 로드 구조 추가
- `my-works/apps/ops-web/src/features/search/search-page.tsx`의 삭제 확인 단계 추가

## 추가 확인 2026-03-25 8차

### 원본에 있는데 현재 없어진 것
- `linkagelab-a11y-workmanage/front/src/views/search/Search.vue`의 서비스그룹 필터 + 서비스명 종속 필터 없음
- `linkagelab-a11y-workmanage/front/src/views/search/Search.vue`의 사용자 다중 체크박스 + `전체` 토글 없음
- `linkagelab-a11y-workmanage/front/src/views/search/Search.vue`의 `프로젝트 업무 전체` 특수 옵션 없음
- `linkagelab-a11y-workmanage/front/src/views/search/Search.vue`의 결과 표 하단 `추가` 버튼과 인라인 생성 행 없음
- `linkagelab-a11y-workmanage/front/src/components/personal/ReportPersonalTblRow.vue`, `components/search/SearchTblRow.vue`의 인라인 수정/삭제 없음
- `php-operation_tool/webapp/pages/report_personal.php`, `linkagelab-a11y-workmanage/front/src/views/personal/ReportPersonal.vue`의 개인 보고 목록 `플랫폼`, `서비스그룹`, `서비스명`, `링크`, `관리` 컬럼 없음
- `linkagelab-a11y-workmanage/front/src/views/search/Search.vue`, `components/search/SearchTblHead.vue`의 검색 결과 `#`, `ID`, `플랫폼`, `서비스그룹`, `서비스명`, `URL`, `비고`, `관리` 컬럼 없음

### 원본에 없는데 현재 생긴 것
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`의 보고 편집 `프로젝트 선택` + `페이지 선택` 고정 연결 구조 추가
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`의 독립 `업무 내용` textarea 추가
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`의 목록 행 `선택` 후 우측 편집기 수정 구조 추가
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`의 별도 삭제 확인 패널(`삭제 확정/취소`) 추가
- `my-works/apps/ops-web/src/features/search/search-page.tsx`의 검색 결과 `내용` 컬럼과 `메모 없음` 대체 문구 추가

## 추가 확인 2026-03-25 9차

### 원본에 있는데 현재 없어진 것
- `linkagelab-a11y-workmanage/front/src/views/Report.vue`의 상단 탭 `업무보고` / `기간검색` 분리 구조 없음
- `linkagelab-a11y-workmanage/front/src/views/Report.vue`의 전체폭 전환 버튼 없음
- `linkagelab-a11y-workmanage/front/src/components/personal/PersonalSearchTblRow.vue`의 개인 검색 결과 컬럼 `플랫폼`, `서비스그룹`, `서비스명`, `프로젝트`, `페이지`, `링크`, `시간`, `비고` 전체 표시 없음
- `linkagelab-a11y-workmanage/front/src/components/personal/PersonalSearchTblRow.vue`의 날짜 클릭 시 해당 일자 개인 보고로 이동하는 링크 없음
- `linkagelab-a11y-workmanage/front/src/components/personal/ReportPersonalTblSortingBtn.vue`의 개인 보고 목록 정렬 토글 버튼 없음
- `linkagelab-a11y-workmanage/front/src/components/personal/ReportPersonalTblSortingBtn.vue`의 오름차순/내림차순 전환, 로딩 스피너, 선택 컬럼 강조 없음

### 원본에 없는데 현재 생긴 것
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`와 `search-page.tsx`의 화면 분리형 좌우 레이아웃 추가
- `my-works/apps/ops-web/src/features/reports/reports-page.tsx`의 보고 목록 날짜 버튼 선택형 편집 구조 추가
- `my-works/apps/ops-web/src/features/search/search-page.tsx`의 검색 결과 카드형 요약(`조회 결과 수`, `합계 시간`) 추가
