# 데이터 모델 차이점 요약

## 1. 목적

본 문서는 기존 [`../php-analysis/database-design.md`](../php-analysis/database-design.md), [`../php-analysis/erd.md`](../php-analysis/erd.md)를 그대로 반복하지 않고, `linkagelab-a11y-workmanage`에서 실제로 사용 중인 데이터 모델과 차이점만 요약합니다.

## 2. 핵심 사용 테이블

| 테이블 | 현재 저장소 역할 | 실제 코드 사용 범위 | 2차 개발 해석 |
| --- | --- | --- | --- |
| `USER_TBL` | 로그인, 권한, 프로필, 멤버 관리 | 로그인, 목록, 생성, 수정, 삭제, PW 변경 | 여전히 인증/권한의 기준 테이블 |
| `TASK_TBL` | 업무보고 원본, 검색, 집계, validation 대상 | 입력/수정/삭제, 검색, 리소스 집계, orphan 교정 | 가장 중요한 운영 원본 |
| `TYPE_TBL` | 업무 타입 마스터 | 목록/추가/수정/삭제, validation 기준 | 업무분류 마스터 |
| `SVC_GROUP_TBL` | 서비스 그룹 마스터 | 목록/추가/수정/삭제, validation 기준 | 서비스 기준정보 마스터 |
| `PJ_TBL` | 프로젝트 검색/생성/목록/삭제 | 업무입력의 프로젝트 검색, 비활성 프로젝트 화면 | 부분 사용 상태 |
| `AGITNOTI_TBL` | 아지트 알리미 로그 | 로그 조회 전용 | 현재 스펙아웃 |
| `AGITNOTI_OPT_TBL` | 아지트 알리미 옵션 | 옵션 조회/수정 | 현재 스펙아웃 |

## 3. 이 저장소에서 실제로 읽는 주요 컬럼

### 3.1 `USER_TBL`

- `user_id`
- `user_pwd`
- `user_name`
- `user_lastlogin`
- `user_level`
- `user_create`
- `user_active`

해석:

- PHP 분석 문서에 있었던 `user_ip`, `user_birth`, `user_phone`은 현재 코드에서 사용하지 않습니다.
- 프런트 README도 해당 컬럼 삭제 메모를 남기고 있습니다.

### 3.2 `TASK_TBL`

- `task_num`
- `task_date`
- `task_user`
- `task_type1`
- `task_type2`
- `task_platform`
- `task_svc_group`
- `task_svc_name`
- `task_pj_name`
- `task_pj_page`
- `task_pj_page_url`
- `task_usedtime`
- `task_etc`
- `task_pj_report_num`

해석:

- 현재 시스템의 검색, 리소스, validation 기능은 모두 `TASK_TBL` 정합성에 의존합니다.
- `task_type1/type2`, `task_svc_group/name` 값 오염을 관리자 화면에서 직접 bulk correction 하는 이유도 이 때문입니다.

### 3.3 `TYPE_TBL`

- `type_num`
- `type_one`
- `type_two`
- `type_include_svc`
- `type_etc`
- `type_active`

해석:

- `type_include_svc`는 단순 표시값이 아니라 입력 폼 분기와 리소스 집계 분기에 직접 사용됩니다.

### 3.4 `SVC_GROUP_TBL`

- `svc_num`
- `svc_group`
- `svc_name`
- `svc_type`
- `svc_active`

해석:

- `svc_type`는 카카오/공동체/외부 같은 범주 분류에 사용됩니다.
- `task_*`에 저장된 문자열과 join해 validation을 수행합니다.

### 3.5 `PJ_TBL`

코드상 사용 확인 컬럼:

- `pj_num`
- `pj_group_type1`
- `pj_group_type2`
- `pj_platform`
- `pj_sev_group`
- `pj_sev_name`
- `pj_name`
- `pj_page_report_url`
- `pj_reporter`
- `pj_reviewer`
- `pj_start_date`
- `pj_end_date`
- `pj_err_highest`
- `pj_err_high`
- `pj_err_normal`
- `pj_err_low`
- `pj_err_ut`

