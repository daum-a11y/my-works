# PHP 스펙아웃 판정 리포트

작성일: 2026-03-27  
원본 기준: `/Volumes/workspace/workspace/link/php-operation_tool`  
비교 대상: `/Volumes/workspace/workspace/my-works`

## 1. 판정 요약

| 판정 | 항목 |
| --- | --- |
| 유지 | Dashboard, 업무보고, 프로젝트 관리, 개인 업무검색, QA 통계, 모니터링 통계 |
| 스펙아웃 | 전체 업무검색, 타입 관리, 서비스그룹 관리, 계정관리, 신규 계정 생성, 앱 운영정보, 추천 모니터링, 알림, `manager_*`, 모니터링 트래킹, 비밀번호 변경(PHP 화면) |
| 운영 대상 아님 | 테스트 페이지 |

## 2. 상세 판정표

| 구분 | 항목 | 원본 파일 | 판정 | 판정 사유 |
| --- | --- | --- | --- | --- |
| 사용자 | Dashboard | `pages/dashboard.php` | 유지 | 원본 핵심 화면 |
| 사용자 | 업무보고 | `pages/report.php` | 유지 | 원본 핵심 화면 |
| 사용자 | 프로젝트 관리 | `pages/project.php` | 유지 | 사용자 확인: 유지 대상 |
| 사용자 | 개인 업무검색 | `pages/report_personal.php` | 유지 | 원본 핵심 화면 |
| 사용자 | QA 통계 | `pages/stati_qa.php` | 유지 | 원본 핵심 화면 |
| 사용자 | 모니터링 통계 | `pages/stati_mo.php` | 유지 | 원본 핵심 화면 |
| 사용자 | 비밀번호 변경(PHP 화면) | `pages/userset.php` | 스펙아웃 | PHP 원형 화면 복구 제외, 현재 이관 코드 유지 |
| 관리자 | 전체 업무검색 | `pages/allreport.php` | 스펙아웃 | PHP 진입점 제거, 현재 안 씀 |
| 관리자 | 타입 관리 | `pages/type.php` | 스펙아웃 | PHP 진입점 제거, 현재 안 씀 |
| 관리자 | 서비스그룹 관리 | `pages/service_group.php` | 스펙아웃 | PHP 진입점 제거, 현재 안 씀 |
| 관리자 | 계정관리 | `pages/members.php` | 스펙아웃 | 인증 구조 변경, PHP 진입점 제거 |
| 관리자 | 신규 계정 생성 | `pages/new_member.php` | 스펙아웃 | 인증 구조 변경, PHP 진입점 제거 |
| 보조 | 앱 운영정보 | `pages/appinfo.php` | 스펙아웃 | 전환 제외 범위 |
| 보조 | 추천 모니터링 | `dbcon/recommandmoni.php` | 스펙아웃 | 전환 제외 범위 |
| 보조 | 알림 | `dbcon/noticontrol.php`, `dbcon/noti_select.php` | 스펙아웃 | 전환 제외 범위 |
| 보조 | `manager_*` | `js/manager.js`, `dbcon/manager_*` | 스펙아웃 | 접근 경로 없음, 현재 안 씀 |
| 보조 | 모니터링 트래킹 | `pages/track.php` | 스펙아웃 | 최근 dump 사용 흔적 없음 |
| 기타 | 테스트 페이지 | `pages/test.php` | 운영 대상 아님 | 테스트용 파일 |

## 3. 근거

| 근거 유형 | 대상 | 근거 |
| --- | --- | --- |
| 진입점 제거 | `allreport`, `type`, `service_group`, `members`, `new_member` | PHP 파일은 남아 있으나 현재 운영 진입점 제거 |
| 인증 변경 | `members`, `new_member` | 구 PHP 계정 생성/관리 흐름, 현 인증 구조와 불일치 |
| 전환 제외 문서 | `appinfo`, `추천 모니터링`, `알림`, `manager_*` | `docs/transition/rework-summary-2026-03-25.md` 제외 범위 |
| dump 미사용 | `track` | `db_a11yop_2507071945.sql` 기준 2024 연결 페이지 106건, 2025 연결 페이지 87건, 트래킹 필드 사용 0건 |

## 4. 작업 기준

- 복구 대상만 원본 대비 비교/수정
- 스펙아웃 대상은 잔존 화면/라우트/메뉴만 점검
- `test.php`는 운영 복구 대상에서 제외
