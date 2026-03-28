# Legacy -> Supabase 마이그레이션 매뉴얼

## 순서

1. Supabase SQL Editor에서 [000_initial_ops_schema.sql](/Volumes/workspace/workspace/my-works/supabase/migrations/000_initial_ops_schema.sql) 실행
2. Supabase SQL Editor에서 [001_legacy_stage_schema.sql](/Volumes/workspace/workspace/my-works/supabase/sql/001_legacy_stage_schema.sql) 실행
3. Docker로 MariaDB 실행 후 [db_a11yop_2507071945.sql](/Volumes/workspace/workspace/my-works/db_a11yop_2507071945.sql) 복원
4. `.env.legacy` 작성 후 `pnpm legacy:stage` 실행 - "legacy:stage": "bash scripts/load_legacy_stage.sh",
5. [002_legacy_migrate.sql](/Volumes/workspace/workspace/my-works/supabase/sql/002_legacy_migrate.sql)을 `psql`로 직접 실행
6. [003_legacy_verify.sql](/Volumes/workspace/workspace/my-works/supabase/sql/003_legacy_verify.sql) 실행
7. `public.members.email` 실제 이메일 반영 후 Supabase Auth 연결
8. 관리자 초대 메일 기능을 쓸 경우 `invite-member` 함수 배포 및 설정

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

- [000_initial_ops_schema.sql](/Volumes/workspace/workspace/my-works/supabase/migrations/000_initial_ops_schema.sql)

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

## 8. 관리자 초대 메일 기능 설정

관리자 초대 메일은 앱 코드만 배포해서 끝나지 않는다. Supabase 쪽 설정이 추가로 필요하다.

### 필요한 전제

- `public.members.email`에 실제 초대 대상 이메일이 들어 있어야 한다.
- 초대 메일을 보내는 관리자 계정은 `public.members.auth_user_id`가 연결돼 있어야 한다.
- 초대 메일을 보내는 관리자 계정은 `public.members.user_level = 1` 이어야 한다.
- 초대 메일을 보내는 관리자 계정은 `public.members.user_active = true` 이어야 한다.

### Auth Redirect URL 등록

Supabase Dashboard -> Authentication -> URL Configuration 에 아래 경로를 허용한다.

- 개발 예시: `http://localhost:5173/auth/recovery`
- 운영 예시: `https://<실서비스도메인>/auth/recovery`

### Edge Function 시크릿 등록

```bash
supabase secrets set \
  SUPABASE_URL=https://<project-ref>.supabase.co \
  SUPABASE_ANON_KEY=<anon-key> \
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### Edge Function 배포

```bash
supabase functions deploy invite-member
```

### 실제 완료 기준

아래가 모두 확인되면 관리자 초대 기능이 끝난 것이다.

1. 관리자 화면에서 사용자 추가 후 `저장 및 초대` 클릭
2. 초대 대상 이메일로 메일이 도착
3. 사용자가 메일 링크로 진입
4. 앱의 비밀번호 설정 화면에서 비밀번호 저장
5. 저장 후 로그인 가능

즉, `invite-member`를 배포하는 것만으로 끝나는 것이 아니라:

- Redirect URL 등록
- 시크릿 등록
- 함수 배포
- 관리자 계정 권한/연결 상태 확인
- 실제 메일 수신 및 가입 완료 검증

까지 해야 운영 완료다.