해석:

- PHP 버전의 `PJ_PAGE_TBL` 중심 구조와 달리, 현재 프런트는 `PJ_TBL` 단일 목록 성격으로 더 가깝습니다.
- 다만 프로젝트 라우트가 비활성이라 `PJ_TBL`은 현재 `업무입력용 검색용 참조 데이터`로 보는 편이 더 정확합니다.

## 4. 사용 축이 약해진/사라진 영역

| 항목 | 현재 저장소 상태 | 근거 |
| --- | --- | --- |
| `APPINFO_TBL` | 사용 흔적 없음 | 코드 참조 없음, 프런트 README에 삭제 메모 |
| `NOTI_TBL` | 사용 흔적 없음 | 코드 참조 없음, 프런트 README에 삭제 메모 |
| `PJ_PAGE_TBL` | 사용 흔적 없음 | 코드 참조 없음, 프런트 README에 삭제 메모 |
| 아지트 알리미 | 코드만 잔존 | 현재 스펙아웃 |

## 5. 프런트 README에 남아 있는 개편 메모

프런트 README는 아래 방향을 암시합니다.

- `appinfo_tbl` 삭제
- `noti_tbl` 삭제
- `pj_page_tbl` 삭제
- `pj_tbl` 구조 변경
- `task_tbl` 일부 컬럼 삭제
- `user_tbl` 불필요 컬럼 삭제

해석:

- 이 메모는 실제 구현 완료 상태가 아니라 `개편 방향 메모`에 가깝습니다.
- 따라서 2차 개발에서는 README 메모를 그대로 사실로 받아들이지 말고, `현재 코드가 실제로 접근하는 컬럼`을 기준으로 다시 정리해야 합니다.

## 6. 2차 개발 기준 권장 범위

### 6.1 유지 기준

- `USER_TBL` 대응 사용자 모델
- `TASK_TBL` 대응 업무 원본 모델
- `TYPE_TBL` 대응 업무분류 마스터
- `SVC_GROUP_TBL` 대응 서비스 마스터

주의:

- `TYPE_TBL`, `SVC_GROUP_TBL` 자체는 계속 필요하지만, 현재 범위 기준으로는 `관리모드 CRUD`보다 `조회/validation 기준 데이터` 성격이 더 강합니다.

주의:

- `TYPE_TBL`, `SVC_GROUP_TBL` 자체는 계속 필요하지만, 현재 범위 기준으로는 `관리모드 CRUD`보다 `조회/validation 기준 데이터` 성격이 더 강합니다.

### 6.2 별도 판단 기준

- `PJ_TBL`: 검색용 참조 데이터로 유지할지, 프로젝트 도메인으로 복원할지 결정 필요
- `TYPE_TBL`, `SVC_GROUP_TBL` 관리모드 CRUD: 코드 존재하지만 현재 스펙아웃
- `TYPE_TBL`, `SVC_GROUP_TBL` 관리모드 CRUD: 코드 존재하지만 현재 스펙아웃
- `AGITNOTI_*`: 현재 스펙아웃이므로 기본 범위 제외

### 6.3 기본 제외 기준

- `APPINFO_TBL`
- `NOTI_TBL`
- `PJ_PAGE_TBL`

## 7. 결론

이 저장소의 데이터 모델은 `PHP 버전 전체 스키마`보다 훨씬 좁은 범위를 실제로 사용합니다. 2차 개발의 실질적인 최소 모델은 다음 4개 축입니다.

1. 사용자
2. 업무보고 원본
3. 업무 타입 마스터
4. 서비스 그룹 마스터

프로젝트와 아지트 알리미는 현재 코드에 흔적이 남아 있어도, 기본 이행 범위로 자동 포함하면 안 됩니다.
