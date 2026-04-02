# 데이터 마이그레이션 가이드

이 저장소의 데이터 마이그레이션 기준은 아래 한 줄입니다.

- 로컬 MySQL source dump를 정제해서 SQL 산출물을 만든 뒤, 나중에 Supabase에는 그 결과만 반영한다.

`staging/xref` 같은 임시 스키마를 만들지 않습니다.

## 1. 입력

원본 입력은 MySQL dump 안의 아래 6개 테이블입니다.

- `USER_TBL`
- `TYPE_TBL`
- `SVC_GROUP_TBL`
- `PJ_TBL`
- `PJ_PAGE_TBL`
- `TASK_TBL`

## 2. 로컬 준비

로컬에서 MySQL dump를 먼저 복원합니다.

예시:

```bash
docker run --name myworks-source-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=a11y_op \
  -d mysql:8.4
```

```bash
docker exec -i myworks-source-mysql sh -lc 'exec mysql -uroot -prootpass a11y_op' < db_a11yop_2505151137.sql
```

테이블 확인:

```bash
docker exec myworks-source-mysql sh -lc 'MYSQL_PWD=rootpass mysql -uroot a11y_op -e "show tables;"'
```

## 3. 정제 SQL 생성

정제 스크립트:

- [`/Volumes/workspace/workspace/my-works/scripts/build_refined_dump.py`](/Volumes/workspace/workspace/my-works/scripts/build_refined_dump.py)

실행:

```bash
SOURCE_MYSQL_CONTAINER=myworks-source-mysql \
SOURCE_MYSQL_DATABASE=a11y_op \
SOURCE_MYSQL_USER=root \
SOURCE_MYSQL_PASSWORD=rootpass \
python3 scripts/build_refined_dump.py
```

생성 결과:

- [`/Volumes/workspace/workspace/my-works/output/refined_dump.sql`](/Volumes/workspace/workspace/my-works/output/refined_dump.sql)
- [`/Volumes/workspace/workspace/my-works/output/refined_dump_tasks.sql`](/Volumes/workspace/workspace/my-works/output/refined_dump_tasks.sql)

구성:

- `refined_dump.sql`: `members`, `cost_groups`, `task_types`, `service_groups`, `platforms`, `projects`, `project_pages`
- `refined_dump_tasks.sql`: `tasks`

`tasks`는 분리 파일입니다. 먼저 `refined_dump.sql`이 들어간 뒤에 적용합니다.

## 4. 반영 순서

나중에 Supabase를 다시 사용할 수 있을 때 반영 순서는 아래입니다.

1. [`/Volumes/workspace/workspace/my-works/supabase/sql/000_initial_ops_schema.sql`](/Volumes/workspace/workspace/my-works/supabase/sql/000_initial_ops_schema.sql)
2. [`/Volumes/workspace/workspace/my-works/output/refined_dump.sql`](/Volumes/workspace/workspace/my-works/output/refined_dump.sql)
3. [`/Volumes/workspace/workspace/my-works/output/refined_dump_tasks.sql`](/Volumes/workspace/workspace/my-works/output/refined_dump_tasks.sql)
4. 필요 시 [`/Volumes/workspace/workspace/my-works/supabase/sql/006_public_health_check.sql`](/Volumes/workspace/workspace/my-works/supabase/sql/006_public_health_check.sql)

즉, source dump 정제와 Supabase 반영은 분리합니다.

## 5. 점검 포인트

정제 스크립트는 실행 후 각 테이블 건수를 JSON으로 출력합니다.

우선 확인할 항목:

- `members`
- `projects`
- `project_pages`
- `tasks`

현재 정제 규칙상 아래 행은 자동 제외될 수 있습니다.

- 원본 프로젝트가 없는 페이지 행
- 사용자 식별이 불가능한 task 행

이 경우는 정제 결과를 보고 별도 보정 여부를 결정합니다.
