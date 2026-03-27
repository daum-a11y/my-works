## 보고 대상

| 항목 | 내용 |
| --- | --- |
| 원본 페이지 | `php-operation_tool/webapp/pages/project.php` |
| 원본 근거 | `js/project.js`, `dbcon/pj_select.php`, `dbcon/sv_group_select.php`, `dbcon/member_select.php` |
| 현재 구현 | `src/features/projects/ProjectsFeature.tsx`, `src/lib/data-client.ts` |

## 비교 결과

| 기능 | 원본 근거 | 현재 상태 | 판정 | 수정 반영 |
| --- | --- | --- | --- | --- |
| `전체/전년 하반기/올해 상반기/올해 하반기/검색` | 상단 검색 버튼 | 동일 검색축 복구 | 복구 완료 | scope 버튼/검색 반영 |
| 프로젝트 리스트 컬럼 | 원본 테이블 | 타입1 포함 컬럼 복구 | 복구 완료 | 플랫폼, 서비스그룹, 프로젝트명, 보고서URL, QA일정, 리포터, 리뷰어 복구 |
| 프로젝트 추가 | `add_pj_div` | 현재 추가 가능 | 복구 완료 | 모달 추가폼 반영 |
| 프로젝트 수정 | `pj_selected > infopj` | 현재 수정 가능 | 복구 완료 | 편집 패널 반영 |
| 프로젝트 삭제 | 원본 JS 관리 기능 | 현재 삭제 가능 | 복구 완료 | delete mutation 추가 |
| 페이지 리스트 | `infopj_page` | 현재 리스트 표시 | 복구 완료 | 선택 프로젝트 기준 목록 반영 |
| 페이지 추가 | `page_add_btn`, `add_page` | 현재 추가 가능 | 복구 완료 | add page panel 반영 |
| 페이지 수정 | 페이지 카드 편집 | 현재 수정 가능 | 복구 완료 | 저장 confirm 포함 |
| 페이지 삭제 | 원본 JS 관리 기능 | 현재 삭제 가능 | 복구 완료 | delete mutation 추가 |

## 구조 예외

| 항목 | 사유 |
| --- | --- |
| 없음 | 덤프 기준 `pj_group_type1` 대응 필드 반영 |
