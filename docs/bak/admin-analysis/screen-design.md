# 화면 설계서

## 1. 화면 분류 기준

이 시스템의 화면은 다음 5종류로 나뉩니다.

1. 로그인 전 인증 화면
2. 로그인 후 공통 셸 화면
3. 업무/검색 화면
4. 리소스/관리 화면
5. 비활성 또는 스펙아웃 화면

## 2. 공통 화면 구조

### 2.1 로그인 전

| 화면 ID | 파일 | 라우트 | 목적 | 주요 요소 |
| --- | --- | --- | --- | --- |
| `LOGIN` | `front/src/views/Login.vue` | `/login` | 사용자 인증 | ID, 비밀번호, 오류 메시지, 로그인 버튼 |

### 2.2 로그인 후 공통 셸

| 화면 ID | 파일 | 목적 | 주요 요소 |
| --- | --- | --- | --- |
| `APP_SHELL` | `front/src/components/AppNav.vue` | 공통 상단 네비게이션 | 홈/보고/리소스/검색/관리/프로필/로그아웃 |
| `SKIP_NAV` | `front/src/components/SkipNav.vue` | 접근성 보조 | 본문 바로가기 링크 |

## 3. 주 메뉴 화면

### 3.1 Dashboard

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `DASHBOARD` |
| 파일 | `front/src/views/DashBoard.vue` |
| 라우트 | `/` |
| 목적 | 본인 월간 업무보고 작성현황 확인 |
| 주요 컴포넌트 | `TblMonthlyResourceByUser` |
| 주요 데이터 소스 | `GET /api/v1/aw/search/summary/:year/:month/:id` |

해석 메모:

- 현재 Dashboard는 요약 KPI보다 `월간 작성 캘린더`에 가깝습니다.
- PHP 버전의 추천 모니터링/진행 목록 성격과는 다릅니다.

### 3.2 프로필

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `PROFILE` |
| 파일 | `front/src/views/Profile.vue` |
| 라우트 | `/profile` |
| 목적 | 사용자 정보 조회, 비밀번호 변경 |
| 주요 데이터 소스 | `GET /api/v1/member/:id`, `PUT /api/v1/member/:id/password` |

### 3.3 보고 > 업무보고

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `REPORT_PERSONAL` |
| 파일 | `front/src/views/personal/ReportPersonal.vue` |
| 라우트 | `/report/personal/:type?` |
| 목적 | 본인 일일 업무 입력/수정/삭제 |
| 주요 컴포넌트 | `ReportPersonalCreate`, `ReportPersonalTblRow`, `ReportPersonalTblSortingBtn` |
| 주요 데이터 소스 | `GET /api/v1/aw/search/work/:id/:date`, `PUT /api/v1/aw/work`, `POST /api/v1/aw/work/:taskNum`, `DELETE /api/v1/aw/work/:taskNum` |

상세 UX 특징:

- 날짜 좌우 이동과 임의 날짜 이동을 지원합니다.
- 합계 시간이 480분보다 적으면 `오버헤드 입력` 버튼으로 `기타버퍼/오버헤드` 항목을 자동 생성합니다.
- type 선택 결과에 따라 입력 폼이 달라집니다.
  - `type_include_svc = 1`이면 프로젝트/서비스 관련 필드가 활성화됩니다.
  - `모니터링 > 이슈탐색`은 서비스/페이지 직접 입력형입니다.
  - 그 외 프로젝트성 업무는 `프로젝트 검색 -> 프로젝트 선택` 흐름을 사용합니다.

### 3.4 보고 > 기간검색

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `REPORT_SEARCH_PERSONAL` |
| 파일 | `front/src/views/personal/ReportSearch.vue` |
| 라우트 | `/report/search` |
| 목적 | 본인 기간 검색 및 엑셀 다운로드 |
| 주요 컴포넌트 | `PersonalSearchTblRow`, `SearchTblSortingBtn`, `FlashMsg` |
| 주요 데이터 소스 | `POST /api/v1/aw/search/work`, `POST /api/v1/aw/xls/work` |

### 3.5 검색

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `SEARCH_ALL` |
| 파일 | `front/src/views/search/Search.vue` |
| 라우트 | `/search` |
| 목적 | 전체 업무 검색, 인라인 수정/삭제, 신규 행 추가, 엑셀 다운로드 |
| 주요 컴포넌트 | `SearchTblHead`, `SearchTblRow`, `FlashMsg` |
| 주요 데이터 소스 | `GET/POST /api/v1/aw/search/work`, `PUT/POST/DELETE /api/v1/aw/work`, `POST /api/v1/aw/xls/work` |

상세 UX 특징:

- 기간, type, 서비스그룹, 서비스명, 사용자 다중 선택 필터를 가집니다.
- 검색 결과 행 단위 수정/삭제를 지원합니다.
- 신규 행 추가는 raw field 기반이라 개인 업무보고 화면보다 더 관리자용에 가깝습니다.

## 4. 리소스 화면

### 4.1 리소스 > 요약

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `RESOURCE_TOP` |
| 파일 | `front/src/views/resource/ResourceTop.vue` |
| 라우트 | `/resource/summary` |
| 목적 | 일간 작성현황과 월간 개인 캘린더를 한 화면에서 확인 |
| 주요 컴포넌트 | `TblYesterdayResource`, `TblMonthlyResourceByUser` |
| 주요 데이터 소스 | `GET /api/v1/aw/admin/valid/time/:date?`, `GET /api/v1/aw/search/summary/:year/:month/:id`, `GET /api/v1/member?a=1` |

