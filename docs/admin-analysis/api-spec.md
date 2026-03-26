# API 명세서

## 1. 개요

본 문서는 `server/routes/index.js`, `server/routes/a11y_work_route.js` 기준 현재 노출 API를 정리합니다.

- Base URL: `/api/v1`
- 인증 방식: `Authorization: <JWT>`
- 공통 에러: `401 unauthorized`, `500 internal server error`

## 2. 인증 API

| 메서드 | 경로 | 인증 | 입력 | 출력 | 비고 |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/auth/member` | 불필요 | `{ userId, userPwd }` | `{ message, u_token }` | 로그인 |
| `GET` | `/auth/check` | 필요 | 없음 | `{ success, info }` | 토큰 검증 |
| `GET` | `/env` | 불필요 | 없음 | `{ success, env }` | 서버 환경 확인 |

## 3. 멤버 API

| 메서드 | 경로 | 권한 | 입력 | 출력 | 비고 |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/member` | 로그인 | query `f`, `a`, `e` | 사용자 목록 | 조회 조건에 따라 필드/범위 달라짐 |
| `PUT` | `/member` | 관리자 | `user_id`, `user_name`, `user_level`, `user_active` | 생성 결과 | 초기 비밀번호는 `linkagelab` |
| `GET` | `/member/:userId` | 본인 또는 관리자 | 없음 | 단일 사용자 | 프로필 조회 |
| `POST` | `/member/:userId` | 관리자 | 사용자 정보 | 수정 결과 | ID 자체 수정 가능 |
| `DELETE` | `/member/:userId` | 관리자 | 없음 | 삭제 결과 | 영구 삭제 |
| `PUT` | `/member/:userId/password` | 본인 또는 관리자 | `{ user_pwd }` | 수정 결과 | 비밀번호 변경/초기화 |

## 4. 업무보고 / 검색 API

### 4.1 업무 CRUD

| 메서드 | 경로 | 권한 | 입력 | 출력 | 비고 |
| --- | --- | --- | --- | --- | --- |
| `PUT` | `/aw/work` | 본인 또는 관리자 | 업무 row | 저장 결과 | `TASK_TBL` insert |
| `POST` | `/aw/work/:taskNum` | 본인 또는 관리자 | 업무 row | 저장 결과 | `TASK_TBL` update |
| `DELETE` | `/aw/work/:taskNum` | 관리자 성격 | 없음 | 삭제 결과 | 코드상 `userLevel` truthy 여부 체크 |
| `GET` | `/aw/search/work/:id/:date` | 로그인 | path `id`, `date` | 일자별 본인 업무 | 개인 일간 목록 |

### 4.2 검색

| 메서드 | 경로 | 권한 | 입력 | 출력 | 비고 |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/aw/search/work` | 로그인 | 없음 | 이번 달 전체 업무 + 기본 조건 | 관리자 검색 초기 진입용 |
| `POST` | `/aw/search/work` | 로그인 | 기간/사용자/type/svc/sort 조건 | `{ condition, list }` | 검색 실행 |
| `GET` | `/aw/search/summary/:year/:month/:id` | 로그인 | path `year`, `month`, `id` | 일자별 합계 nest | 개인 월간 캘린더 |
| `POST` | `/aw/xls/work` | 로그인 | 검색 조건 | workbook 객체 | 엑셀 다운로드 |

검색 조건 주요 필드:

- `startDate`
- `endDate`
- `taskUser[]`
- `taskSvcGroup`
- `taskSvcName`
- `taskType1`
- `taskType2`
- `sort: { by, order }`

## 5. 기준정보(Type / Service Group) API

현재 코드에는 CRUD와 validation이 함께 존재하지만, `업무타입 관리모드`, `서비스 그룹 관리모드`는 현재 스펙아웃입니다. 따라서 2차 개발 기준으로는 `조회/validation`이 우선 대상이고, 아래 CRUD 엔드포인트는 참고용 잔존 API로 취급하는 편이 맞습니다.

### 5.1 Type

| 메서드 | 경로 | 권한 | 입력 | 출력 | 비고 |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/aw/search/type` | 로그인 | query `o`, `f` | type 목록 | `?o=child&f=all` 조합 사용 |
| `PUT` | `/aw/admin/type` | 관리자 | `type_one`, `type_two`, `type_workable`, `type_etc` | 생성 결과 | `TYPE_TBL` insert, 현재 스펙아웃 |
| `POST` | `/aw/admin/type/:num` | 관리자 | 수정 row | 저장 결과 | `TYPE_TBL` update, 현재 스펙아웃 |
| `DELETE` | `/aw/admin/type/:num` | 관리자 | 없음 | 삭제 결과 | `TYPE_TBL` delete, 현재 스펙아웃 |
| `GET` | `/aw/admin/valid/type` | 관리자 | 없음 | type orphan 목록 | `TASK_TBL` 기준 validation |
| `POST` | `/aw/admin/valid/type` | 관리자 | `{ old, new }` | bulk update 결과 | `TASK_TBL` 일괄 변경 |

