# 전체 업무검색 DB 구조 예외 정리

작성일: 2026-03-27

## 조사 목적

- `전체 업무검색`의 원본 불일치 중 실제 `DB 구조 예외`를 확정
- 원본형 자유입력 저장이 가능한지 판단
- 구조 변경 없이 가능한 경우와 공통 계약 변경이 필요한 경우를 분리

## 원본 저장 계약

- 비교 원본
  - `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/views/search/Search.vue`
  - `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/components/search/SearchTblRow.vue`
- 원본 수정/생성행 입력 필드
  - `플랫폼`
  - `서비스그룹`
  - `서비스명`
  - `프로젝트명`
  - `페이지명`
  - `페이지 URL`
  - `사용시간`
  - `비고`
- 즉 원본은 태스크 행 자체에 자유입력 정보를 저장하는 계약이다.

## 현재 저장 계약

- 파일
  - `src/features/admin/admin-types.ts`
  - `src/features/admin/admin-client.ts`
- 현재 `AdminTaskSaveInput`
  - `memberId`
  - `taskDate`
  - `projectId`
  - `pageId`
  - `taskType1`
  - `taskType2`
  - `hours`
  - `content`
  - `note`
- 현재 `saveTaskAdmin()`
  - `tasks`에 직접 저장하는 필드도 위 계약과 동일
  - 자유입력 `플랫폼/서비스그룹/서비스명/프로젝트명/페이지명/페이지 URL`은 저장하지 않음

## 현재 스키마로 가능한 범위

- 현재 DB 컬럼만 기준으로는 원본과 같은 자유입력 필드를 별도 컬럼으로 직접 저장할 수 없다.
- 다만 코드베이스 전체 기준으로는 아래 공용 저장/복원 규칙이 이미 존재한다.
  - `src/features/reports/use-reports-slice.ts`
  - `src/features/reports/report-domain.ts`
  - 1차 보고 기능은 `note` 내부의 구조화 문자열로 아래 값을 저장/복원한다.
    - `platform`
    - `service_group`
    - `service_name`
    - `project_name`
    - `page_name`
    - `page_url`
    - `raw_note`

## 판정

- `DB 컬럼 추가 없이 완전 불가능`은 아니다.
- 하지만 현재 admin 보고 검색이 원본형 자유입력 저장을 하려면 아래 둘 중 하나가 필요하다.
  1. `1차 보고 기능`이 이미 쓰는 공용 저장/복원 규칙을 2차 admin 저장에도 동일하게 도입
  2. `tasks` 스키마 또는 저장 프로시저를 확장
- 즉 현재 차이는 `DB만 바꾸면 해결` 문제가 아니라 `공통 저장/복원 계약을 어디까지 공유할지` 결정 문제에 더 가깝다.

## 현재 분류

- 아래 항목은 `즉시 원복 실패`가 아니라 `구조 예외 후보`로 분류한다.
  - `플랫폼`
  - `서비스그룹`
  - `서비스명`
  - `프로젝트명`
  - `페이지명`
  - `페이지 URL`
- 이유
  - 현재 admin 저장 계약은 참조 기반이고
  - 원본은 자유입력 기반이며
  - 이 차이를 메우려면 최소한 공용 저장/복원 규칙 공유 또는 DB 계약 변경이 필요하다

## 1차 영향 여부

- 공용 저장/복원 규칙을 2차 admin에도 도입하면 1차와 같은 복원 규약을 공유하게 된다.
- 이 경우 영향을 받는 구현 범위는 최소 아래까지 번진다.
  - `src/features/admin/admin-client.ts`
  - `src/features/admin/admin-types.ts`
  - `src/features/reports/report-domain.ts`
  - `src/features/reports/use-reports-slice.ts`
- 즉 `DB 변경 없이 가능`하더라도 `공통 계약 변경` 성격이므로 1차 영향 검토가 선행돼야 한다.
- 따라서 현재는 아래로 고정한다.
  - 무승인 자동 구현 금지
  - 구조 예외 문서로 유지
  - 후속 구현은 승인 이후 별도 과업으로 분리

## 권고

- 현재 `AdminTaskSaveInput` 계약은 유지
- 자유입력 저장 복원은 아래 둘 중 하나로만 진행
  - `1차 공용 저장/복원 규칙 재사용` 승인 후 구현
  - `DB 구조 변경` 승인 후 구현
- 현재 문서 기준에서는 `원본형 자유입력 저장 = DB 구조상 절대 불가`로 보지 않는다.
- 다만 공용 저장/복원 규칙 재사용은 1차 공유 계약 변경이므로, 기술적으로 가능해도 무승인 구현 금지로 유지한다.
