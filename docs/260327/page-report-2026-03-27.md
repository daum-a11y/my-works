## 보고 대상

| 항목 | 내용 |
| --- | --- |
| 원본 페이지 | `php-operation_tool/webapp/pages/report.php` |
| 원본 근거 | `dbcon/report_pj_select.php`, `dbcon/day_report_list.php`, `dbcon/check_used_time.php`, `dbcon/day_report_time_check.php` |
| 현재 구현 | `src/features/reports/reports-page.tsx`, `src/features/reports/report-domain.ts` |

## 비교 결과

| 기능 | 원본 근거 | 현재 상태 | 판정 | 수정 반영 |
| --- | --- | --- | --- | --- |
| `기본 입력 / TYPE 입력` 탭 | `report.php` 상단 탭 | 동일 탭 구조로 복구 | 복구 완료 | 탭 전환과 저장 흐름 반영 |
| 일자 이동 `이전일/오늘/다음일` | 입력폼, 조회폼 버튼 | 동일 버튼 복구 | 복구 완료 | draft/period 날짜 이동 추가 |
| 프로젝트 검색/선택/페이지 선택 | `pj_search`, `pj_report_pjname` | 현재 프로젝트/페이지 선택 제공 | 복구 완료 | 검색어 필터 + 프로젝트/페이지 select 반영 |
| 타입1/타입2/시간/비고 저장 | 입력폼 전체 | 현재 저장 가능 | 복구 완료 | 원본 입력 흐름 기준으로 조정 |
| 오늘의 입력시간 영역 | `used_time` | 원본 문구 기준으로 표시 | 복구 완료 | `오늘은 사용한 시간이 없습니다.`, 사용분/남은분, 야근 문구 반영 |
| 미입력 시간 영역 | `day_report_time_check.php` | 현재 데이터 기준으로 원본 문구 출력 | 복구 완료 | `tasks` + `joinedAt` 기준으로 원본 결과축 반영 |
| 일자별 보고 리스트 컬럼 | 하단 테이블 12열 | 동일 컬럼 복구 | 복구 완료 | `서비스명`, `URL`, `관리` 포함 |
| 보고 선택 후 수정 | 하단 리스트 `관리` | 동일하게 선택 후 수정 | 복구 완료 | `일자`, `타입2`, `총시간`, `비고`, `저장` 흐름 반영 |
