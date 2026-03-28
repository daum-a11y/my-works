# my-works 코드리뷰

리뷰 일자: 2026-03-25

범위:
- `./my-works`
- `./my-works/supabase`
- 로컬 검증: `pnpm build`, `pnpm test`

문서 구성:
- `01-security-auth.md`: 보안, 권한, 인증, 관리자 기능
- `02-runtime-data.md`: 일반 사용자 런타임 장애, 날짜/시간 처리, 데이터 무결성
- `03-build-test.md`: 빌드, 테스트, 운영 리스크

핵심 요약:
- `P0` `members_self_update` 권한 상승 경로는 초기 migration 기준으로 제거했습니다.
- `P1` 일반 사용자 라우트와 RLS 충돌은 공개 view/RPC와 `bind_auth_session_member` 경로 추가로 현재 브랜치에서 정리했습니다.
- `P1` 관리자 비밀번호 초기화는 레거시 고정 비밀번호 경로를 제거하고 Supabase Auth `resetPasswordForEmail()`로 교체했습니다.
- `P1` 남은 보안/UI 이슈는 "현재 비밀번호 입력 UI가 실제 재인증을 하지 않는다"는 점입니다.
- `P2` 프로젝트 생성은 일반/관리자 모두 허용이 의도라고 확인됐고, `upsert_project_page`의 기존 프로젝트 연결 권한 검증도 초기 migration에 반영했습니다.
- `P2` 초기 상태의 `pnpm build`/`pnpm test` 실패 원인은 확인했고, 현재 저장소 기준으로는 둘 다 통과합니다.

로컬 검증 결과:
- `pnpm build`: 통과
- `pnpm test`: 통과

초기 상태에서 직접 확인한 실패 사항:
- TypeScript 빌드 오류
  - `adminDataClient` 메서드 타입 불일치
  - `Button` prop 불일치
  - `search-page.tsx`의 `formatReportHours` 미정의
  - `ReportDraft` 타입과 실제 문자열 옵션 불일치
- 테스트 실패
  - `src/test/search-page.test.tsx`: default export 가정이 실제 구현과 불일치
  - `src/test/reports-page.test.tsx`: `useReportsSlice()` mock shape가 실제 계약과 불일치
  - `src/test/projects-tracking.test.tsx`: 접근성 이름 기대값이 현재 탭 버튼 구조와 불일치
  - `src/features/tracking/TrackingFeature.tsx`: 로딩 중 draft effect가 빈 state를 반복 생성해 테스트 러너를 멈추게 함

검토 메모:
- SQL 기반 조치는 현재 `my-works/supabase/migrations/000_initial_ops_schema.sql` 기준으로 포함돼 있습니다.
- 현재 저장소는 단일 앱 루트 구조로 정리됐고, `apps/ops-web` 경로를 전제로 한 문서/메모는 갱신이 필요합니다.
