# API 명세서

## 1. 전제

- 본 문서의 "API"는 REST/JSON API가 아니라 `dbcon/*.php`, `login/*.php` 엔드포인트를 의미합니다.
- 응답 형식은 JSON보다 HTML fragment, `<script>` 응답, 파일 다운로드가 많습니다.
- `pages/*.php`는 화면 엔드포인트이고, `dbcon/*.php`는 화면 내부 데이터/행동 엔드포인트입니다.

## 2. 응답 형식 분류

| 형식 | 설명 | 예시 |
| --- | --- | --- |
| HTML table rows | `<tr>` 목록 반환 | `day_report_list.php`, `track_list.php` |
| HTML options | `<option>` 목록 반환 | `type_type1.php`, `pj_page_tran.php` |
| HTML form fragment | `<input>`, `<select>` 일부 반환 | `report_edit_select.php`, `track_edit_select.php` |
| Value/Text | 단일 문자열 반환 | `pj_sv_tran.php`, `search_date_check.php` |
| Script response | `alert()` 후 화면 재로딩 스크립트 | `pj_add.php`, `updateuser.php` |
| Download | 첨부 파일 응답 | `report_search_export.php` |

## 3. View 엔드포인트

| 엔드포인트 | Method | 역할 |
| --- | --- | --- |
| `/webapp/login/login.php` | GET | 로그인 화면 |
| `/webapp/index.php` | GET | 로그인 후 공통 셸 |
| `/webapp/pages/dashboard.php` | GET | 대시보드 |
| `/webapp/pages/report.php` | GET | 업무보고 |
| `/webapp/pages/project.php` | GET | 프로젝트 관리 |
| `/webapp/pages/track.php` | GET | 트래킹 |
| `/webapp/pages/appinfo.php` | GET | 앱 운영정보 |
| `/webapp/pages/report_personal.php` | GET | 개인 업무 검색 |
| `/webapp/pages/stati_qa.php` | GET | QA 통계 |
| `/webapp/pages/stati_mo.php` | GET | 모니터링 통계 |
| `/webapp/pages/userset.php` | GET | 개인정보 수정 |

## 4. 인증/세션

| 엔드포인트 | Method | 호출부 | 파라미터 | 응답 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `login/user_check.php` | POST | 로그인 폼 | `id`, `pw` | `meta refresh` 또는 alert | 사용자 인증, 세션 생성 |
| `login/clear.php` | GET | 로그아웃 링크 | - | `meta refresh` | 세션 파기 |
| `login/sessioncount.php` | POST/내부 include | `user_check.php` | `submit` | alert/script | 세션 타임아웃 흔적, 현재 직접 호출 거의 없음 |
| `dbcon/updateuser.php` | POST | `pages/userset.php` | `oldpwd`, `newpwd`, `pwdcheck` | alert/script | 비밀번호 변경 |
| `dbcon/user_id_checker.php` | 내부 include | 로그인/비밀번호 변경 | 내부 변수 `id` 사용 | DB row | 사용자 조회 공용 스니펫 |

## 5. 업무보고 도메인

| 엔드포인트 | Method | 호출부 | 파라미터 | 응답 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `dbcon/day_report_list.php` | GET | `report.js` | `date`, `ecount`, `start`, `end` | `<tr>` 목록 | 본인 업무 리스트 조회 |
| `dbcon/search_date_check.php` | GET | `report.js`, `manager.js` | `date`, `ecount`, `ecountch` | 날짜 문자열 | 이전일/다음일/오늘 계산 |
| `dbcon/check_used_time.php` | GET/include | `report.php`, `report.js` | 세션 | 문장 문자열 | 오늘 누적 시간 계산 |
| `dbcon/day_report_time_check.php` | GET/include | `report.php`, `report.js` | 세션 | `<p>` 목록 | 최근 미입력/과소/초과 시간 계산 |
| `dbcon/report_pj_select.php` | GET/include | `report.php`, `report.js` | `searchword` | `<option>` 목록 | TYPE 입력용 프로젝트 검색 |
| `dbcon/report_pj_select_type.php` | GET | `pj_report()` | `pj_num` | 문자열 | 선택 프로젝트의 타입1 반환 |
| `dbcon/report_pj_select_plat.php` | POST | `pj_report()` | `pj_num` | 문자열 | 선택 프로젝트의 플랫폼 반환 |
| `dbcon/report_add.php` | POST | `report.js` | `allofthem`, `them_del`, `task_*`, `pj_serv` | `<tr>` 목록 + alert | 업무 등록 |
| `dbcon/report_edit_select.php` | POST | `report_edit_to()` | `task_num`, `ecount` | form fragment | 수정용 셀 편집 UI 생성 |
| `dbcon/report_edit.php` | POST | `report_edit()` | `task_date`, `task_type2`, `task_usedtime`, `task_etc`, `task_num_edit`, `today`, `start_date`, `end_date` | `<tr>` 목록 | 업무 수정 후 리스트 재생성 |
| `dbcon/report_del.php` | POST | `reportdelcon()` | `task_num`, `today`, `s_date`, `e_date` | `<tr>` 목록 | 업무 삭제 후 리스트 재생성 |
| `dbcon/report_overhead.php` | POST | `listoverhead()` | `date`, `task_usedtime` | alert/script | 오버헤드 입력 |
| `dbcon/all_report_info.php` | GET/include | 일부 레거시 재조회 | - | HTML | 전체 보고 정보 요약 흔적 |
| `dbcon/report_search.php` | POST | `pages/report_personal.php` | `start`, `end` | `<tr>` 목록 | 본인 업무 기간 검색 |
| `dbcon/report_search_export.php` | GET | `pages/report_personal.php` | `start`, `end` | HTML file download | 본인 업무 다운로드 |
| `dbcon/report_search_all.php` | POST | `pages/allreport.php` | `start`, `end`, `id` | `<tr>` 목록 | 전체/사용자별 업무 검색 |
| `dbcon/report_search_export_all.php` | GET | `pages/allreport.php` | `start`, `end`, `id` | HTML file download | 전체/사용자별 다운로드 |
| `dbcon/daytimecheck.php` | POST | 호출처 직접 확인 못함 | `case`, `s_date`, `e_date` | `<tr>` 목록 | 레거시 일자별 점검 조회 |
| `dbcon/report_time_check_month.php` | GET/include | 직접 호출처 미확인 | 세션 | HTML | 월간 시간 집계 흔적 |

