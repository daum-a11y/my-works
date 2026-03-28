# 사용자 관리 페이지 보고서

작성일: 2026-03-27

## 대상 페이지

- 사용자 관리

## 비교 원본 파일

- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/views/admin/AdminMember.vue`
- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/components/admin/AdminMemberRow.vue`

## 현재 대응 파일

- `src/features/admin/members/AdminMembersPage.tsx`
- `src/features/admin/members/AdminMemberRow.tsx`
- `src/features/admin/members/AdminMembersPage.module.css`
- `src/features/admin/admin-client.ts`
- `src/features/admin/admin-types.ts`

## 원본 기능 목록

- 사용자 목록 표
- 인라인 추가
- 인라인 수정
- 삭제
- PW 초기화
- 권한/활성여부 변경
- 등록일/최종로그인 표시

## 차이점 목록

- `오개발`
  - Auth 연결/처리 큐 중심 UI가 들어가 있었다.
- `누락`
  - 원본형 인라인 추가/수정 행이 없었다.

## 수정 항목

- 원본형 표 구조 복원
- 인라인 추가/수정/삭제/PW 초기화 흐름 복원
- 등록일 표시 추가
- 원본 외 Auth 큐 UI 제거

## 검증 결과

- `pnpm -s exec tsc -p tsconfig.json --noEmit` 통과
- 브라우저 비파괴 검증 확인
  - `/admin/members` 목록 렌더 확인
  - 첫 행 `수정` 진입/취소 확인

## 남은 확인 필요 사항

- 비밀번호 초기화는 현재 인증 구조상 메일 재설정 방식 유지
- 최종로그인 시각은 현재 데이터 소스 부재로 `-` 처리
