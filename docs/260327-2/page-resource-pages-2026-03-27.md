# 리소스 집계 페이지 보고서

작성일: 2026-03-27

## 대상 페이지

- 리소스 요약
- 업무유형 집계
- 서비스그룹 집계
- 월간 종합현황

## 비교 원본 파일

- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/views/resource/ResourceTop.vue`
- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/views/resource/ResourceTypeSummary.vue`
- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/views/resource/ResourceSvcSummary.vue`
- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/views/resource/ResourceMonthly.vue`

## 현재 대응 파일

- `src/features/resource/ResourceSummaryPage.tsx`
- `src/features/resource/ResourceTypePage.tsx`
- `src/features/resource/ResourceServicePage.tsx`
- `src/features/resource/ResourceMonthPage.tsx`
- `src/features/resource/ResourcePage.module.css`
- `src/features/resource/resource-shared.ts`
- `src/app/AppRouter.tsx`
- `src/app/AppShell.tsx`

## 원본 기능 목록

- `리소스 요약` 독립 페이지
- `업무유형 집계` 독립 페이지
- `서비스그룹 집계` 독립 페이지
- `월간 종합현황` 독립 페이지
- 일간/월간 날짜 이동
- 월간 사용자 선택
- 타입별/서비스별 집계 표
- 월간 요약 배지와 구성원별 차이 표시
- 월간 리소스 보고서 표

## 차이점 목록

- `오개발`
  - `리소스 요약` 월간 이전달 버튼이 동작하지 않았다.
  - `리소스 요약`의 `MM` 표기가 시간(`h`) 포맷으로 잘못 출력됐다.
- `누락`
  - 독립 페이지 기준으로 분리된 표/요약 구성이 부족했다.
- `구조적 예외`
  - 현재 이관 코드의 리소스 집계는 원본 전용 API 응답이 아니라 `tasks` 직접 조회 기반으로 재구성되어 있다.
- `구조적 예외`
  - 전체 `tasks` 일괄 조회 경로는 불안정해 리소스 화면에서는 멤버별 조회 합산 방식으로 집계를 구성한다.

## 수정 항목

- 리소스 네 개 페이지를 각각의 독립 라우트로 유지
- 요약/유형/서비스/월간 페이지를 원본 제목과 표 중심 구조로 재구성
- 월간 이전/다음 날짜 이동과 구성원 배지 출력 보강
- 공용 MM/영업일/서비스명 분리 헬퍼 추가
- `MM`/`MD` 계산식을 원본 기준으로 재정렬
- `리소스 요약` 일간 결과 표와 월간 캘린더를 원본 방향으로 재조정
- 리소스 데이터 로딩을 `대상 멤버별 task 조회 -> 집계` 순서로 변경
- `월간 종합현황`을 실데이터 월 `2025-07` 기준으로 다시 검증

## 검증 결과

- `pnpm -s exec tsc -p tsconfig.json --noEmit` 통과
- 브라우저 실검수 확인
  - `/resource/summary`
  - `/resource/type`
  - `/resource/svc`
  - `/resource/month/2025-07`
- `2025-07` 기준 `월간 종합현황`에서 `총 0.11 MM`, 타입/서비스 집계 표, 보고서양식 출력 확인

## 남은 확인 필요 사항

- 집계 값은 원본 전용 API가 아니라 현재 이관 스키마의 태스크 데이터를 기준으로 재구성한 결과다
