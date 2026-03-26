# 재작업 정리 2026-03-25

기준 문서:
- [original-vs-my-works-full-audit-2026-03-24.md](/Users/gio.a/Documents/workspace/next/docs/transition/original-vs-my-works-full-audit-2026-03-24.md)
- [original-vs-my-works-full-audit-2026-03-25.md](/Users/gio.a/Documents/workspace/next/docs/transition/original-vs-my-works-full-audit-2026-03-25.md)

원칙:
- 기존 감사 문서는 수정하지 않고 유지한다.
- `스펙아웃`은 재작업 범위에서 제외한다.
- 허용 차이는 `인증체계 변경`, `1차 DB 설계 변경`뿐이다.
- 그 외 차이는 `누락 기능 추가 개발` 또는 `임의 추가 기능 제거`로 정리한다.
- 단, 현재 추가 기능 중 버그 수정 또는 정합성 유지 목적 항목은 별도 예외 문서로 분리한다.

스펙아웃 제외 범위:
- `추천 모니터링`
- `앱 운영정보`
- `알림`
- `admin/agitnoti`
- `manager_*`

## 1. 누락 기능 추가 개발

### 1-1. 프로필 / 사용자 설정
- `/profile` 화면 복원
- 프로필 화면에서 `ID`, `이름` 조회 표 복원
- 프로필 화면 내 `비밀번호 변경` 토글 흐름 복원
- `변경할 비밀번호`, `비밀번호 재확인`, 실시간 일치 문구 복원
- `변경`, `취소`, 변경 확인창, 변경 후 재로그인 흐름 복원
- 원본 기준:
  - [Profile.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/Profile.vue)
  - [userset.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/pages/userset.php)

### 1-2. 개인 업무보고
- `기본 입력` / `TYPE 입력` 전환 복원
- 프로젝트 검색 버튼, 검색 결과 선택 흐름 복원
- 프로젝트 선택 후 플랫폼/서비스그룹/서비스명/타입 자동채움 복원
- 타입별 조건부 입력 필드 복원
- `오버헤드 입력` 복원
- `오늘의 입력시간`, `미입력 시간` 안내 패널 복원
- 빠른 날짜 이동 버튼(`이전일`, `다음일`, `오늘`) 복원
- 원본 기준:
  - [report.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/pages/report.php)
  - [report.js](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/js/report.js)
  - [ReportPersonal.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/personal/ReportPersonal.vue)
  - [ReportPersonalCreate.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/personal/ReportPersonalCreate.vue)

### 1-3. 개인 검색
- 명시적 검색 버튼 복원
- 서비스그룹 필터 + 서비스명 종속 필터 복원
- 사용자 다중 체크박스 + `전체` 토글 복원
- `프로젝트 업무 전체` 특수 옵션 복원
- 다운로드 버튼 복원
- 정렬 버튼 복원
- 검색 결과 컬럼 복원:
  - `#`
  - `ID`
  - `플랫폼`
  - `서비스그룹`
  - `서비스명`
  - `URL`
  - `비고`
  - `관리`
- 결과 표 하단 `추가` 버튼과 인라인 생성 행 복원
- 인라인 수정/삭제 복원
- 개인 검색 행의 날짜 클릭 이동 링크 복원
- 원본 기준:
  - [report_personal.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/pages/report_personal.php)
  - [Search.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/search/Search.vue)
  - [SearchTblHead.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/search/SearchTblHead.vue)
  - [SearchTblRow.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/search/SearchTblRow.vue)
  - [SearchTblSortingBtn.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/search/SearchTblSortingBtn.vue)
  - [PersonalSearchTblRow.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/personal/PersonalSearchTblRow.vue)
  - [ReportPersonalTblSortingBtn.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/personal/ReportPersonalTblSortingBtn.vue)

### 1-4. 프로젝트
- 상단 탭 구조 복원:
  - `QA`
  - `모니터링`
  - `전수조사`
  - `민원 (외부)`
  - `컨설팅 (내부)`
  - `과제`
- 전체폭 전환 버튼 복원
- 모달 기반 `생성` 버튼과 생성 모달 흐름 복원
- 생성 필드 복원:
  - `프로젝트 타입(type1)`
  - `프로젝트 세부 타입(type2)`
  - `서비스그룹`
  - `서비스명`
  - 프로젝트명 3자 이상 검증
- 탭별 표 컬럼 복원:
  - 공통 `월`, `앱이름`, `리포터`, `시작일/종료일`, `관리`
  - QA `리뷰어`, `Highest`, `High`, `Normal`, `Low`
  - 모니터링 `Highest`, `High`, `Normal`, `Low`
  - 전수조사 `err`
