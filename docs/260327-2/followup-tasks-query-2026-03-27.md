# 공통 tasks 조회 후속 조사

작성일: 2026-03-27

## 조사 목적

- `tasks` 전체 조회 `500`이 공통 계층 문제인지 분리
- 현재 대상범위에서 실제로 쓰는 안정 경로를 고정
- 1차 영향 가능성이 있는 공통 조회 지점을 문서화

## 현재 기준 성공 경로

- `리소스 집계`
  - 파일: `src/features/resource/resource-shared.ts`
  - 방식: `활성 멤버 목록 조회 -> 멤버별 opsDataClient.getTasks(member) 호출 -> 합산`
- 브라우저 네트워크 재확인 결과
  - `/resource/summary`에서 멤버별 `tasks` GET 다건 호출이 모두 `200`
  - 현재 사용 컬럼: `id, task_id, member_id, task_date, project_id, project_page_id, task_type1, task_type2, task_usedtime, content, note, created_at, updated_at`

## 현재 기준 단일 조회 경로

- `src/lib/data-client.ts`
  - `getAllTasks(member)`
    - admin이면 단일 `tasks` 전체 조회
    - user면 `member_id` 조건 조회
  - `getStats()`
    - `project_pages_public_view` + `tasks` 전체 조회
  - `getTaskActivities()`
    - `member_id, task_date, task_usedtime`만 조회
- `src/features/admin/admin-client.ts`
  - `searchTasksAdmin(filters)`
    - 명시 컬럼 기반 단일 조회
    - 현재 브라우저 기준 `2026-03-27` 검색 요청은 `200`

## 재현 결과

- 현재 코드 기준으로는 기존 `500`을 재현하지 못했다.
- 현재 성공 확인 패턴
  - 브라우저 `admin/reports` 단일 조회: `200`
  - 브라우저 `resource/summary` 멤버별 조회 다건: 전부 `200`
  - Supabase REST 직접 호출
    - 명시 컬럼 전체 조회 + `order=task_date.desc`: `200`
    - 축소 컬럼 `member_id,task_date,task_usedtime`: `200`
    - `select=*` 전체 조회: `200`
- 따라서 현재 기준에서는 아래 해석으로 고정한다.
  - 과거 `500`은 현재 코드/현재 데이터 기준으로는 재현되지 않는다.
  - 과거 이슈는 일시적 장애, 이전 요청 계약, 또는 당시 행 데이터 상태에 묶인 문제였을 가능성이 높다.
  - 현재 리소스가 사용하는 `멤버별 조회 합산` 경로는 계속 안정 경로로 본다.

## 실패 후보 패턴

- `src/lib/data-client.ts`의 admin 전체 조회 경로
  - `getAllTasks(member)`의 단일 전체 조회
  - `getStats()`의 단일 전체 조회
- 위험 이유
  - 대상범위 실구현에서는 이미 사용하지 않는 경로가 남아 있다.
  - 현재는 브라우저/직접 REST 모두 재현이 없지만, 예전 이슈 맥락상 admin 전체 단일 조회가 여전히 가장 먼저 의심해야 할 공통 후보 경로다.

## 영향 범위

- 직접 영향 가능
  - `리소스 집계`의 과거 구현
  - `통계` 계열 페이지
  - 향후 admin 전체 조회를 다시 직접 쓰는 화면
- 간접 영향 가능
  - `src/lib/data-client.ts`를 공통으로 쓰는 1차 기능

## 현재 판단

- 즉시 수정 대상 아님
- 현재 대상범위는 안정 경로로 이미 우회되어 있고 실동작도 확인됨
- 현재 문서 기준 종료 판정
  - `과거 500`은 현행 코드 + 직접 REST 확인 기준 재현 안 됨
  - 후속으로 다시 볼 경우에도 우선순위는 아래 순서로 고정
    1. `getAllTasks(member)` admin 전체 조회 단독 호출 재현
    2. `getStats()` 전체 조회 재현
    3. 컬럼 축소/정렬 축소에 따른 성공/실패 비교

## 권고

- `리소스 집계`는 계속 `멤버별 tasks 조회 -> 집계` 경로 유지
- `전체 조회 복구`는 별도 후속 과업으로 분리
- 1차 범위 공통 영향 가능성 때문에 `src/lib/data-client.ts` 수정은 승인 전까지 보류
