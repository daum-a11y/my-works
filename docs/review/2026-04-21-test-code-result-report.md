# 테스트 코드 결과 리포트

- 작성 일시: 2026-04-21 (Asia/Seoul)
- 이슈: MYW-55
- 저장소: `my-works`
- 베이스 브랜치: `feat/uiux`
- 실행 위치: `./my-works`

## 실행 환경
- Node: 프로젝트 기본
- 패키지 매니저: `pnpm`

## 실행 이력

### 1) `pnpm test`
- 커맨드: `pnpm test`
- 결과: 실패
- 테스트 요약
  - Test Files: `1 failed | 16 passed (17)`
  - Tests: `1 failed | 45 passed (46)`
  - 실행 소요: `3.70s`

#### 실패 상세
- 파일: `src/test/ResourceTypePage.test.tsx`
- 테스트명: `ResourceTypePage > shows only the selected year table and switches with tabs`
- 실패 단계: `expect(screen.getByRole('cell', { name: '2024년' })).toBeInTheDocument()`
- 원인: 현재 렌더 결과에서 `2024년` 단독 셀 텍스트가 없고, 연도 합계는 `2024년 합계` 텍스트로만 노출되어 접근성 쿼리 조건 미스매치

### 2) `pnpm build`
- 커맨드: `pnpm build`
- 결과: 실패
- 핵심 에러
  - `src/lib/dataClient.ts:190`-`src/lib/dataClient.ts:408` (`PostgrestQueryBuilder` 타입 불일치)
  - 주요 메시지: `Property 'data'/'error' does not exist` 및 `PostgrestFilterBuilder`가 `PostgrestQueryBuilder` 타입으로 기대되는 시그니처를 충족하지 못함

## 종합 결론
- 현재 상태는 “테스트 일부 실패 + 타입 에러로 빌드 실패” 상태입니다.
- 테스트 스위트 자체는 대부분 통과했지만, `ResourceTypePage` 테스트 하나만 실패하고 있고, 타입스크립트 빌드 실패는 상위 범위의 이슈입니다.

## 권고 조치
1. `ResourceTypePage` 테스트의 `2024년` 접근성 쿼리를 실제 출력 형태에 맞게 `2024년 합계` 등으로 정합성 수정
2. `src/lib/dataClient.ts`의 Supabase 타입 사용을 최신 `PostgrestQueryBuilder`/`PostgrestFilterBuilder` 시그니처에 맞춰 정리
3. 정비 후
   - `pnpm build`
   - `pnpm test`
   - 둘 다 성공 여부 재확인
