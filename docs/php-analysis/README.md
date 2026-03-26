# php-operation_tool Project Analysis

## 개요

이 문서는 `/Users/gio.a/Documents/workspace/php-operation_tool` 저장소의 현재 코드와 루트 SQL 덤프 기준 As-Is 분석 문서 세트입니다.

- 분석 기준: `webapp/`, `apache/`, `Dockerfile`, `k8s/deployment.yaml`, `db_a11yop_2512041025.sql`
- 분석 방식: 정적 코드 분석 + SQL 덤프 교차 검증
- 제외 범위: 운영 로그, 외부 위키, 배포 파이프라인 상세
- 주의사항: 데이터베이스 동작 의미와 일부 관계 해석은 코드 사용 패턴을 함께 본 결과이므로, 제약조건/인덱스 외 업무 의미는 일부 `추정`이 포함됩니다.

## 빠른 요약

- 애플리케이션은 프레임워크 없는 레거시 PHP 7.1 + jQuery 구조입니다.
- 진입점은 [`webapp/index.php`](../../webapp/index.php) 하나이며, 실제 화면은 `#page-wrapper`에 `pages/*.php`를 부분 로드하는 방식입니다.
- 서버 측 AJAX 엔드포인트는 대부분 [`webapp/dbcon/`](../../webapp/dbcon)에 있으며, JSON 대신 HTML fragment 또는 `<script>alert(...)</script>`를 반환합니다.
- 핵심 데이터 모델은 `TASK_TBL`, `PJ_TBL`, `PJ_PAGE_TBL`, `TYPE_TBL`, `USER_TBL`, `SVC_GROUP_TBL`입니다.
- `APPINFO_TBL`은 완전 미사용은 아니지만, 대시보드 추천 모니터링과 레거시 관리 화면에만 걸쳐 있는 보조 기준정보에 가깝습니다.
- 알림 영역은 코드의 `NOTI_TBL` 참조와 실제 덤프의 `AGITNOTI_TBL`/`AGITNOTI_OPT_TBL`이 불일치합니다.
- 업무보고 입력은 `TYPE_TBL`의 대분류/소분류와 일부 숫자형 타입 ID에 강하게 결합되어 있습니다.
- 프로젝트/페이지 수정 시 기존 업무 이력(`TASK_TBL`)까지 함께 갱신하는 역전파 설계가 존재합니다.

## 문서 목록

- [system-architecture.md](./system-architecture.md): 시스템 아키텍처 설계서
- [database-design.md](./database-design.md): 데이터베이스 설계서
- [erd.md](./erd.md): ERD
- [screen-design.md](./screen-design.md): 화면 설계서
- [api-spec.md](./api-spec.md): API 명세서
- [sequence-diagrams.md](./sequence-diagrams.md): 주요 시나리오 시퀀스 다이어그램
- [interface-design.md](./interface-design.md): 인터페이스 설계서
- [menu-structure.md](./menu-structure.md): 메뉴/화면 구조
- [legacy-risk-notes.md](./legacy-risk-notes.md): 레거시 구조상 주요 리스크와 해석 메모

미래 전환/이행 검토 문서는 `project-analysis`와 분리해 [`docs/transition/interim-react-migration-review.md`](../transition/interim-react-migration-review.md)로 이동했습니다.

## 주요 디렉터리

| 경로 | 역할 |
| --- | --- |
| `webapp/index.php` | 로그인 후 단일 셸 진입점 |
| `webapp/pages/` | 실제 화면 조각(View) |
| `webapp/dbcon/` | DB 조회/수정 엔드포인트 |
| `webapp/js/` | 메뉴 전환, 입력 폼 동적 구성, AJAX 호출 |
| `webapp/login/` | 로그인/로그아웃 |
| `apache/` | Apache 포트 및 PHP 설정 |
| `k8s/` | 쿠버네티스 배포 YAML |

## 구조 이해 포인트

1. 이 시스템은 "서버 렌더링 + 부분 AJAX 갱신" 구조이며 SPA 프레임워크를 사용하지 않습니다.
2. 화면 전환은 브라우저 라우팅이 아니라 jQuery `load()`로 PHP 파일을 끼워 넣는 방식입니다.
3. DB 정규화가 완전하지 않아서 `TASK_TBL`에는 프로젝트명/페이지명 텍스트와 프로젝트 번호 참조가 함께 존재합니다.
4. 동일 화면에서 CRUD를 반복하는 운영툴 패턴이 강하며, 검색 결과도 대부분 표 형태 HTML로 직접 반환됩니다.
5. 메뉴에 노출되지 않는 숨김/관리 화면과 호출처가 불분명한 레거시 엔드포인트가 공존합니다.
