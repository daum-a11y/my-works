# 빌드 / 테스트 / 운영 리스크 리뷰

## 1. `P2` 초기 상태의 `pnpm build` 실패 원인은 확인됐고 현재는 통과함

검증:
- 실행 위치: `./my-works`
- 명령: `pnpm build`

대표 오류:
- `my-works/src/features/admin/types/AdminTaskTypesPage.tsx:98`
- `my-works/src/features/admin/groups/AdminServiceGroupsPage.tsx:94`
- `my-works/src/features/profile/ProfilePage.tsx:91`
- `my-works/src/features/search/search-page.tsx:71`
- `my-works/src/features/search/search-page.tsx:600`
- `my-works/src/features/reports/use-reports-slice.ts:272`

설명:
- `adminDataClient` 타입이 실제 사용 메서드와 맞지 않습니다.
- `Button` 컴포넌트는 `tone`만 받는데 `ProfilePage`는 `kind="ghost"`를 넘깁니다.
- `search-page.tsx`는 `formatReportHours`를 사용하지만 import가 없습니다.
- `ReportDraft.type2`는 좁은 literal union인데 실제 옵션 생성은 일반 문자열 배열이라 타입이 깨졌습니다.

현재 상태:
- 위 오류들은 수정 후 `pnpm build`가 통과합니다.

## 2. `P2` 초기 상태의 `pnpm test` 실패 원인은 확인됐고 현재는 통과함

검증:
- 실행 위치: `./my-works`
- 명령: `pnpm test`

초기 실패 파일:
- `my-works/src/test/search-page.test.tsx`
- `my-works/src/test/reports-page.test.tsx`
- `my-works/src/test/projects-tracking.test.tsx`

설명:
- `search-page.test.tsx`는 default export를 기대하지만 실제 구현은 named export입니다.
- `reports-page.test.tsx`는 `useReportsSlice()` mock shape가 실제 `ReportsSlice` 계약과 맞지 않습니다.
- `projects-tracking.test.tsx`는 탭 버튼의 접근성 이름이 카운트를 포함하는 현재 구조와 맞지 않았습니다.
- `TrackingFeature`는 로딩 중 draft state effect가 빈 객체를 반복 생성해 테스트 러너를 멈추게 했습니다.

현재 상태:
- 위 오류들은 수정 후 `pnpm test`가 통과합니다.

## 3. `P2` `STATUS.md`와 리뷰 문서는 현재 구조 변경을 반영하지 않음

근거:
- `my-works/STATUS.md:77-80`

설명:
- 문서에는 워크스페이스와 `apps/ops-web` 전제를 기반으로 한 표현이 남아 있습니다.
- 현재 저장소는 단일 앱 루트 구조로 정리됐습니다.

영향:
- 경로 추적과 유지보수 판단이 흔들릴 수 있습니다.

권고:
- 구조 변경 기준으로 문서를 갱신해야 합니다.

## 4. `P2` 테스트가 지나치게 mock 중심이라 실제 권한/RLS 문제를 잡지 못함

근거 예시:
- `my-works/src/test/projects-tracking.test.tsx`
- `my-works/src/test/stats-pages.test.tsx`
- `my-works/src/test/search-page.test.tsx`

설명:
- 핵심 페이지 대부분이 `useAuth`, `opsDataClient`를 전부 mock 처리합니다.
- 이 저장소의 실제 리스크는 Supabase auth/RLS/RPC 계약인데, 현재 테스트 구조는 그 층을 전혀 검증하지 않습니다.

영향:
- 실제 환경에서 터질 비관리자 권한 오류, RPC 누락, RLS 불일치를 테스트가 놓칩니다.

권고:
- 최소한 Supabase와 맞물린 통합 테스트 또는 contract test가 필요합니다.

## 5. `P2` E2E 스크립트는 있지만 실제 Playwright 자산이 없음

근거:
- `my-works/package.json:10`
- `my-works/package.json:12`

설명:
- `test:e2e` 스크립트는 선언돼 있습니다.
- 하지만 저장소 안에 `playwright.config.*`나 E2E spec이 없습니다.

영향:
- 팀은 브라우저 회귀 테스트가 있는 것처럼 오인할 수 있습니다.

권고:
- 스크립트를 제거하거나, 실제 E2E 테스트를 추가해야 합니다.

## 6. `P2` PNPM과 npm lockfile이 같이 커밋되어 있음

근거:
- `my-works/package.json:4`
- `my-works/pnpm-lock.yaml`
- `my-works/package-lock.json`

설명:
- 저장소는 PNPM을 패키지 매니저로 선언합니다.
- 그런데 루트에 `package-lock.json`도 같이 있습니다.

영향:
- 환경마다 다른 lockfile을 기준으로 설치해 의존성 상태가 흔들릴 수 있습니다.

권고:
- 한 가지 패키지 매니저만 유지해야 합니다.

## 7. 추가 테스트 공백

현재 비어 있는 영역:
- 로그인, 세션 복원, 비밀번호 변경 실경로
- 관리자 CRUD 실경로
- 일반 사용자 권한으로 접근하는 `/dashboard`, `/projects`, `/tracking`, `/resource/*`, `/stats/*`
- Supabase RPC/RLS 계약
- TypeScript 빌드를 테스트 단계에서 강제하는 검증
