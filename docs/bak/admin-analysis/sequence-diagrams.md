# 주요 시나리오 시퀀스 다이어그램

## 1. 로그인

```mermaid
sequenceDiagram
    participant User as 사용자
    participant Vue as Vue 로그인 화면
    participant API as Express 인증 API
    participant DB as USER_TBL

    User->>Vue: 아이디/비밀번호 입력 후 제출
    Vue->>API: POST /api/v1/auth/member
    API->>DB: user_id 조회
    DB-->>API: user_pwd, user_level, user_active
    API-->>Vue: JWT(u_token)
    Vue->>Vue: localStorage.u_token 저장
    Vue->>API: GET /api/v1/auth/check
    API-->>Vue: success
    Vue-->>User: 보호 라우트 진입
```

## 2. 개인 업무보고 입력

```mermaid
sequenceDiagram
    participant User as 사용자
    participant View as ReportPersonal
    participant Form as ReportPersonalCreate
    participant API as A11y Work API
    participant DB as TASK_TBL

    User->>View: 특정 일자 화면 진입
    View->>API: GET /aw/search/work/:id/:date
    API->>DB: 해당 사용자/일자 업무 조회
    DB-->>API: 업무 row 목록
    API-->>View: result list
    User->>Form: type, 시간, 비고 입력
    alt 프로젝트성 업무
        Form->>API: POST /aw/search/project
        API->>DB: PJ_TBL 검색
        DB-->>API: 프로젝트 목록
        API-->>Form: project list
    end
    User->>Form: 저장
    Form->>API: PUT /aw/work
    API->>DB: TASK_TBL insert
    DB-->>API: success
    API-->>View: success
    View->>API: GET /aw/search/work/:id/:date
    API-->>View: 최신 목록
```

## 3. 관리자 Type 유효성 검증 및 일괄 보정

```mermaid
sequenceDiagram
    participant Admin as 관리자
    participant View as AdminWorkTypeValid
    participant API as A11y Work API
    participant DB as TASK_TBL / TYPE_TBL

    Admin->>View: 유효성검증모드 진입
    View->>API: GET /aw/admin/valid/type
    API->>DB: TASK_TBL LEFT JOIN TYPE_TBL
    DB-->>API: orphan type 목록
    API-->>View: PASS/FAIL 리스트
    Admin->>View: FAIL 항목 선택
    View->>API: POST /aw/search/valid
    API->>DB: 대상 TASK_TBL row 조회
    DB-->>API: 상세 업무 목록
    API-->>View: task list
    Admin->>View: 새 type 선택 후 변경
    View->>API: POST /aw/admin/valid/type
    API->>DB: TASK_TBL bulk update
    DB-->>API: success
    API-->>View: success
    View->>API: GET /aw/admin/valid/type
```

## 4. 관리자 서비스 그룹 유효성 검증 및 일괄 보정

```mermaid
sequenceDiagram
    participant Admin as 관리자
    participant View as AdminSvcValid
    participant API as A11y Work API
    participant DB as TASK_TBL / SVC_GROUP_TBL / TYPE_TBL

    Admin->>View: 유효성검증모드 진입
    View->>API: GET /aw/admin/valid/svc
    API->>DB: TASK_TBL LEFT JOIN SVC_GROUP_TBL
    DB-->>API: orphan svc 목록
    API-->>View: PASS/FAIL 리스트
    Admin->>View: FAIL 항목 선택
    View->>API: POST /aw/search/valid
    API->>DB: 대상 업무 목록 조회
    DB-->>API: task list
    API-->>View: 상세 목록
    Admin->>View: 새 svc 선택 후 변경
    View->>API: POST /aw/admin/valid/svc
    API->>DB: TASK_TBL bulk update
    DB-->>API: success
    API-->>View: success
```

## 5. 전체 검색 후 엑셀 다운로드

```mermaid
sequenceDiagram
    participant Admin as 관리자
    participant View as Search.vue
    participant API as A11y Work API
    participant DB as TASK_TBL
    participant XLS as xlsx.writeFile

    Admin->>View: 기간/사용자/type 조건 입력
    View->>API: POST /aw/search/work
    API->>DB: 조건 기반 조회
    DB-->>API: row list
    API-->>View: condition + list
    Admin->>View: 엑셀 다운로드 클릭
    View->>API: POST /aw/xls/work
    API->>DB: 동일 조건 재조회
    DB-->>API: row list
    API-->>View: workbook result
    View->>XLS: 파일명 생성 후 저장
```

## 6. 월간 리소스 상세 조회

```mermaid
sequenceDiagram
    participant Admin as 관리자
    participant View as ResourceMonthly
    participant API as A11y Work API
    participant DB as TASK_TBL / TYPE_TBL / SVC_GROUP_TBL

    Admin->>View: 특정 연월 진입
    View->>API: GET /aw/report/resource/month/:year/:month
    API->>DB: type 집계 조회
    API->>DB: svc(group/name) 집계 조회
    API->>DB: svc(group/name/type1) 집계 조회
    DB-->>API: 각 집계 결과
    API-->>View: [typeSummary, svcSummary, svcTypeSummary]
    View->>API: GET /aw/report/resource/user/:year/:month
    API->>DB: 사용자별 월합계 조회
    DB-->>API: user totals
    API-->>View: 사용자 배지 데이터
```

## 7. 시퀀스 해석 메모

- 이 시스템의 중요한 시나리오는 단순 CRUD보다 `검색 -> 집계 -> 보정` 흐름에 있습니다.
- `valid` 계열 화면은 사실상 관리자용 데이터 클린업 툴입니다.
- 아지트 QA알리미는 현재 스펙아웃이므로 시퀀스 다이어그램 대상에서 제외했습니다.
