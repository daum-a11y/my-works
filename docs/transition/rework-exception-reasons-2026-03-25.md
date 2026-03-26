# 재작업 예외 사유 2026-03-25

대상:
- `원본에 없는데 현재 생긴 것` 중에서
- 단순 임의 추가가 아니라
- `버그 수정`, `정합성 유지`, `허용된 인증/DB 변경 대응` 목적으로 볼 수 있는 항목만 분리한다.

이 문서는 `유지 확정 문서`가 아니다.
- 제거 대상에서 즉시 제외할 후보를 적는다.
- 최종 유지 여부는 실제 수정 시점에 다시 판단한다.

## 1. 인증체계 변경 직접 대응

### 1-1. 이메일 로그인
- 현재 파일:
  - [LoginPage.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/features/auth/LoginPage.tsx)
  - [AuthContext.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/features/auth/AuthContext.tsx)
- 사유:
  - 인증체계가 Supabase 기반으로 교체되었기 때문에, `아이디 로그인`을 그대로 유지할 수 없다.
  - 이 항목은 임의 추가라기보다 허용된 인증 변경의 직접 결과다.

### 1-2. Supabase 환경설정 안내
- 현재 파일:
  - [LoginPage.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/features/auth/LoginPage.tsx)
  - [env.ts](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/lib/env.ts)
- 사유:
  - 환경변수 미설정 상태에서 로그인 화면이 오동작하는 것을 막기 위한 방어 장치다.
  - 사용자 기능 추가라기보다 설정 오류 방지용이다.

## 2. DB 설계 변경 / 정합성 유지 대응

### 2-1. `projectId/pageId` 고정 연결 구조
- 현재 파일:
  - [reports-page.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/features/reports/reports-page.tsx)
  - [data-client.ts](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/lib/data-client.ts)
  - [20260324_000001_initial_ops_schema.sql](/Users/gio.a/Documents/workspace/next/my-works/supabase/migrations/20260324_000001_initial_ops_schema.sql)
- 사유:
  - 1차 DB 설계 변경 이후 `tasks -> projects/project_pages` 참조 무결성을 유지하려고 도입된 구조다.
  - 다만 현재는 이 구조 때문에 원본의 동적 입력 계약이 축소됐다.
  - 따라서 `즉시 제거`가 아니라 `원본 입력계약 복원과 함께 재설계` 대상이다.

### 2-2. 회원 Auth 진단 정보
- 현재 파일:
  - [AdminMembersPage.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/features/admin/members/AdminMembersPage.tsx)
  - [admin-client.ts](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/features/admin/admin-client.ts)
- 항목:
  - `Auth User ID`
  - `Auth 이메일`
  - `처리 사유`
  - `Auth 미연결 / 이메일 불일치 / 권한값 점검 필요 / 비활성 사용자` 처리 큐
- 사유:
  - 인증 마이그레이션 이후 계정 연결 상태와 데이터 정합성을 확인하려는 진단용 기능이다.
  - 원본에는 없지만, 인증 전환으로 생긴 운영상 오류를 잡기 위한 성격이 강하다.

## 3. 버그 재발 방지 / 운영 안정성 대응

### 3-1. 테스트 파일 묶음
- 현재 파일:
  - [login-page.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/test/login-page.test.tsx)
  - [reports-page.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/test/reports-page.test.tsx)
  - [search-page.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/test/search-page.test.tsx)
  - [projects-tracking.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/test/projects-tracking.test.tsx)
  - [tracking-feature.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/test/tracking-feature.test.tsx)
  - [stats-pages.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/test/stats-pages.test.tsx)
  - [qa-stats-page.test.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/test/qa-stats-page.test.tsx)
- 사유:
  - 원본에는 없던 레이어지만, 화면/기능을 원본에 가깝게 되돌릴 때 회귀를 막는 목적이다.
  - 사용자 기능 자체가 아니라 검증 장치이므로 제거 우선순위 대상은 아니다.

### 3-2. 타입/테스트 보강 파일
- 현재 파일:
  - [global-test-types.d.ts](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/global-test-types.d.ts)
  - [vite-env.d.ts](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/vite-env.d.ts)
  - [test/setup.ts](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/test/setup.ts)
  - [jest-axe.d.ts](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/test/jest-axe.d.ts)
- 사유:
  - Vite/TypeScript/Vitest 환경에서 테스트와 접근성 검증을 동작시키기 위한 필수 보조 파일이다.
  - 기능 임의 추가로 보지 않고, 개발/검증 인프라로 본다.

## 4. 즉시 제거 대상에서 제외하지만 재검토가 필요한 항목

### 4-1. `/settings/password`
- 현재 파일:
  - [PasswordSettingsPage.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/features/settings/PasswordSettingsPage.tsx)
- 사유:
  - 현재 비밀번호 입력과 변경 검증 자체는 원본에도 있었다.
  - 다만 원본은 `/profile` 내 통합 흐름이었고, 현재는 별도 화면이다.
  - 따라서 `즉시 삭제`가 아니라 `/profile` 복원 시 통합 여부를 재검토한다.

### 4-2. 관리자 업무 편집 입력군
- 현재 파일:
  - [AdminReportsPage.tsx](/Users/gio.a/Documents/workspace/next/my-works/apps/ops-web/src/features/admin/reports/AdminReportsPage.tsx)
- 사유:
  - 원본 PHP/Vue의 관리자 축에는 화면 구성이 달랐지만, 관리자 업무 자체를 수정/삭제하는 목적은 있었다.
  - 현재 구현의 구체 UI는 원본과 다르므로 재정렬 대상이지만, 관리 기능 자체는 제거 대상이라고 단정하지 않는다.