- 행별 삭제 버튼 복원
- 원본 기준:
  - [Project.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/Project.vue)
  - [ProjectModalCreate.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/project/ProjectModalCreate.vue)
  - [ProjectQaList.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/project/ProjectQaList.vue)
  - [ProjectMonitoringList.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/project/ProjectMonitoringList.vue)
  - [ProjectUtList.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/project/ProjectUtList.vue)
  - [ProjectCsList.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/project/ProjectCsList.vue)
  - [ProjectConsultingList.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/project/ProjectConsultingList.vue)
  - [ProjectTaskList.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/project/ProjectTaskList.vue)

### 1-5. 트래킹
- 상단 버튼 필터 복원:
  - `파트전체`
  - `개인전체`
  - `미개선`
  - `개선`
  - `일부`
- 행별 `수정` 흐름 복원
- 컬럼 복원:
  - `URL`
  - `아지트공유일`
  - `아지트URL`
  - `1차점검일`
  - `2차점검일`
  - `3차점검일`
  - `4차점검일`
  - `Highest`
  - `High`
  - `Normal`
- 편집 필드 복원:
  - `아지트공유일`
  - `아지트URL`
  - `1~4차 점검일`
  - `Highest`
  - `High`
  - `Normal`
  - `보고일수`
- 원본 기준:
  - [track.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/pages/track.php)
  - [track.js](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/js/track.js)
  - [track_list.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/dbcon/track_list.php)
  - [track_edit_select.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/dbcon/track_edit_select.php)
  - [track_edit_save.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/dbcon/track_edit_save.php)

### 1-6. 통계
- QA 통계 원본의 월별 차트 복원
- QA 통계 원본의 월별 표 복원
- QA 통계 원본의 하단 상세 목록 복원
- 모니터링 통계 원본의 월별 차트 복원
- 모니터링 통계 원본의 월별 표 복원
- 모니터링 통계 원본의 하단 상세 목록 복원
- 모니터링 통계의 `내용` 독립 컬럼 복원
- 원본 기준:
  - [stati_qa.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/pages/stati_qa.php)
  - [stati_mo.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/pages/stati_mo.php)

### 1-7. 리소스
- `/resource` 상단 탭 구조 복원:
  - `요약`
  - `타입별 요약`
  - `그룹별 요약`
  - `월간 리소스`
- 전체폭 전환 버튼 복원
- 일간 날짜 이전/다음 이동 복원
- 일간 날짜 직접 선택 복원
- 일간 업무일지 작성현황 표 복원
- 월간 사용자 선택 복원
- 월간 이전달/다음달 이동 복원
- 월간 달력형 작성현황 표 복원
- 일자 클릭 시 개인 업무보고 이동 링크 복원
- 근무일 480분 기준 잔여/초과 시간 배지 복원
- 월간 상단 배지 복원:
  - `WD`
  - `총 MM`
  - `휴무 제외 MM`
  - `무급휴가 MM`
- 월간 비중 progress chart 복원:
  - `휴가/휴무`
  - `프로젝트`
  - `일반`
  - `기타버퍼`
- 구성원별 월간 +/- 분 배지 패널 복원
- `업무타입별 월간 리소스` 표 복원
- `서비스그룹별 월간 리소스` 표 복원
- 타입/서비스그룹 표의 `접기/펼치기` 복원
- `연/월별 타입 MM 히스토리 표` 복원
- `연/월별 서비스그룹 MM 히스토리 표` 복원
- 원본 기준:
  - [Resource.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/Resource.vue)
  - [ResourceTop.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/resource/ResourceTop.vue)
  - [ResourceMonthly.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue)
  - [ResourceTypeSummary.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/resource/ResourceTypeSummary.vue)
  - [ResourceSvcSummary.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/resource/ResourceSvcSummary.vue)
  - [TblYesterdayResource.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/common/TblYesterdayResource.vue)
  - [TblYesterdayResourceRow.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/common/TblYesterdayResourceRow.vue)
  - [TblMonthlyResourceByUser.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/common/TblMonthlyResourceByUser.vue)

### 1-8. 관리자
- 관리자 상단 탭 구조 정리
- `업무 타입` 관리모드 / 유효성검증모드 복원
- `서비스 그룹` 관리모드 / 유효성검증모드 복원
- 사용자 신규행 인라인 추가 복원
- 사용자 인라인 수정 복원
- 사용자 비밀번호 초기화 복원
- 사용자 삭제 복원
- 타입 추가/수정/삭제/저장/취소 복원
- 서비스 추가/수정/삭제/저장/취소 복원
- 타입 관리 입력군 복원:
  - `type1`
  - `type2`
  - `리소스타입`
  - `활성여부`
  - `비고`
- 서비스 관리 입력군 복원:
  - `서비스그룹`
  - `서비스명`
  - `분류`
  - `활성여부`
