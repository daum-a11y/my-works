# 프로필 페이지 보고서

작성일: 2026-03-27

## 대상 페이지

- 프로필

## 비교 원본 파일

- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/views/Profile.vue`

## 현재 대응 파일

- `src/features/settings/UserProfilePage.tsx`
- `src/features/settings/UserProfilePage.module.css`
- `src/app/AppRouter.tsx`
- `src/app/AppShell.tsx`

## 원본 기능 목록

- 프로필 정보 표
- `ID`, `이름` 조회
- `비밀번호 변경` 버튼
- 비밀번호 변경 폼 토글
- 비밀번호 일치/불일치 문구
- `변경`, `취소`
- 변경 후 재로그인

## 차이점 목록

- `누락`
  - `/profile` 독립 경로가 없었다.
  - 프로필 정보 표가 없었다.
- `오개발`
  - 단순 비밀번호 변경 폼만 존재했다.

## 수정 항목

- `/profile` 직접 라우트 연결
- 세션 정보 기반 `ID/이름` 표 복원
- 비밀번호 변경 토글, 일치 문구, 변경/취소 흐름 복원
- 비밀번호 변경 성공 후 로그아웃 처리

## 검증 결과

- `pnpm -s exec tsc -p tsconfig.json --noEmit` 통과
- 브라우저 비파괴 검증 확인
  - `/profile`에서 `ID/이름` 표 확인
  - `비밀번호 변경` 버튼 노출 확인

## 남은 확인 필요 사항

- 프로필 조회는 별도 API 조회가 아니라 현재 세션 정보 사용
