# 대시보드 병합 보고서

작성일: 2026-03-27

## 대상 페이지

- 대시보드 관리자 정보 병합

## 비교 원본 파일

- `/Volumes/workspace/workspace/link/php-operation_tool/webapp/pages/dashboard.php`
- `/Volumes/workspace/workspace/link/php-operation_tool/webapp/dbcon/month_moni_list.php`
- `/Volumes/workspace/workspace/link/php-operation_tool/webapp/dbcon/month_qa_list.php`
- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/views/DashBoard.vue`
- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/src/components/common/TblMonthlyResourceByUser.vue`
- `/Volumes/workspace/workspace/link/linkagelab-a11y-workmanage/front/public/img/dash01.png`

## 현재 대응 파일

- `src/features/dashboard/DashboardPage.tsx`
- `src/features/dashboard/DashboardPage.module.css`
- `src/features/reports/reports-page.tsx`
- `public/img/dash01.png`

## 원본 기능 목록

- 1차 대시보드 진행중 모니터링 목록
- 1차 대시보드 진행중 QA 목록
- 2차 대시보드 내 업무보고 작성현황 캘린더
- 2차 대시보드 우측 안내 이미지
- 관리자 메뉴 진입점

## 차이점 목록

- `누락`
  - 2차 대시보드의 `내 업무보고 작성현황` 캘린더가 빠져 있었다.
  - 2차 대시보드의 우측 안내 이미지가 빠져 있었다.
- `오개발`
  - 2차 대시보드 병합을 완료 처리했지만 실제 병합 기능은 빠져 있었다.

## 수정 항목

- 1차 대시보드 2개 테이블 유지
- 상단에 2차 대시보드의 `내 업무보고 작성현황` 월간 캘린더 병합
- 캘린더 날짜 클릭 시 개인 업무보고 화면으로 날짜 전달
- 우측에 2차 대시보드 안내 이미지 병합

## 검증 결과

- `pnpm -s exec tsc -p tsconfig.json --noEmit` 통과
- 브라우저 검증 완료
  - `/dashboard`에서 상단 캘린더, 우측 이미지, 하단 2개 테이블 동시 노출 확인
  - 캘린더 날짜 클릭 시 `/reports`로 이동하며 해당 일자가 입력폼에 반영되는 것 확인

## 남은 확인 필요 사항

- 없음
