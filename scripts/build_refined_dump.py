#!/usr/bin/env python3
import base64
import json
import os
import re
import subprocess
import uuid
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "output" / "refined_dump.sql"
TASKS_OUTPUT_PATH = ROOT / "output" / "refined_dump_tasks.sql"
NAMESPACE = uuid.UUID("d91931fa-cd95-4590-849f-e4b98566ef4b")


def run_mysql_json_query(query: str):
    container = os.environ.get("SOURCE_MYSQL_CONTAINER", "myworks_migtest_mysql")
    database = os.environ.get("SOURCE_MYSQL_DATABASE", "a11y_op")
    user = os.environ.get("SOURCE_MYSQL_USER", "root")
    password = os.environ.get("SOURCE_MYSQL_PASSWORD", "rootpass")
    cmd = [
        "docker",
        "exec",
        container,
        "sh",
        "-lc",
        (
            f"MYSQL_PWD={shell_quote(password)} mysql --default-character-set=utf8mb4 "
            f"-N -B -u{shell_quote(user)} {shell_quote(database)} -e {shell_quote(query)}"
        ),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
    lines = [line for line in proc.stdout.splitlines() if line.strip()]
    return [json.loads(base64.b64decode(line).decode("utf-8")) for line in lines]


def shell_quote(value: str) -> str:
    return "'" + value.replace("'", "'\"'\"'") + "'"


def sql_json_object(table: str, columns, order_by: str):
    parts = []
    for col in columns:
        parts.append(f"'{col}'")
        parts.append(col)
    return (
        "select replace(to_base64(cast(json_object("
        + ", ".join(parts)
        + f") as char character set utf8mb4)), '\n', '') from {table} order by {order_by};"
    )


def blank_to_none(value):
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() == "null":
        return None
    return text


def bool_flag(value, default=True):
    text = blank_to_none(value)
    if text is None:
        return default
    return text.lower() in {"1", "y", "yes", "true"}


def parse_date(value):
    text = blank_to_none(value)
    if text is None or text.startswith("0000-00-00"):
        return None
    return text[:10]


def parse_timestamp(value):
    text = blank_to_none(value)
    if text is None or text.startswith("0000-00-00"):
        return None
    return text.replace("T", " ")


def normalize_space(value):
    text = blank_to_none(value)
    if text is None:
        return None
    return re.sub(r"\s+", " ", text).strip()


def normalize_service_name(service_group, service_name):
    group = blank_to_none(service_group)
    name = blank_to_none(service_name)
    if group is None and name is None:
        return "미분류"
    if group is None:
        return name
    if name is None:
        return group
    return f"{group} / {name}"


def stable_uuid(kind: str, source_key):
    return str(uuid.uuid5(NAMESPACE, f"{kind}:{source_key}"))


def sql_literal(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, Decimal):
        return format(value, "f")
    text = str(value).replace("'", "''")
    return f"'{text}'"


def insert_block(table: str, columns, rows, chunk_size=None):
    if not rows:
        return []
    lines = []
    if chunk_size is None or chunk_size <= 0:
        chunk_size = len(rows)
    for start in range(0, len(rows), chunk_size):
        chunk = rows[start : start + chunk_size]
        lines.append(f"insert into {table} ({', '.join(columns)}) values")
        values = []
        for row in chunk:
            values.append(
                "(" + ", ".join(sql_literal(row[col]) for col in columns) + ")"
            )
        lines.append(",\n".join(values) + ";")
    return lines


def compose_page_note(row):
    parts = []
    mapping = [
        ("page_etc", blank_to_none(row["pj_page_etc"])),
        ("agit_date", parse_date(row["pj_page_agit"])),
        ("agit_url", blank_to_none(row["pj_page_agit_url"])),
        ("track1", parse_date(row["pj_page_track1"])),
        ("track2", parse_date(row["pj_page_track2"])),
        ("track3", parse_date(row["pj_page_track3"])),
        ("track4", parse_date(row["pj_page_track4"])),
        ("track_etc", blank_to_none(row["pj_page_track_etc"])),
        ("report_date", parse_date(row["pj_page_report"])),
        ("created_date", parse_date(row["pj_page_creat"])),
    ]
    for label, value in mapping:
        if value is not None:
            parts.append(f"{label}: {value}")
    return "\n".join(parts)


def compose_task_note(row):
    parts = []
    fields = [
        ("platform", blank_to_none(row["task_platform"])),
        ("service_group", blank_to_none(row["task_svc_group"])),
        ("service_name", blank_to_none(row["task_svc_name"])),
        ("project_name", blank_to_none(row["task_pj_name"])),
        ("page_name", blank_to_none(row["task_pj_page"])),
        ("page_url", blank_to_none(row["task_pj_page_url"])),
        ("manager", blank_to_none(row["task_manager"])),
        ("count_element", row["task_count_element"]),
        ("count_error", row["task_count_error"]),
        ("count_errortask", row["task_count_errortask"]),
        ("estimated", row["task_estimated"]),
        ("test_report", row["task_test_report"]),
        ("communication", row["task_communication"]),
        ("review", row["task_review"]),
        ("allcount", row["task_allcount"]),
        ("raw_note", blank_to_none(row["task_etc"])),
    ]
    for label, value in fields:
        if value is not None:
            parts.append(f"{label}: {value}")
    return "\n".join(parts)


def task_content(row):
    candidates = [
        blank_to_none(row["task_pj_page"]),
        blank_to_none(row["task_pj_name"]),
        blank_to_none(row["task_etc"]),
        normalize_service_name(row["task_platform"], row["task_svc_group"])
        if blank_to_none(row["task_svc_name"]) is not None
        else None,
    ]
    for candidate in candidates:
        if candidate:
            return candidate
    type1 = blank_to_none(row["task_type1"]) or "미분류"
    type2 = blank_to_none(row["task_type2"]) or ""
    return f"{type1} / {type2}" if type2 else type1


def build_dump():
    users = run_mysql_json_query(
        sql_json_object(
            "USER_TBL",
            [
                "user_num",
                "user_id",
                "user_name",
                "user_level",
                "user_lastlogin",
                "user_create",
                "user_active",
                "report_required",
            ],
            "user_num",
        )
    )
    types = run_mysql_json_query(
        sql_json_object(
            "TYPE_TBL",
            [
                "type_num",
                "type_one",
                "type_two",
                "type_etc",
                "type_include_svc",
                "type_active",
            ],
            "type_num",
        )
    )
    service_groups = run_mysql_json_query(
        sql_json_object(
            "SVC_GROUP_TBL",
            ["svc_num", "svc_group", "svc_name", "svc_type", "svc_active"],
            "svc_num",
        )
    )
    projects = run_mysql_json_query(
        sql_json_object(
            "PJ_TBL",
            [
                "pj_num",
                "pj_group_type1",
                "pj_platform",
                "pj_sev_group",
                "pj_sev_name",
                "pj_name",
                "pj_page_report_url",
                "pj_reporter",
                "pj_reviewer",
                "pj_date",
                "pj_start_date",
                "pj_end_date",
                "pj_month",
            ],
            "pj_num",
        )
    )
    pages = run_mysql_json_query(
        sql_json_object(
            "PJ_PAGE_TBL",
            [
                "pj_page_num",
                "pj_unique_num",
                "pj_page_name",
                "pj_page_url",
                "pj_page_etc",
                "pj_page_id",
                "pj_page_agit",
                "pj_page_agit_url",
                "pj_page_track1",
                "pj_page_track2",
                "pj_page_track3",
                "pj_page_track4",
                "pj_page_track_end",
                "pj_page_track_etc",
                "pj_page_report",
                "pj_page_creat",
                "pj_page_date",
            ],
            "pj_page_num",
        )
    )
    tasks = run_mysql_json_query(
        sql_json_object(
            "TASK_TBL",
            [
                "task_num",
                "task_date",
                "task_user",
                "task_type1",
                "task_type2",
                "task_platform",
                "task_svc_group",
                "task_svc_name",
                "task_pj_name",
                "task_pj_page",
                "task_pj_page_url",
                "task_manager",
                "task_count_element",
                "task_count_error",
                "task_count_errortask",
                "task_estimated",
                "task_test_report",
                "task_communication",
                "task_review",
                "task_usedtime",
                "task_etc",
                "task_allcount",
                "task_pj_report_num",
                "task_page_report_num",
            ],
            "task_num",
        )
    )

    member_rows = []
    member_by_account = {}
    for row in users:
        account_id = blank_to_none(row["user_id"]) or f"member-{row['user_num']}"
        account_key = account_id.lower()
        member = {
            "id": stable_uuid("member", row["user_num"]),
            "auth_user_id": None,
            "account_id": account_id,
            "name": blank_to_none(row["user_name"]) or account_id or "이름없음",
            "email": f"{account_key}@linkagelab.co.kr",
            "note": "",
            "user_level": int(row["user_level"] or 0),
            "user_active": bool_flag(row["user_active"], True),
            "member_status": "active",
            "report_required": bool_flag(row["report_required"], True),
            "joined_at": parse_timestamp(row["user_create"]) or "1970-01-01 00:00:00",
            "last_login_at": parse_timestamp(row["user_lastlogin"]),
            "created_at": parse_timestamp(row["user_create"]) or "1970-01-01 00:00:00",
            "updated_at": parse_timestamp(row["user_create"]) or "1970-01-01 00:00:00",
        }
        member_rows.append(member)
        member_by_account[account_key] = member

    for row in tasks:
        account_id = blank_to_none(row["task_user"])
        if not account_id:
            continue
        account_key = account_id.lower()
        if account_key in member_by_account:
            continue
        member = {
            "id": stable_uuid("member-task-only", account_key),
            "auth_user_id": None,
            "account_id": account_id,
            "name": account_id,
            "email": f"{account_key}@linkagelab.co.kr",
            "note": "source-only member",
            "user_level": 0,
            "user_active": False,
            "member_status": "pending",
            "report_required": True,
            "joined_at": "1970-01-01 00:00:00",
            "last_login_at": None,
            "created_at": "1970-01-01 00:00:00",
            "updated_at": "1970-01-01 00:00:00",
        }
        member_rows.append(member)
        member_by_account[account_key] = member

    task_type_rows = []
    task_type_by_pair = {}
    for row in types:
        type1 = blank_to_none(row["type_one"]) or "미분류"
        type2 = blank_to_none(row["type_two"]) or ""
        pair = (type1, type2)
        task = {
            "id": stable_uuid("task-type", row["type_num"]),
            "source_type_num": int(row["type_num"]),
            "type1": type1,
            "type2": type2,
            "display_label": blank_to_none(row["type_etc"]) or "",
            "requires_service_group": bool_flag(row["type_include_svc"], False),
            "display_order": int(row["type_num"]),
            "is_active": bool_flag(row["type_active"], True),
            "created_at": "1970-01-01 00:00:00",
            "updated_at": "1970-01-01 00:00:00",
        }
        task_type_rows.append(task)
        task_type_by_pair.setdefault(pair, task)

    cost_group_rows = [
        {
            "id": stable_uuid("cost-group", 1),
            "source_cost_group_code": 1,
            "name": "카카오",
            "display_order": 1,
            "is_active": True,
            "created_at": "1970-01-01 00:00:00",
            "updated_at": "1970-01-01 00:00:00",
        },
        {
            "id": stable_uuid("cost-group", 2),
            "source_cost_group_code": 2,
            "name": "공동체",
            "display_order": 2,
            "is_active": True,
            "created_at": "1970-01-01 00:00:00",
            "updated_at": "1970-01-01 00:00:00",
        },
        {
            "id": stable_uuid("cost-group", 3),
            "source_cost_group_code": 3,
            "name": "외부",
            "display_order": 3,
            "is_active": True,
            "created_at": "1970-01-01 00:00:00",
            "updated_at": "1970-01-01 00:00:00",
        },
    ]
    cost_group_by_code = {row["source_cost_group_code"]: row for row in cost_group_rows}

    service_group_rows = []
    service_group_by_source = {}
    service_group_by_name = {}
    for row in service_groups:
        name = normalize_service_name(row["svc_group"], row["svc_name"])
        code_text = blank_to_none(row["svc_type"])
        code = int(code_text) if code_text and code_text.isdigit() else None
        group = {
            "id": stable_uuid("service-group", row["svc_num"]),
            "source_service_num": int(row["svc_num"]),
            "name": name,
            "cost_group_id": cost_group_by_code.get(code, {}).get("id"),
            "display_order": int(row["svc_num"]),
            "is_active": bool_flag(row["svc_active"], True),
            "created_at": "1970-01-01 00:00:00",
            "updated_at": "1970-01-01 00:00:00",
        }
        service_group_rows.append(group)
        service_group_by_source[group["source_service_num"]] = group
        service_group_by_name.setdefault(name, group)

    platform_rows = []
    platform_by_name = {}
    platform_order = {}
    for row in projects:
        name = blank_to_none(row["pj_platform"]) or "미분류"
        platform_order.setdefault(name, int(row["pj_num"]))
        platform_order[name] = min(platform_order[name], int(row["pj_num"]))
    for name, display_order in sorted(platform_order.items(), key=lambda item: item[1]):
        platform = {
            "id": stable_uuid("platform", name),
            "source_platform_name": name,
            "name": name,
            "display_order": display_order,
            "is_visible": True,
            "created_at": "1970-01-01 00:00:00",
            "updated_at": "1970-01-01 00:00:00",
        }
        platform_rows.append(platform)
        platform_by_name[name] = platform

    project_rows = []
    project_by_source = {}
    project_name_index = {}
    for row in projects:
        source_project_num = int(row["pj_num"])
        name = blank_to_none(row["pj_name"]) or f"[프로젝트 {source_project_num}]"
        platform_name = blank_to_none(row["pj_platform"]) or "미분류"
        service_name = normalize_service_name(row["pj_sev_group"], row["pj_sev_name"])
        project = {
            "id": stable_uuid("project", source_project_num),
            "source_project_ref": str(source_project_num),
            "created_by_member_id": member_by_account.get((blank_to_none(row["pj_reporter"]) or "").lower(), {}).get("id"),
            "project_type1": blank_to_none(row["pj_group_type1"]) or "",
            "name": name,
            "platform_id": platform_by_name[platform_name]["id"],
            "platform": platform_name,
            "service_group_id": service_group_by_name.get(service_name, {}).get("id"),
            "report_url": blank_to_none(row["pj_page_report_url"]) or "",
            "reporter_member_id": member_by_account.get((blank_to_none(row["pj_reporter"]) or "").lower(), {}).get("id"),
            "reviewer_member_id": member_by_account.get((blank_to_none(row["pj_reviewer"]) or "").lower(), {}).get("id"),
            "start_date": parse_date(row["pj_start_date"]) or parse_date(row["pj_month"]) or parse_date(row["pj_date"]) or "1970-01-01",
            "end_date": parse_date(row["pj_end_date"]) or parse_date(row["pj_start_date"]) or parse_date(row["pj_month"]) or parse_date(row["pj_date"]) or "1970-01-01",
            "is_active": True,
            "created_at": parse_timestamp(row["pj_date"]) or "1970-01-01 00:00:00",
            "updated_at": parse_timestamp(row["pj_date"]) or "1970-01-01 00:00:00",
        }
        project_rows.append(project)
        project_by_source[source_project_num] = project
        project_name_index.setdefault(normalize_space(name), []).append(project)

    page_rows = []
    page_by_source = {}
    page_match_index = {}
    page_project_by_id = {}
    for row in pages:
        source_page_num = int(row["pj_page_num"])
        source_project_num = int(row["pj_unique_num"])
        title = blank_to_none(row["pj_page_name"]) or f"[페이지 {source_page_num}]"
        url = blank_to_none(row["pj_page_url"]) or ""
        project = project_by_source.get(source_project_num)
        if project is None:
            continue
        track_end = int(row["pj_page_track_end"] or 0)
        page = {
            "id": stable_uuid("project-page", source_page_num),
            "source_page_ref": str(source_page_num),
            "project_id": project["id"],
            "owner_member_id": member_by_account.get((blank_to_none(row["pj_page_id"]) or "").lower(), {}).get("id"),
            "title": title,
            "url": url,
            "monitoring_month": blank_to_none(row["pj_page_date"]),
            "track_status": "전체 수정" if track_end == 1 else "일부 수정" if track_end == 2 else "미수정",
            "monitoring_in_progress": False,
            "qa_in_progress": False,
            "note": compose_page_note(row),
            "updated_at": "1970-01-01 00:00:00",
            "created_at": "1970-01-01 00:00:00",
        }
        page_rows.append(page)
        page_by_source[source_page_num] = page
        page_project_by_id[page["id"]] = project
        page_match_index.setdefault(
            (normalize_space(project["name"]), title, url),
            []
        ).append(page)

    task_rows = []
    single_service_project = {}
    for row in tasks:
        project_num = row["task_pj_report_num"]
        page_num = row["task_page_report_num"]
        project = project_by_source.get(int(project_num)) if project_num is not None else None
        page = page_by_source.get(int(page_num)) if page_num is not None else None
        if page is not None:
            project = page_project_by_id.get(page["id"], project)

        normalized_project_name = normalize_space(row["task_pj_name"]) or ""
        task_page = blank_to_none(row["task_pj_page"]) or ""
        task_page_url = blank_to_none(row["task_pj_page_url"]) or ""

        if page is None and (task_page or task_page_url):
            matches = page_match_index.get((normalized_project_name, task_page or "", task_page_url or ""), [])
            if matches:
                page = matches[0]
                project = page_project_by_id.get(page["id"], project)

        if project is None and normalized_project_name:
            matches = project_name_index.get(normalized_project_name, [])
            if matches:
                project = matches[0]

        pair = (
            blank_to_none(row["task_type1"]) or "미분류",
            blank_to_none(row["task_type2"]) or "",
        )
        task_type = task_type_by_pair.get(pair)
        member = member_by_account.get((blank_to_none(row["task_user"]) or "").lower())
        if member is None:
            continue

        minutes = int(row["task_usedtime"] or 0)
        hours = (Decimal(minutes) / Decimal(60)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
        task = {
            "id": stable_uuid("task", row["task_num"]),
            "source_task_ref": str(row["task_num"]),
            "member_id": member["id"],
            "created_by_member_id": member["id"],
            "task_date": parse_date(row["task_date"]) or "1970-01-01",
            "project_id": project["id"] if project else None,
            "project_page_id": page["id"] if page else None,
            "task_type_id": task_type["id"] if task_type else None,
            "task_type1": pair[0],
            "task_type2": pair[1],
            "hours": hours,
            "content": task_content(row),
            "note": compose_task_note(row),
            "created_at": "1970-01-01 00:00:00",
            "updated_at": "1970-01-01 00:00:00",
        }
        task_rows.append(task)

        service_name = normalize_service_name(row["task_svc_group"], row["task_svc_name"])
        service = service_group_by_name.get(service_name)
        if project and service:
            bucket = single_service_project.setdefault(project["id"], set())
            bucket.add(service["id"])

    for project in project_rows:
        services = single_service_project.get(project["id"], set())
        if project["service_group_id"] is None and len(services) == 1:
            project["service_group_id"] = next(iter(services))

    lines = [
        "-- Refined dump generated locally.",
        "-- Source: MySQL source dump tables only.",
        "begin;",
    ]

    lines += insert_block(
        "public.members",
        [
            "id",
            "auth_user_id",
            "account_id",
            "name",
            "email",
            "note",
            "user_level",
            "user_active",
            "member_status",
            "report_required",
            "joined_at",
            "last_login_at",
            "created_at",
            "updated_at",
        ],
        member_rows,
    )
    lines += insert_block(
        "public.cost_groups",
        [
            "id",
            "name",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        ],
        cost_group_rows,
    )
    lines += insert_block(
        "public.task_types",
        [
            "id",
            "type1",
            "type2",
            "display_label",
            "requires_service_group",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        ],
        task_type_rows,
    )
    lines += insert_block(
        "public.service_groups",
        [
            "id",
            "name",
            "cost_group_id",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        ],
        service_group_rows,
    )
    lines += insert_block(
        "public.platforms",
        [
            "id",
            "name",
            "display_order",
            "is_visible",
            "created_at",
            "updated_at",
        ],
        platform_rows,
    )
    lines += insert_block(
        "public.projects",
        [
            "id",
            "created_by_member_id",
            "project_type1",
            "name",
            "platform_id",
            "platform",
            "service_group_id",
            "report_url",
            "reporter_member_id",
            "reviewer_member_id",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
            "updated_at",
        ],
        project_rows,
    )
    lines += insert_block(
        "public.project_pages",
        [
            "id",
            "project_id",
            "owner_member_id",
            "title",
            "url",
            "monitoring_month",
            "track_status",
            "monitoring_in_progress",
            "qa_in_progress",
            "note",
            "updated_at",
            "created_at",
        ],
        page_rows,
    )
    task_lines = [
        "-- Refined tasks dump generated locally.",
        "-- Source: MySQL source dump tables only.",
        "begin;",
    ]
    task_lines += insert_block(
        "public.tasks",
        [
            "id",
            "member_id",
            "created_by_member_id",
            "task_date",
            "project_id",
            "project_page_id",
            "task_type_id",
            "task_type1",
            "task_type2",
            "hours",
            "content",
            "note",
            "created_at",
            "updated_at",
        ],
        task_rows,
        chunk_size=1000,
    )
    task_lines.append("commit;")
    lines.append("commit;")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text("\n\n".join(lines) + "\n", encoding="utf-8")
    TASKS_OUTPUT_PATH.write_text("\n\n".join(task_lines) + "\n", encoding="utf-8")
    print(f"wrote {OUTPUT_PATH}")
    print(f"wrote {TASKS_OUTPUT_PATH}")
    print(
        json.dumps(
            {
                "members": len(member_rows),
                "cost_groups": len(cost_group_rows),
                "task_types": len(task_type_rows),
                "service_groups": len(service_group_rows),
                "platforms": len(platform_rows),
                "projects": len(project_rows),
                "project_pages": len(page_rows),
                "tasks": len(task_rows),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    build_dump()
