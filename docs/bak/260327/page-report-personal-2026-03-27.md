## 보고 대상

| 항목 | 내용 |
| --- | --- |
| 원본 페이지 | `php-operation_tool/webapp/pages/report_personal.php` |
| 원본 근거 | `dbcon/report_search.php`, `dbcon/report_search_export.php` |
| 현재 구현 | `src/features/search/search-page.tsx` |

## 비교 결과

| 기능 | 원본 근거 | 현재 상태 | 판정 | 수정 반영 |
| --- | --- | --- | --- | --- |
| `어제/오늘` 빠른 검색 | 상단 버튼 | 동일 버튼 유지 | 복구 완료 | 프리셋 날짜 적용 반영 |
| 시작일/종료일 검색 | 검색 폼 | 동일 검색 제공 | 복구 완료 | 기간 조회 반영 |
| 다운로드 | `export` 버튼 | 엑셀 다운로드 제공 | 복구 완료 | 현재 export util로 연결 |
| 결과 테이블 컬럼 | 원본 테이블 11열 | 동일 11열 복구 | 복구 완료 | `서비스명`, `URL`, `총시간`, `비고` 반영 |
| 인라인 수정/삭제 | 원본 없음 | 현재도 없음 | 정리 완료 | 불필요 편집 동작 제거 |
