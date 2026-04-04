# 1차 영향 검토

작성일: 2026-03-27

## 조사 목적

- 2차 관리자 원복 과정에서 변경된 공통 파일이 1차 완료 범위에 영향 주는지 분리
- 영향이 있더라도 자동 수정하지 않고 승인 필요 항목으로 남기기

## 검토 대상 공통 파일

- `src/lib/data-client.ts`
- `src/lib/domain.ts`
- `src/app/AppRouter.tsx`
- `src/app/AppShell.tsx`
- `src/features/auth/AuthContext.tsx`

## 현재 소비 범위

### `src/lib/data-client.ts`

- 직접 소비 화면
  - `src/features/reports/use-reports-slice.ts`
  - `src/features/search/search-page.tsx`
  - `src/features/projects/ProjectsFeature.tsx`
  - `src/features/dashboard/DashboardPage.tsx`
  - `src/features/stats/*`
  - `src/features/resource/resource-shared.ts`
- 판단
  - 1차/2차 공용 데이터 계층
  - 수정 시 1차 영향 가능성이 가장 큼

### `src/lib/domain.ts`

- 직접 소비 화면
  - `src/features/reports/*`
  - `src/features/search/search-page.tsx`
  - `src/features/projects/ProjectsFeature.tsx`
  - `src/features/resource/resource-shared.ts`
  - `src/features/auth/AuthContext.tsx`
- 판단
  - 공용 타입 계층
  - 저장 계약 확장이나 필드 의미 변경은 1차 영향 가능

### `src/app/AppRouter.tsx`

- 현재 영향 범위
  - `/profile`
  - `/admin/*`
  - `/resource/*`
  - `/dashboard`
- 판단
  - 라우트 추가/리다이렉트 변경은 전체 앱 내비게이션에 영향
  - 현재는 2차 복원 목적의 라우트만 추가되어 있음

### `src/app/AppShell.tsx`

- 현재 영향 범위
  - 공용 사이드바 메뉴
  - 브레드크럼
  - 관리자 메뉴 노출
- 판단
  - 메뉴 라벨이나 구조 변경은 1차 사용자 체감에 직접 영향
  - 현재는 관리자 메뉴 라벨 정리 수준

### `src/features/auth/AuthContext.tsx`

- 현재 영향 범위
  - 로그인 세션 바인딩
  - 로그아웃
  - 비밀번호 변경
- 판단
  - 프로필 복원 때문에 `updatePassword(nextPassword)` 계약이 변경됨
  - 이 파일은 1차/2차 공용 인증 계층이므로 후속 수정은 승인 없이 확장 금지

## 현재 결론

- 즉시 수정 필요 항목은 없음
- 다만 아래 둘은 후속 구현 시 1차 영향 가능성이 크다.
  - `src/lib/data-client.ts`의 전체 tasks 조회 관련 수정
  - `src/features/auth/AuthContext.tsx`의 비밀번호 변경 계약 재수정
- 추가로 아래 항목도 구현 관점에서 1차 영향 가능성이 크다.
  - 2차 admin 보고 저장을 1차 공용 보고 저장 규칙과 다시 묶는 변경
  - 이유: 1차 보고 저장/복원 규칙을 다시 건드리게 되면 공용 해석 계약에 영향이 생기기 때문

## 승인 필요 항목

- `전체 업무검색`에 1차와 같은 공용 저장/복원 규칙을 2차 admin에도 도입하는 경우
  - 공용 보고 해석 계약이 넓어짐
  - 단순 UI 수정이 아니라 공용 저장/복원 규칙을 2차 admin까지 확장하는 작업임
- `src/lib/data-client.ts`에서 admin 전체 `tasks` 조회 계약을 수정하는 경우
  - 1차 통계/검색/보고에 간접 영향 가능
- `AppShell`에서 대시보드/관리자 메뉴를 다시 재배치하는 경우
  - 1차 완료 범위 회귀 가능

## 기본 원칙

- 1차 범위는 승인 없이 수정하지 않음
- 공통 파일 수정이 필요하면 먼저 이 문서에 항목 추가
- 항목이 `1차 영향 가능`으로 분류되면 별도 승인 전까지 보류
