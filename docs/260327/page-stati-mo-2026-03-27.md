## 보고 대상

| 항목 | 내용 |
| --- | --- |
| 원본 페이지 | `php-operation_tool/webapp/pages/stati_mo.php` |
| 원본 근거 | `dbcon/track_info_mo.php` |
| 현재 구현 | `src/features/stats/MonitoringStatsPage.tsx` |

## 비교 결과

| 기능 | 원본 근거 | 현재 상태 | 판정 | 수정 반영 |
| --- | --- | --- | --- | --- |
| 월별 모니터링 차트 | `chart_div` | 현재 월별 차트 제공 | 복구 완료 | 원본 구조대로 차트 섹션 복구 |
| 월별 모니터링 표 | `staticyear` | 현재 월별 표 제공 | 복구 완료 | `총 진행/전달/미전달/중지/전체 수정/일부 수정` 반영 |
| 상세 목록 | `track_info_mo.php` list | 현재 다중 상세 패널 제공 | 복구 완료 | `진행중 모니터링 + 최근 월별 모니터링` 목록 복구 |

## 남은 차이

| 항목 | 내용 |
| --- | --- |
| 집계 기준 | 원본은 `PJ_PAGE_TBL`의 `pj_page_date`, `pj_page_agit`, `pj_page_track_end`, `pj_page_highest/high/normal`, `pj_page_track_etc` 기준으로 계산하고, 현재는 현재 페이지 데이터 기준으로 월별 집계를 계산합니다. 결과 동일 여부를 확정하지 못했습니다. |