### 5.2 Service Group

| 메서드 | 경로 | 권한 | 입력 | 출력 | 비고 |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/aw/search/svc` | 로그인 | query `o`, `f` | svc 목록 | `?o=child&f=all` 조합 사용 |
| `PUT` | `/aw/admin/svc` | 관리자 | `svc_group`, `svc_name`, `svc_type` | 생성 결과 | `SVC_GROUP_TBL` insert, 현재 스펙아웃 |
| `POST` | `/aw/admin/svc/:num` | 관리자 | 수정 row | 저장 결과 | `SVC_GROUP_TBL` update, 현재 스펙아웃 |
| `DELETE` | `/aw/admin/svc/:num` | 관리자 | 없음 | 삭제 결과 | `SVC_GROUP_TBL` delete, 현재 스펙아웃 |
| `GET` | `/aw/admin/valid/svc` | 관리자 | 없음 | svc orphan 목록 | `TASK_TBL` 기준 validation |
| `POST` | `/aw/admin/valid/svc` | 관리자 | `{ old, new }` | bulk update 결과 | `TASK_TBL` 일괄 변경 |
| `POST` | `/aw/search/valid` | 관리자 | `{ mode, ... }` | 대상 업무 row 목록 | valid 상세 조회 |

## 6. 리소스 API

| 메서드 | 경로 | 권한 | 입력 | 출력 | 비고 |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/aw/report/resource/month/:year/:month` | 로그인 | path `year`, `month` | 월간 상세 집계 배열 | 타입/서비스 기준 |
| `GET` | `/aw/report/resource/user/:year/:month` | 로그인 | path `year`, `month` | 사용자별 월합계 | 배지 표시에 사용 |
| `GET` | `/aw/report/resource/summary` | 로그인 | 없음 | type 기준 누적 계층 | 타입별 요약 |
| `GET` | `/aw/report/resource/svc` | 로그인 | 없음 | svc 기준 누적 계층 | 그룹별 요약 |
| `GET` | `/aw/admin/valid/time/:date?` | 관리자 | optional date | `[기준일, 사용자별 합계]` | 일간 작성현황 |

## 7. 프로젝트 API

| 메서드 | 경로 | 권한 | 입력 | 출력 | 비고 |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/aw/search/project` | 관리자 | `{ text, type }` | `PJ_TBL` 검색 결과 | 업무입력의 프로젝트 검색 |
| `GET` | `/aw/project/:maintype/:subtype` | 관리자 | path type1/type2 | 프로젝트 목록 | 현재 라우트 비활성 화면에서 사용 |
| `PUT` | `/aw/project` | 관리자 | 프로젝트 row | 저장 결과 | 프로젝트 생성 |
| `DELETE` | `/aw/project/:num` | 관리자 | 없음 | 삭제 결과 | 프로젝트 삭제 |

해석 메모:

- 프로젝트는 현재 프런트 라우터에서 비활성이라 활성 기능으로 보기 어렵습니다.
- 그래도 `ReportPersonalCreate`가 프로젝트 검색을 사용하므로 `PJ_TBL` 자체는 여전히 살아 있습니다.

## 8. 아지트 QA알리미 API

현재 기능은 스펙아웃입니다. 다만 코드상 남아 있는 엔드포인트는 아래와 같습니다.

| 메서드 | 경로 | 권한 | 용도 |
| --- | --- | --- | --- |
| `GET` | `/aw/admin/agit/noti/log` | 관리자 | 로그 목록/페이징 |
| `GET` | `/aw/admin/agit/noti/option` | 관리자 | 옵션 조회 |
| `PUT` | `/aw/admin/agit/noti` | 관리자 | 옵션 수정 |

2차 개발에서는 재구현 대상으로 넣지 않고, 제거 또는 완전 분리 여부를 먼저 결정하는 것이 맞습니다.

## 9. 공통 응답/권한 해석 메모

1. 응답 body 구조가 완전히 일관되지는 않으므로 신규 구현에서는 표준 shape를 재정의하는 편이 좋습니다.
2. 관리자 판정은 사실상 `userLevel === 0` 여부로만 구분됩니다.
3. 서버 권한과 프런트 메뉴 가시성이 항상 일치하지 않으므로, 2차 개발에서는 권한 모델을 별도로 명세해야 합니다.