### 4.2 리소스 > 월간 리소스

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `RESOURCE_MONTHLY` |
| 파일 | `front/src/views/resource/ResourceMonthly.vue` |
| 라우트 | `/resource/month/:type?` |
| 목적 | 특정 월의 type 기준, 서비스 기준, 개인 기준 MM 집계 상세 조회 |
| 주요 데이터 소스 | `GET /api/v1/aw/report/resource/month/:year/:month`, `GET /api/v1/aw/report/resource/user/:year/:month` |

상세 UX 특징:

- 영업일 수 기준 MM 계산
- 휴무/무급휴가/기타버퍼/프로젝트/비프로젝트 비중 표시
- 타입별 표 접기/펼치기
- 서비스그룹별 표 접기/펼치기
- 월간 보고서 양식용 요약표 별도 제공

### 4.3 리소스 > 타입별 요약

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `RESOURCE_TYPE_SUMMARY` |
| 파일 | `front/src/views/resource/ResourceTypeSummary.vue` |
| 라우트 | `/resource/type` |
| 목적 | 연월별 type 기준 MM 누적 요약 |
| 주요 데이터 소스 | `GET /api/v1/aw/report/resource/summary` |

### 4.4 리소스 > 그룹별 요약

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `RESOURCE_SVC_SUMMARY` |
| 파일 | `front/src/views/resource/ResourceSvcSummary.vue` |
| 라우트 | `/resource/svc` |
| 목적 | 연월별 서비스 그룹 기준 MM 누적 요약 |
| 주요 데이터 소스 | `GET /api/v1/aw/report/resource/svc` |

## 5. 관리 화면

### 5.1 관리 > 요약

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `ADMIN_TOP` |
| 파일 | `front/src/views/admin/AdminTop.vue` |
| 라우트 | `/admin/summary` |
| 목적 | 현재는 실질 기능 없는 placeholder |

### 5.2 관리 > 업무 타입

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `ADMIN_WORKTYPE` |
| 파일 | `front/src/views/admin/AdminWorkType.vue` |
| 라우트 | `/admin/type` |
| 목적 | `TASK_TBL` 기준 type 정합성 보정 |
| 하위 모드 | `AdminWorkTypeManage`, `AdminWorkTypeValid` |

#### 관리모드

- 신규 type 추가
- 기존 type 수정/비활성/삭제
- `type_include_svc`, `type_etc`, `type_active` 관리

#### 유효성검증모드

- `TASK_TBL`에 존재하지만 `TYPE_TBL`에 없는 조합을 검출
- 대상 업무 리스트 조회
- 새 type으로 bulk 치환

### 5.3 관리 > 서비스 그룹

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `ADMIN_SVC` |
| 파일 | `front/src/views/admin/AdminSvc.vue` |
| 라우트 | `/admin/group` |
| 목적 | `SVC_GROUP_TBL` 관리와 `TASK_TBL` 정합성 보정 |
| 하위 모드 | `AdminSvcManage`, `AdminSvcValid` |

### 5.4 관리 > 사용자

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `ADMIN_MEMBER` |
| 파일 | `front/src/views/admin/AdminMember.vue` |
| 라우트 | `/admin/member` |
| 목적 | 사용자 추가/수정/삭제, 비밀번호 초기화 |
| 주요 컴포넌트 | `AdminMemberRow` |
| 주요 데이터 소스 | `GET/PUT/POST/DELETE /api/v1/member*` |

### 5.5 관리 > 아지트QA알리미

| 항목 | 내용 |
| --- | --- |
| 화면 ID | `ADMIN_AGIT_NOTI` |
| 파일 | `front/src/views/admin/AdminAgitNoti.vue` |
| 라우트 | `/admin/agitnoti` |
| 목적 | 옵션 수정 + 로그 페이징 조회 |
| 현재 해석 | 코드상 존재하지만 현재 스펙아웃 |

## 6. 비활성/숨김 화면

| 화면 ID | 파일 | 목적 | 현재 상태 |
| --- | --- | --- | --- |
| `PROJECT_VIEW` | `front/src/views/Project.vue` | 프로젝트 목록/생성 | 라우터 주석 처리 |
| `PROJECT_QA` | `front/src/components/project/ProjectQaList.vue` | QA 프로젝트 목록 | 비활성 |
| `PROJECT_MONITORING` | `front/src/components/project/ProjectMonitoringList.vue` | 모니터링 프로젝트 목록 | 비활성 |
| `PROJECT_UT` | `front/src/components/project/ProjectUtList.vue` | 전수조사 프로젝트 목록 | 비활성 |
| `PROJECT_CS` | `front/src/components/project/ProjectCsList.vue` | 민원 프로젝트 목록 | 비활성 |
| `PROJECT_CONSULTING` | `front/src/components/project/ProjectConsultingList.vue` | 내부 컨설팅 목록 | 비활성 |
| `PROJECT_TASK` | `front/src/components/project/ProjectTaskList.vue` | 과제 목록 | 비활성 |

## 7. 설계 메모

- 이 저장소의 핵심 화면은 `업무 입력 화면`보다 `정합성 보정/집계/검색`에 더 무게가 있습니다.
- `개인 업무보고`와 `전체 검색`은 같은 `TASK_TBL`을 다루지만 UI 수준과 권한 수준이 다릅니다.
- 프로젝트 화면은 2차 개발에서 별도 판단하지 않으면 문서만 믿고 복원하기 어렵습니다.
- 아지트 QA알리미는 현재 스펙아웃이므로 화면 복원 대상에서 제외해야 합니다.
