# Legacy -> Supabase 마이그레이션 매뉴얼

## 순서

1. Supabase SQL Editor에서 [20260324_000001_initial_ops_schema.sql](/Volumes/workspace/workspace/my-works/supabase/migrations/20260324_000001_initial_ops_schema.sql) 실행
2. Supabase SQL Editor에서 [001_legacy_stage_schema.sql](/Volumes/workspace/workspace/my-works/supabase/sql/001_legacy_stage_schema.sql) 실행
3. Docker로 MariaDB 실행 후 [db_a11yop_2507071945.sql](/Volumes/workspace/workspace/my-works/db_a11yop_2507071945.sql) 복원
4. `.env.legacy` 작성 후 `pnpm legacy:stage` 실행
5. [002_legacy_migrate.sql](/Volumes/workspace/workspace/my-works/supabase/sql/002_legacy_migrate.sql)을 `psql`로 직접 실행
6. [003_legacy_verify.sql](/Volumes/workspace/workspace/my-works/supabase/sql/003_legacy_verify.sql) 실행
7. `public.members.email` 실제 이메일 반영 후 Supabase Auth 연결

## 스키마 역할

| 스키마 | 역할 |
| --- | --- |
| `public.*` | 실제 운영 테이블 |
| `legacy_stage.*` | MySQL dump 원본을 임시로 받아두는 적재본 |
| `legacy_xref.*` | 레거시 ID와 Supabase ID 매핑표 |

주의:

- 마이그레이션 직후에는 `legacy_stage.*`, `legacy_xref.*`를 지우지 않는다.
- 검증과 운영 확인이 끝난 뒤에만 정리한다.

## 1. Supabase 초기 SQL

실행 파일:

- [20260324_000001_initial_ops_schema.sql](/Volumes/workspace/workspace/my-works/supabase/migrations/20260324_000001_initial_ops_schema.sql)

## 2. Supabase staging SQL

실행 파일:

- [001_legacy_stage_schema.sql](/Volumes/workspace/workspace/my-works/supabase/sql/001_legacy_stage_schema.sql)

주의:

- 이 파일은 `legacy_stage`, `legacy_xref`를 다시 만든다.
- 이미 `pnpm legacy:stage`까지 끝난 뒤에는 다시 실행하지 않는다.

## 3. MariaDB 실행 및 dump 복원

컨테이너 실행:

```bash
docker run --name legacy-mysql -e MARIADB_ROOT_PASSWORD=pass -e MARIADB_DATABASE=a11y_op -p 3307:3306 -d mariadb:10.11
```

dump 복원:

```bash
docker exec -i legacy-mysql mariadb -uroot -ppass a11y_op < db_a11yop_2507071945.sql
```

테이블 확인:

```bash
docker exec -it legacy-mysql mariadb -uroot -ppass a11y_op -e "show tables like 'USER_TBL';"
docker exec -it legacy-mysql mariadb -uroot -ppass a11y_op -e "show tables like 'TASK_TBL';"
```

확인할 원본 테이블:

- `USER_TBL`
- `TYPE_TBL`
- `SVC_GROUP_TBL`
- `PJ_TBL`
- `PJ_PAGE_TBL`
- `TASK_TBL`

## 4. `legacy_stage` 적재

환경파일 생성:

```bash
cp .env.legacy.example .env.legacy
```

`.env.legacy` 값:

- `MYSQL_HOST=host.docker.internal`
- `MYSQL_PORT=3307`
- `MYSQL_USER=root`
- `MYSQL_PASSWORD=pass`
- `MYSQL_DATABASE=a11y_op`
- `SUPABASE_DB_URL=Session pooler URI`

중요:

- `SUPABASE_DB_URL`은 **Direct connection URI가 아니라 Session pooler URI**를 넣는다.
- 예전처럼 `db.<project-ref>.supabase.co:5432` direct 주소를 넣으면 DNS 문제로 실패할 수 있다.

실행:

```bash
pnpm legacy:stage
```

이 명령이 자동으로 하는 일:

- `USER_TBL` -> `legacy_stage.user_tbl`
- `TYPE_TBL` -> `legacy_stage.type_tbl`
- `SVC_GROUP_TBL` -> `legacy_stage.svc_group_tbl`
- `PJ_TBL` -> `legacy_stage.pj_tbl`
- `PJ_PAGE_TBL` -> `legacy_stage.pj_page_tbl`
- `TASK_TBL` -> `legacy_stage.task_tbl`

## 5. 실제 마이그레이션 실행

`002_legacy_migrate.sql`은 SQL Editor에서 timeout 날 수 있다. `psql`로 직접 실행한다.

실행 전:

```bash
set -a
source .env.legacy
set +a
```

실행:

```bash
docker run --rm -i -e SUPABASE_DB_URL postgres:16 sh -lc 'psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1' < supabase/sql/002_legacy_migrate.sql
```

`002`는 `tasks` 처리 구간에서 오래 걸릴 수 있다.

## 도커 명령 모음

MariaDB 컨테이너 생성:

```bash
docker run --name legacy-mysql -e MARIADB_ROOT_PASSWORD=pass -e MARIADB_DATABASE=a11y_op -p 3307:3306 -d mariadb:10.11
```

dump 복원:

```bash
docker exec -i legacy-mysql mariadb -uroot -ppass a11y_op < db_a11yop_2507071945.sql
```

테이블 확인:

```bash
docker exec -it legacy-mysql mariadb -uroot -ppass a11y_op -e "show tables like 'USER_TBL';"
docker exec -it legacy-mysql mariadb -uroot -ppass a11y_op -e "show tables like 'TASK_TBL';"
```

`002_legacy_migrate.sql` 직접 실행:

```bash
docker run --rm -i -e SUPABASE_DB_URL postgres:16 sh -lc 'psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1' < supabase/sql/002_legacy_migrate.sql
```

## 6. 검증

실행 파일:

- [003_legacy_verify.sql](/Volumes/workspace/workspace/my-works/supabase/sql/003_legacy_verify.sql)

확인 기준:

- `unmapped_* = 0`
- `*_missing = 0`

## 7. 최종 매핑

| MySQL 원본 | Supabase staging | Supabase 최종 |
| --- | --- | --- |
| `USER_TBL` | `legacy_stage.user_tbl` | `public.members` |
| `TYPE_TBL` | `legacy_stage.type_tbl` | `public.task_types` |
| `SVC_GROUP_TBL` | `legacy_stage.svc_group_tbl` | `public.service_groups` |
| `PJ_TBL` | `legacy_stage.pj_tbl` | `public.projects` |
| `PJ_PAGE_TBL` | `legacy_stage.pj_page_tbl` | `public.project_pages` |
| `TASK_TBL` | `legacy_stage.task_tbl` | `public.tasks` |