## 6. 프로젝트/페이지/트래킹 도메인

| 엔드포인트 | Method | 호출부 | 파라미터 | 응답 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `dbcon/pj_select.php` | GET/include | `pages/project.php` | - | `<tr>` 목록 | 기본 프로젝트 리스트 |
| `dbcon/pj_search.php` | POST | `project.js` | `pj_name`, `ecount` | `<tr>` 목록 | 검색/반기 필터 조회 |
| `dbcon/pj_add.php` | POST | `project.js` | `pj_group_type1`, `pj_platform`, `pj_sev_group`, `pj_name`, `pj_page_report_url`, `pj_reporter`, `pj_reviewer`, `pj_start_date`, `pj_end_date` | alert/script | 프로젝트 등록 |
| `dbcon/pj_edit.php` | POST | `head.php` 내 버튼 핸들러 | `pj_group_type1`, `pj_platform`, `pj_name`, `pj_page_report_url`, `pj_start_date`, `pj_end_date`, `pj_sev_group`, `pj_num` | alert/script | 프로젝트 수정, TASK 동기화 |
| `dbcon/pj_del.php` | POST | `project.js` | `pj_num` | alert/script | 프로젝트 삭제 |
| `dbcon/pj_page.php` | POST | `editPj()` | `pj_num` | form fragment | 프로젝트 수정 폼 생성 |
| `dbcon/pj_page_select.php` | POST | `pagePj()` | `pj_num` | `<li>` 목록 | 프로젝트 페이지 목록 |
| `dbcon/pj_page_add.php` | POST | `pjPageAdd()` | `pj_unique_num`, `pj_page_name`, `pj_page_url`, `pj_type` | alert/script | 프로젝트 페이지 추가 |
| `dbcon/pj_page_edit.php` | POST | `pjPageEdit()` | `pj_page_num`, `pj_page_name`, `pj_page_url` | alert/script | 프로젝트 페이지 수정, TASK 동기화 |
| `dbcon/pj_page_del.php` | POST | `pjPagedel()` | `pj_page_num` | alert/script | 프로젝트 페이지 삭제 |
| `dbcon/pj_page_tran.php` | POST | `typeCall.js` | `pj_num` | `<option>` 목록 | 프로젝트 페이지 셀렉트 박스 |
| `dbcon/page_url_tran.php` | POST | `pjpage_pageurl()` | `pj_name`, `pj_page` | 문자열 | 페이지 URL 자동 입력 |
| `dbcon/pj_sv_tran.php` | POST | `pj_report()`, `pjname_pjpage()` | `pj_num` | 문자열 | 서비스명 자동 입력 |
| `dbcon/pj_sv_g_tran.php` | POST | `pj_report()`, `pjname_pjpage()` | `pj_num` | 문자열 | 서비스그룹 자동 입력 |
| `dbcon/pj_url_tran.php` | POST | `type_pjpage()`, `pjname_pjpage()` | `pj_num` | 문자열 | 프로젝트 보고서 URL 자동 입력 |
| `dbcon/plat_pj_tran.php` | POST | `type_pjname()` | `pj_platform`, `pj_group_type1` | `<option>` 목록 | 타입/플랫폼 기반 프로젝트 목록 |
| `dbcon/track_list.php` | GET | `track_search()` | `num` | `<tr>` 목록 | 트래킹 목록 조회 |
| `dbcon/track_edit_select.php` | POST | `track_edit()` | `pj_page_num`, `ecount` | form fragment | 트래킹 행 편집 UI 생성 |
| `dbcon/track_edit_save.php` | POST | `track_save()` | `agit`, `agiturl`, `track1..4`, `trackend`, `tracketc`, `trackhighest`, `trackhigh`, `tracknormal`, `trackreport`, `pj_page_num` | 빈 응답/에러 | 트래킹 저장, PJ 종료일 보정 |

