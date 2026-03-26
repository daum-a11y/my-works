# 데이터 마이그레이션 실행 메뉴얼

사용 파일:
- MySQL dump: [/Users/gio.a/Documents/workspace/next/php-operation_tool/db_a11yop_2512041025.sql](/Users/gio.a/Documents/workspace/next/php-operation_tool/db_a11yop_2512041025.sql)
- Supabase 앱 스키마: [/Users/gio.a/Documents/workspace/next/my-works/supabase/migrations/20260324_000001_initial_ops_schema.sql](/Users/gio.a/Documents/workspace/next/my-works/supabase/migrations/20260324_000001_initial_ops_schema.sql)
- Supabase staging 생성: [/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/001_legacy_stage_schema.sql](/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/001_legacy_stage_schema.sql)
- Supabase 변환 적재: [/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/002_legacy_migrate.sql](/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/002_legacy_migrate.sql)
- Supabase 검증: [/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/003_legacy_verify.sql](/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/003_legacy_verify.sql)

## 1. MySQL에서 할 일

1. 새 MySQL DB를 만든다.
2. dump를 MySQL에 그대로 복원한다.

```bash
mysql -u <MYSQL_USER> -p <MYSQL_DB> < /Users/gio.a/Documents/workspace/next/php-operation_tool/db_a11yop_2512041025.sql
```

3. 아래 6개 테이블이 조회되는지 확인한다.
- `USER_TBL`
- `TYPE_TBL`
- `SVC_GROUP_TBL`
- `PJ_TBL`
- `PJ_PAGE_TBL`
- `TASK_TBL`

4. 아래 6개 테이블을 CSV로 export 한다.
- `USER_TBL`
- `TYPE_TBL`
- `SVC_GROUP_TBL`
- `PJ_TBL`
- `PJ_PAGE_TBL`
- `TASK_TBL`

5. CSV export 조건
- 컬럼 헤더 유지
- UTF-8 저장
- 값 보정 금지
- 컬럼명 변경 금지
- NULL 치환 금지

## 2. Supabase/Postgres에서 할 일

1. 새 DB 또는 비어 있는 대상 DB에 앱 기본 스키마를 적용한다.
- [/Users/gio.a/Documents/workspace/next/my-works/supabase/migrations/20260324_000001_initial_ops_schema.sql](/Users/gio.a/Documents/workspace/next/my-works/supabase/migrations/20260324_000001_initial_ops_schema.sql)
- 이 단계에 `members_public_view`, `active_members_public_view`, `project_pages_public_view`, `bind_auth_session_member(...)`, `admin_search_tasks(...)`, `upsert_project_page(...)` 보정이 포함된다.

2. staging/xref 스키마를 만든다.
- [/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/001_legacy_stage_schema.sql](/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/001_legacy_stage_schema.sql)

3. 아래 테이블이 생성됐는지 확인한다.
- `legacy_stage.user_tbl`
- `legacy_stage.type_tbl`
- `legacy_stage.svc_group_tbl`
- `legacy_stage.pj_tbl`
- `legacy_stage.pj_page_tbl`
- `legacy_stage.task_tbl`
- `legacy_xref.members`
- `legacy_xref.task_types`
- `legacy_xref.service_groups`
- `legacy_xref.projects`
- `legacy_xref.project_pages`
- `legacy_xref.tasks`

4. MySQL에서 export 한 CSV를 아래 테이블에 import 한다.
- `USER_TBL.csv` -> `legacy_stage.user_tbl`
- `TYPE_TBL.csv` -> `legacy_stage.type_tbl`
- `SVC_GROUP_TBL.csv` -> `legacy_stage.svc_group_tbl`
- `PJ_TBL.csv` -> `legacy_stage.pj_tbl`
- `PJ_PAGE_TBL.csv` -> `legacy_stage.pj_page_tbl`
- `TASK_TBL.csv` -> `legacy_stage.task_tbl`

5. raw staging 데이터를 앱 스키마로 변환 적재한다.
- [/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/002_legacy_migrate.sql](/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/002_legacy_migrate.sql)

6. 아래 테이블에 데이터가 들어갔는지 확인한다.
- `public.members`
- `public.task_types`
- `public.service_groups`
- `public.projects`
- `public.project_pages`
- `public.tasks`

7. 아래 crosswalk가 채워졌는지 확인한다.
- `legacy_xref.members`
- `legacy_xref.task_types`
- `legacy_xref.service_groups`
- `legacy_xref.projects`
- `legacy_xref.project_pages`
- `legacy_xref.tasks`

8. 검증 SQL을 실행한다.
- [/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/003_legacy_verify.sql](/Users/gio.a/Documents/workspace/next/my-works/supabase/sql/003_legacy_verify.sql)

9. 아래 항목을 확인한다.
- stage/public/xref 건수
- unmapped row 수
- orphan row 수
- 사용자별 task 집계
- 미적재 task 샘플

## 3. 실제 전체 실행 순서

1. MySQL에 dump 복원
2. MySQL 6개 테이블 CSV export
3. Supabase에 `20260324_000001_initial_ops_schema.sql` 적용
4. Supabase에 `001_legacy_stage_schema.sql` 적용
5. Supabase `legacy_stage.*`에 CSV import
6. Supabase에 `002_legacy_migrate.sql` 실행
7. Supabase에 `003_legacy_verify.sql` 실행

## 4. 이관 중단 조건

아래 중 하나라도 있으면 이관 완료로 처리하지 않는다.

1. `003` 결과에 `unmapped_*`가 1건 이상
2. `tasks.member_missing`, `tasks.project_missing`, `tasks.page_missing`, `tasks.task_type_missing`가 1건 이상
3. stage/public/xref 건수가 기대와 다름
