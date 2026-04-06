# 서비스 그룹 관리 페이지 보고서

작성일: 2026-03-27

## 대상 페이지

- 서비스 그룹 관리모드 CRUD

## 비교 원본 파일

- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/views/admin/AdminSvcManage.vue`

## 현재 대응 파일

- `src/features/admin/groups/AdminServiceGroupsPage.tsx`
- `src/features/admin/groups/AdminServiceGroupsPage.module.css`
- `src/features/admin/admin-client.ts`
- `src/features/admin/admin-types.ts`

## 원본 기능 목록

- 서비스그룹 목록 표
- `서비스그룹`, `서비스명`, `분류`, `활성여부`
- 인라인 추가/수정/삭제
- 저장/취소

## 차이점 목록

- `오개발`
  - 단일 `name` 기반 관리 구조였다.
- `구조적 예외`
  - 현 스키마에 `svc_type` 컬럼이 없어 완전 동일 저장 계약은 불가하다.

## 수정 항목

- `name`을 `서비스그룹 / 서비스명`으로 분리 표시
- 원본형 표와 인라인 편집 흐름 복원
- 구형 식별자 의존 없이 `svcGroup`, `svcName`, `svcType`, `svcActive` 기준으로 정리
- `서비스그룹` 기준 rowspan 묶음 복원
- 수정행을 `서비스그룹 select + 서비스명 input` 구조로 정리

## 검증 결과

- `pnpm -s exec tsc -p tsconfig.json --noEmit` 통과
- 브라우저 실검수 확인
  - 추가 진입/취소
  - 수정 진입/취소
  - 그룹 rowspan 노출 확인

## 남은 확인 필요 사항

- `svc_type`는 현재 DB 구조 예외로 최소 대응
