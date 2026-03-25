scripts/load_legacy_stage.sh#!/usr/bin/env bash
set -euo pipefail

env_file="${ENV_FILE:-.env.legacy}"
if [[ -f "$env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
fi

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "missing required env: $name" >&2
    exit 1
  fi
}

require_env MYSQL_HOST
require_env MYSQL_PORT
require_env MYSQL_USER
require_env MYSQL_PASSWORD
require_env MYSQL_DATABASE
require_env SUPABASE_DB_URL

tmp_root="${PWD}/.tmp"
mkdir -p "$tmp_root"
tmp_dir="$(mktemp -d "$tmp_root/legacy-stage.XXXXXX")"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

mysql_image="mysql:8.4"
postgres_image="postgres:16"

mysql_export() {
  local output_file="$1"
  local sql="$2"

  docker run --rm \
    -e MYSQL_HOST \
    -e MYSQL_PORT \
    -e MYSQL_USER \
    -e MYSQL_PASSWORD \
    -e MYSQL_DATABASE \
    "$mysql_image" \
    sh -lc '
      MYSQL_PWD="$MYSQL_PASSWORD" mysql \
        --default-character-set=utf8mb4 \
        --batch \
        --skip-column-names \
        -h "$MYSQL_HOST" \
        -P "$MYSQL_PORT" \
        -u "$MYSQL_USER" \
        "$MYSQL_DATABASE" \
        -e "$1"
    ' sh "$sql" > "$output_file"
}

pg_import() {
  local input_file="$1"
  local target_table="$2"

  docker run --rm -i \
    -e SUPABASE_DB_URL \
    -e TARGET_TABLE="$target_table" \
    "$postgres_image" \
    sh -lc '
      psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
        -c "truncate table ${TARGET_TABLE};" \
        -c "\\copy ${TARGET_TABLE} from stdin with (format text)"
    ' < "$input_file"
}

copy_table() {
  local file_name="$1"
  local target_table="$2"
  local sql="$3"
  local output_path="$tmp_dir/$file_name"

  echo "exporting -> $file_name"
  mysql_export "$output_path" "$sql"

  echo "importing -> $target_table"
  pg_import "$output_path" "$target_table"
}

copy_table "user_tbl.txt" "legacy_stage.user_tbl" "
select
  user_num,
  user_id,
  user_pwd,
  user_name,
  user_level,
  user_lastlogin,
  user_create,
  user_active,
  report_required
from USER_TBL
order by user_num
"

copy_table "type_tbl.txt" "legacy_stage.type_tbl" "
select
  type_num,
  type_one,
  type_two,
  type_etc,
  type_include_svc,
  type_active
from TYPE_TBL
order by type_num
"

copy_table "svc_group_tbl.txt" "legacy_stage.svc_group_tbl" "
select
  svc_num,
  svc_group,
  svc_name,
  svc_type,
  svc_active
from SVC_GROUP_TBL
order by svc_num
"

copy_table "pj_tbl.txt" "legacy_stage.pj_tbl" "
select
  pj_num,
  pj_group_type1,
  pj_platform,
  pj_sev_group,
  pj_sev_name,
  pj_name,
  pj_page_report_url,
  pj_reporter,
  pj_reviewer,
  pj_date,
  pj_start_date,
  pj_end_date,
  pj_group_type2,
  pj_month,
  pj_agit_url,
  pj_err_highest,
  pj_err_high,
  pj_err_normal,
  pj_err_low,
  pj_err_ut,
  pj_agit_date,
  pj_track_etc
from PJ_TBL
order by pj_num
"

copy_table "pj_page_tbl.txt" "legacy_stage.pj_page_tbl" "
select
  pj_page_num,
  pj_unique_num,
  pj_page_name,
  pj_page_url,
  pj_page_etc,
  pj_page_id,
  pj_page_agit,
  pj_page_agit_url,
  pj_page_track1,
  pj_page_track2,
  pj_page_track3,
  pj_page_track4,
  pj_page_track_end,
  pj_page_highest,
  pj_page_high,
  pj_page_normal,
  pj_page_track_etc,
  pj_page_report,
  pj_page_creat,
  pj_page_date
from PJ_PAGE_TBL
order by pj_page_num
"

copy_table "task_tbl.txt" "legacy_stage.task_tbl" "
select
  task_num,
  task_date,
  task_user,
  task_type1,
  task_type2,
  task_platform,
  task_svc_group,
  task_svc_name,
  task_pj_name,
  task_pj_page,
  task_pj_page_url,
  task_manager,
  task_count_element,
  task_count_error,
  task_count_errortask,
  task_estimated,
  task_test_report,
  task_communication,
  task_review,
  task_usedtime,
  task_etc,
  task_allcount,
  task_pj_report_num,
  task_page_report_num
from TASK_TBL
order by task_num
"

echo "legacy_stage load complete"
