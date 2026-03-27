## 보고 대상

| 항목 | 내용 |
| --- | --- |
| 원본 페이지 | `php-operation_tool/webapp/pages/dashboard.php` |
| 원본 근거 | `dbcon/month_moni_list.php`, `dbcon/month_qa_list.php` |
| 현재 구현 | `src/features/dashboard/DashboardPage.tsx` |

## 비교 결과

| 기능 | 원본 근거 | 현재 상태 | 판정 | 수정 반영 |
| --- | --- | --- | --- | --- |
| 진행중 모니터링 목록 | 우측 첫 패널 | 동일 목록 유지 | 복구 완료 | 플랫폼, 앱이름, 내용, 보고서 복구 |
| 진행중 QA 목록 | 우측 둘째 패널 | 동일 목록 유지 | 복구 완료 | 플랫폼, 앱이름, 리포터, 종료예정, 보고서 복구 |
| 추천 모니터링 iOS/Android | 좌측 두 패널 | 제거 | 스펙아웃 | 화면/기능 미표시 정리 |

## 구조 예외

| 항목 | 사유 |
| --- | --- |
| 없음 | 현재 대시보드는 유지 대상만 남겨 정리 |
