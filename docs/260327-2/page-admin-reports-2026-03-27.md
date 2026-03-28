# 전체 업무검색 페이지 보고서

작성일: 2026-03-27

## 대상 페이지

- 전체 업무검색

## 비교 원본 파일

- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/views/search/Search.vue`
- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/components/search/SearchTblHead.vue`
- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/components/search/SearchTblRow.vue`

## 현재 대응 파일

- `src/features/admin/reports/AdminReportsPage.tsx`
- `src/features/admin/reports/AdminReportEditorPage.tsx`
- `src/features/admin/reports/AdminReportsPage.module.css`
- `src/features/reports/reports-page.module.css`
- `src/features/admin/admin-client.ts`
- `src/features/admin/admin-types.ts`
- `src/app/AppRouter.tsx`

## 원본 기능 목록

- 기간 검색
- 전날/오늘/다음날 이동
- 사용자 다중 선택
- 타입/서비스그룹/서비스명 필터
- 정렬 버튼
- 표 중심 결과 화면
- 추가 페이지 이동
- 수정 페이지 이동
- 삭제
- 엑셀 다운로드

## 차이점 목록

- `오개발`
  - 행내 추가/수정 구조로 구현돼 있었다.
- `누락`
  - 개인업무 등록과 같은 별도 입력 페이지 흐름이 없었다.

## 수정 항목

- 표 중심 검색 페이지로 재구성
- 날짜 이동, 사용자 체크박스, 정렬 버튼 유지
- 엑셀 다운로드 컬럼 보강
- `플랫폼`, `서비스명`, `페이지 URL` 조회 계약 보강
- 상단/하단 중복 액션 제거
- `서비스그룹` 선택 전 `서비스명` 비활성 규칙 복원
- 시간 열은 원본처럼 값만 출력하고, 합계만 `분` 표기로 정리
- 행내 추가/수정 UI 제거
- 상단 `추가` 버튼은 `/admin/reports/new` 페이지로 이동
- 각 행 `수정` 버튼은 `/admin/reports/:taskId/edit` 페이지로 이동
- 관리자 등록/수정 페이지는 개인업무 등록과 같은 1페이지 입력폼 구조로 추가
- 등록 페이지는 사용자 선택 가능, 수정 페이지는 사용자 고정

## 검증 결과

- `pnpm -s exec tsc -p tsconfig.json --noEmit` 통과
- 브라우저 비파괴 검증 완료
  - 실제 task id 기준 `/admin/reports/:taskId/edit` 직접 진입 확인
  - 상단 `추가` 클릭 시 `/admin/reports/new` 진입 확인
  - 등록 페이지에서 사용자 선택 가능, `기본 입력/TYPE 입력` 1페이지 폼 구성 확인
  - 등록 페이지 `취소` 클릭 시 목록 복귀 확인
  - 수정 페이지에서 사용자 필드 고정/비활성 확인
  - 수정 페이지 `취소` 클릭 시 목록 복귀 확인

## 남은 확인 필요 사항
- 현재 스키마 예외로 `플랫폼`, `서비스그룹`, `서비스명`, `프로젝트명`, `페이지명`, `URL`은 원본처럼 태스크 자체의 자유 입력 필드를 직접 저장하지 않고 참조 데이터로 복원한다
