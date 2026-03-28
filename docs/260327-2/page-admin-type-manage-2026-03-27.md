# 업무 타입 관리 페이지 보고서

작성일: 2026-03-27

## 대상 페이지

- 업무 타입 관리모드 CRUD

## 비교 원본 파일

- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/views/admin/AdminWorkTypeManage.vue`

## 현재 대응 파일

- `src/features/admin/types/AdminTaskTypesPage.tsx`
- `src/features/admin/admin-client.ts`
- `src/features/admin/admin-types.ts`

## 원본 기능 목록

- 타입 목록 표
- type1 그룹 표시
- 인라인 추가/수정/삭제
- `seq`, `리소스 타입`, `활성여부`, `비고`
- 저장/취소/확인창

## 차이점 목록

- `오개발`
  - 단순 CRUD 테이블 구조였다.
- `누락`
  - 원본형 그룹 표시와 인라인 편집 흐름이 약했다.

## 수정 항목

- 그룹형 테이블 구조 복원
- `seq/리소스 타입/활성여부/비고` 컬럼 반영
- 추가/수정/삭제/저장/취소/확인창 흐름 복원
- `legacy_type_num` 매핑 추가

## 검증 결과

- `pnpm -s exec tsc -p tsconfig.json --noEmit` 통과
- 브라우저 비파괴 검증 확인
  - `/admin/type` 목록 렌더 확인
  - `업무 타입 추가` 진입/취소 확인
  - 첫 행 `수정` 진입/취소 확인

## 남은 확인 필요 사항

- 없음
