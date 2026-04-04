## 보고 대상

| 항목 | 내용 |
| --- | --- |
| 원본 페이지 | `php-operation_tool/webapp/pages/stati_qa.php` |
| 원본 근거 | `dbcon/track_info_qa.php` |
| 현재 구현 | `src/features/stats/QaStatsPage.tsx` |

## 비교 결과

| 기능 | 원본 근거 | 현재 상태 | 판정 | 수정 반영 |
| --- | --- | --- | --- | --- |
| 월별 QA 차트 | `chart_div` | 현재 월별 차트 제공 | 복구 완료 | 원본 구조대로 차트 섹션 복구 |
| 월별 QA 표 | `staticyear` | 현재 월별 표 제공 | 복구 완료 | `총 진행/진행 완료/진행 중` 반영 |
| 상세 목록 | `track_info_qa.php` list | 현재 다중 상세 패널 제공 | 복구 완료 | `진행중 QA + 최근 월별 QA` 목록 복구 |

## 남은 차이

| 항목 | 내용 |
| --- | --- |
| 집계 기준 | 원본은 `PJ_TBL`의 `pj_end_date`, `pj_start_date` 조건으로 월별 QA를 계산하고, 현재는 현재 프로젝트 데이터로 월별 집계를 계산합니다. 결과 동일 여부를 확정하지 못했습니다. |