- 타입 FAIL-PASS 목록, 대상 task 표, 일괄변경 복원
- 서비스 FAIL-PASS 목록, 대상 task 표, 일괄변경 복원
- 관리자 전체업무검색 원본 기능 복원:
  - 빠른 날짜 이동
  - 서비스명 필터
  - 사용자 다중 선택
  - `프로젝트 업무 전체` 옵션
  - 신규 행 추가
- 원본 기준:
  - [Admin.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/Admin.vue)
  - [AdminMember.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/admin/AdminMember.vue)
  - [AdminMemberRow.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/components/admin/AdminMemberRow.vue)
  - [AdminWorkType.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/admin/AdminWorkType.vue)
  - [AdminWorkTypeManage.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/admin/AdminWorkTypeManage.vue)
  - [AdminWorkTypeValid.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/admin/AdminWorkTypeValid.vue)
  - [AdminSvc.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/admin/AdminSvc.vue)
  - [AdminSvcManage.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/admin/AdminSvcManage.vue)
  - [AdminSvcValid.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/admin/AdminSvcValid.vue)
  - [allreport.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/pages/allreport.php)
  - [members.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/pages/members.php)
  - [new_member.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/pages/new_member.php)
  - [type.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/pages/type.php)
  - [service_group.php](/Users/gio.a/Documents/workspace/next/php-operation_tool/webapp/pages/service_group.php)

### 1-9. 공통 화면
- `보고` 상단 탭 `업무보고 / 기간검색` 분리 구조 복원
- `보고` 화면 전체폭 전환 버튼 복원
- 404 화면 복원
- 원본 기준:
  - [Report.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/Report.vue)
  - [NotFound.vue](/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage/front/src/views/NotFound.vue)

## 2. 임의 추가 기능 제거

### 2-1. 대시보드
- KPI 카드 3종 제거
  - `진행중 모니터링`
  - `진행중 QA`
  - `누적 업무 수`
- QA 종료예정 `D-day/오늘 종료/지남 n일` 배지 제거
- 모니터링 상태 배지 + 메모 복합 셀 제거

### 2-2. 개인 업무보고 / 검색
- 자유 검색어 필터 제거
- 검색용 `프로젝트` 필터 제거
- 검색용 `페이지` 필터 제거
- `최소 시간`, `최대 시간` 필터 제거
- 필터 초기화 버튼 제거
- 필터 변경 즉시 재조회 구조 제거
- 목록 행 `선택` 후 우측 편집기 구조 제거
- 별도 삭제 확인 패널 제거
- 검색 결과 카드형 요약 제거
  - `조회 결과 수`
  - `합계 시간`

### 2-3. 프로젝트
- 현재 단일 화면 프로젝트/페이지 편집기 구조 제거
- 프로젝트 요약 카드 제거
  - `총 프로젝트`
  - `총 페이지`
  - `진행 페이지`
  - `주의 페이지`
- 프로젝트 목록의 `플랫폼 배지`, `보고서 URL 요약`, `페이지 수` 표시 제거
- 상세 헤더 `리포터`, `검토자`, `시작일`, `종료일` 메타 블록 제거
- `새 페이지` 버튼 제거
- 프로젝트/페이지 행 `선택` 버튼 제거

### 2-4. 트래킹
- 행 `선택` 버튼 + 우측 상세 패널 구조 제거
- 상세 헤더 `플랫폼`, `현재 상태`, `수정 시각`, `메모` 표시 제거
- 요약 카드 제거
  - `전체`
  - `개선`
  - `주의 필요`

### 2-5. 관리자
- 관리자 업무검색의 현재 추가 필터 제거:
  - `프로젝트`
  - `페이지`
  - `키워드`
- 사용자 상세의 `department` 필드 제거

## 3. 허용된 변경이지만 현재 정합성 수정이 필요한 항목

### 3-1. DB 설계 변경 반영 누락
- `members.user_active` 기준으로 통일하고 `is_active` 사용 제거
- `task_types` 조회를 현재 스키마(`type1`, `type2`, `display_label`) 기준으로 정리

### 3-2. 런타임 정합성
- React Query 사용 화면 기준 `QueryClientProvider` 누락 수정

## 4. 우선순위

### P0
- `QueryClientProvider` 복구
- `members.user_active` / `is_active` 불일치 수정
- `task_types` 조회 코드와 실제 스키마 불일치 수정

### P1
- 개인 업무보고
- 개인 검색
- 프로젝트
- 트래킹
- 관리자 타입/서비스/회원
- 관리자 전체업무검색

### P2
- 리소스
- 프로필
- 보고 래퍼 / 404
- QA 통계 / 모니터링 통계 표·차트 상세
