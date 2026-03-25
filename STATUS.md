# `/my-works` 작업 상태

최종 갱신: 2026-03-24 Asia/Seoul

## 현재 기준

- 작업 루트: [`/Users/gio.a/Documents/workspace/next/my-works`](/Users/gio.a/Documents/workspace/next/my-works)
- 현재 진행 중 항목: `1차 구현 상태 및 검증 범위 재정리`
- 제외 범위: `추천 모니터링`, `앱 운영정보`, `알림`, `manager_*`
- 2차 분리 범위: `allreport`, `type`, `service_group`, `members`, `new_member`

## 완료

- `Vite + React + TypeScript + pnpm` 기반 워크스페이스 초기화
- `/apps/ops-web` 1차 사용자 앱 스캐폴드 구성
- `React Router`, `React Query`, `Supabase client`, `React Aria`, `CSS Modules` 연결
- 1차 라우트 뼈대 구성
  - `/login`
  - `/dashboard`
  - `/reports`
  - `/projects`
  - `/tracking`
  - `/reports/search`
  - `/stats/qa`
  - `/stats/monitoring`
  - `/settings/password`
- 신규 Supabase 스키마 초안 작성
  - `members`
  - `tasks`
  - `projects`
  - `project_pages`
  - `task_types`
  - `service_groups`
- 제외 테이블 미생성 원칙 문서화
  - `APPINFO_TBL`
  - `NOTI_TBL`
  - `AGITNOTI_TBL`
  - `AGITNOTI_OPT_TBL`
- 로그인/세션 복원/비밀번호 변경 기본 흐름 구현
- 업무보고/검색/프로젝트/트래킹 화면을 shared client 기반으로 연결
- 데모 모드 및 mock fallback 제거
- 업무보고 저장을 `projectId/pageId` 기반 선택 구조로 전환
- 개인 검색을 `searchTasks` 기준으로 정리하고 다운로드 UI를 제거
- 프로젝트 화면에 `새 프로젝트`, `새 페이지` 생성 흐름 추가
- 트래킹 화면에서 깨져 있던 `새 항목` 흐름 제거, 상태 수정 전용으로 정리
- 모니터링/QA 통계 대상을 `monitoring_in_progress`, `qa_in_progress` 기준으로 정렬
- 앱 쉘/로그인/업무보고/검색/프로젝트/트래킹/대시보드/통계/비밀번호 변경 화면을 운영관리툴 톤으로 정리하고 대비·포커스를 강화
- 개인 검색 화면에서 다운로드 UI와 관련 문구를 제거
- 디자인 컨텍스트를 [`/Users/gio.a/Documents/workspace/next/.impeccable.md`](/Users/gio.a/Documents/workspace/next/.impeccable.md)에 기록
- 테스트 확장 완료
  - `reports-page`
  - `search-page`
  - `projects-tracking`
  - `stats-pages`

## 지금 하는 일

- 현재 구현 위치와 남은 검증 범위를 다시 정리
- 공수 해석과 완료 판정을 분리 기록

## 다음 작업

- 실서버 인증 정보 기준 수동 시나리오 검증
- 필요 시 Playwright E2E 추가

## 진행 해석

- 현재 코드는 `1차 실사용 화면 구현 초안 + 로컬 검증 통과` 상태로 본다.
- `2026-03-24` 기준 작업 속도와 실제 변경량을 보면, 초기 문서에 적었던 `22~29 MD`, `Phase 3 약 23 MD` 추정은 현재 결과물 설명값으로 맞지 않는다.
- 이번 구현 상태를 `23MD가 수행된 상태`로 해석하지 않는다.
- 완료 판정은 `구현 완료`와 `운영 투입 가능`을 분리해서 본다.
  - 구현 측면: 1차 범위 상당수 반영
  - 운영 투입 측면: 실서버 기준 수동 검증 전

## 확인 메모

- 현재 작업 로그는 이 파일에 계속 갱신
- `2026-03-24` 기준 `pnpm build`, `pnpm test` 통과
- 테스트는 현재 `7 files / 9 tests` 통과
- Playwright E2E는 아직 추가하지 않음
- RPC 저장 경로는 `save_task`, `delete_task`, `upsert_project`, `upsert_project_page` 기준으로 정리됨