## 7. 통계/대시보드

| 엔드포인트 | Method | 호출부 | 파라미터 | 응답 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `dbcon/recommandmoni.php` | GET/include | `pages/dashboard.php` | 내부 변수 `plat` | `<tr>` 목록 | 추천 모니터링 후보 조회 |
| `dbcon/month_moni_list.php` | GET/include | `dashboard.php`, `track_info_mo.php` | 내부 변수 | `<tr>` 목록 | 월별/진행중 모니터링 목록 |
| `dbcon/month_moni_mouse_over.php` | POST | `mouseovermonth()` | `listnum` | HTML | 모니터링 hover 팝업 |
| `dbcon/month_qa_list.php` | GET/include | `dashboard.php` | 내부 변수 | `<tr>` 목록 | 진행중/월별 QA 목록 |
| `dbcon/track_info_mo.php` | GET/include | `pages/stati_mo.php` | 내부 변수 `div` | 차트 데이터/표/리스트 | 모니터링 통계 |
| `dbcon/track_info_qa.php` | GET/include | `pages/stati_qa.php` | 내부 변수 `div` | 차트 데이터/표/리스트 | QA 통계 |

## 8. 기준정보/계정/앱정보/알림

| 엔드포인트 | Method | 호출부 | 파라미터 | 응답 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `dbcon/type_type1.php` | GET/include | `report.php` | - | `<option>` 목록 | 타입1 목록 |
| `dbcon/type_type2.php` | POST | `typeCall()` | `type_one`, `checknum` | `<option>` 목록 | 타입2 목록 |
| `dbcon/type_add.php` | POST | `pages/type.php` | `type_one`, `type_two` | alert/script | 타입 추가 |
| `dbcon/type_edit.php` | POST | `pages/type.php` | `type_num`, `type1_name`, `type2_name`, `type_etc` | alert/script | 타입 수정 |
| `dbcon/type_del.php` | POST | `pages/type.php` | `type_num` | alert/script | 타입 삭제 |
| `dbcon/sv_group_select.php` | GET/include | `project.php`, `service_group.php` | - | `<option>` 또는 HTML | 서비스 그룹 목록 |
| `dbcon/sv_group_add.php` | POST | `pages/service_group.php` | `svc_group`, `svc_name` | alert/script | 서비스 그룹 추가 |
| `dbcon/sv_group_edit.php` | POST | `pages/service_group.php` | `svc_num`, `svc_group`, `svc_name` | alert/script | 서비스 그룹 수정 |
| `dbcon/sv_group_del.php` | POST | `pages/service_group.php` | `svc_num` | alert/script | 서비스 그룹 삭제 |
| `dbcon/member_select.php` | GET/include | `project.php`, `allreport.php` | - | `<option>` 목록 | 활성 사용자 목록 |
| `dbcon/id_insert.php` | POST | `pages/members.php`, `pages/new_member.php` | `createid`, `createname`, `createlevel` | alert/script | 신규 계정 생성 |
| `dbcon/list_appinfo.php` | GET/include | `pages/appinfo.php` | 내부 변수 `cont` | `<tr>` 목록 | 앱 목록 조회 |
| `dbcon/list_appinfo_add.php` | POST | `appinfo.js` | `select_plat`, `select_name`, `select_etc` | alert/script | 앱 등록 |
| `dbcon/list_appinfo_edit_select.php` | POST | `appinfo_edit_to()` | `appinfo_num`, `ecount` | form fragment | 앱정보 수정 셀 생성 |
| `dbcon/list_appinfo_edit_save.php` | POST | `appinfo_save_to()` | `appinfo_num`, `appinfo_name`, `appinfo_info`, `appinfo_etc` | 빈 응답 | 앱정보 저장 |
| `dbcon/noticontrol.php` | POST | 호출 화면 미확인 | `title` | alert/script | 공지/질문 등록 |
| `dbcon/noti_select.php` | GET/include | 호출 화면 미확인 | 세션 | `<tr>` 목록 | 최근 공지 조회 |

## 9. 레거시/호출처 미확인 엔드포인트

| 엔드포인트 | 상태 |
| --- | --- |
| `dbcon/manager_se_report_list.php` | `manager.js`에서만 확인, 해당 화면 파일은 저장소에서 직접 확인 어려움 |
| `dbcon/manager_d2d_report_list.php` | 동일 |
| `dbcon/manager_d2d_report_export.php` | 동일 |
| `dbcon/manager_info_month_time.php` | 동일 |
| `dbcon/manager_month_report_list.php` | 직접 호출 화면 미확인 |

## 10. 설계 메모

1. 이 시스템은 API 계약이 DB 중심이 아니라 DOM 중심입니다.
2. 동일 개념의 데이터라도 엔드포인트마다 반환 형식이 다릅니다.
3. 성공/실패 표준 응답이 없어 프런트엔드가 화면 재로딩으로 상태를 맞추는 경우가 많습니다.
4. 현대화 시 우선순위는 `업무보고`, `프로젝트`, `트래킹` 영역의 HTML fragment API를 JSON API로 치환하는 것입니다.
