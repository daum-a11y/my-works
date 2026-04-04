# linkagelab-a11y-workmanage Admin Analysis

## 개요

이 문서는 `/Users/gio.a/Documents/workspace/next/linkagelab-a11y-workmanage` 저장소의 현재 코드 기준 As-Is 분석 문서 세트입니다.

- 분석 기준: `front/`, `server/`, `nginx/`, `Dockerfile*`, `k8s/`, 루트/프런트 README
- 분석 방식: 정적 코드 분석
- 제외 범위: 바이너리 폰트/이미지 파일의 시각 자산 자체, `package-lock.json`
- 주의사항: 데이터베이스 상세 스키마는 기존 [`../php-analysis/database-design.md`](../php-analysis/database-design.md), [`../php-analysis/erd.md`](../php-analysis/erd.md)를 기본 참조로 재사용하고, 본 문서는 이 저장소의 Admin/운영 도구 관점 delta와 화면/API 구조에 집중합니다.
- 추가 전제: 아지트 QA알리미 기능은 현재 스펙아웃으로 간주합니다. 코드/라우트는 남아 있지만 2차 개발 범위에서는 제외합니다.

## 빠른 요약

- 애플리케이션은 `Vue 2 + Vue Router + Vuex + Axios` 프런트엔드와 `Express + mysql` 백엔드로 분리된 운영툴입니다.
- 핵심 도메인은 `업무보고`, `기간 검색`, `리소스 집계`, `전체 검색`, `사용자 관리`, `type/svc 정합성 보정(valid)`입니다.
- 핵심 테이블은 `TASK_TBL`, `TYPE_TBL`, `SVC_GROUP_TBL`, `USER_TBL`, `PJ_TBL`입니다.
- `PJ_PAGE_TBL`, `APPINFO_TBL`, `NOTI_TBL` 계열은 이 저장소 코드에서 핵심 축으로 보이지 않으며, 프런트 README에도 삭제/개편 메모가 남아 있습니다.
- 프로젝트 화면 코드는 존재하지만 라우터에서 빠져 있어 현재 활성 기능으로 보기 어렵습니다.
- 관리자 기능의 실질적 핵심은 `전체 검색`, `사용자 관리`, `TASK_TBL 정합성 보정(valid)`입니다.
- `업무타입 관리모드`, `서비스 그룹 관리모드`는 코드에 남아 있지만 현재 스펙아웃으로 간주합니다.
- 아지트 QA알리미는 구현 흔적이 있으나 현재 스펙아웃입니다.
- 2차 개발의 핵심 출발점은 `기준정보 관리`, `검색/엑셀`, `리소스 집계`, `업무보고 저장 규칙`을 분리 재정의하는 것입니다.

## 문서 목록

- [system-architecture.md](./system-architecture.md): 시스템 아키텍처 설계서
- [menu-structure.md](./menu-structure.md): 메뉴/화면 구조
- [screen-design.md](./screen-design.md): 화면 설계서
- [interface-design.md](./interface-design.md): 인터페이스 설계서
- [api-spec.md](./api-spec.md): API 명세서
- [sequence-diagrams.md](./sequence-diagrams.md): 주요 시나리오 시퀀스 다이어그램
- [data-model-delta.md](./data-model-delta.md): DB/도메인 모델 차이점 요약
- [legacy-risk-notes.md](./legacy-risk-notes.md): 레거시 구조상 주요 리스크와 해석 메모

## DB/ERD 재사용 기준

다음 문서는 중복 작성하지 않고 기존 PHP 분석 문서를 재사용합니다.

- [`../php-analysis/database-design.md`](../php-analysis/database-design.md)
- [`../php-analysis/erd.md`](../php-analysis/erd.md)

대신 이 저장소에서 실제로 어떤 테이블/컬럼을 여전히 쓰고, 무엇이 비활성/삭제 후보인지 [`data-model-delta.md`](./data-model-delta.md)로 정리합니다.

## 주요 디렉터리

| 경로 | 역할 |
| --- | --- |
| `front/src/router.js` | 화면 라우팅 정의 |
| `front/src/views/` | 화면 단위 View |
| `front/src/components/` | 화면 하위 컴포넌트 |
| `front/src/apis/index.js` | 프런트 API 호출 계약 |
| `front/src/stores/` | 공통/검색/개인업무 상태관리 |
| `server/routes/` | Express 라우팅 |
| `server/controllers/` | 인증, 멤버, 업무, 리소스, 기준정보 처리 |
| `server/config/config.js` | JWT/DB 연결 설정 |
| `nginx/` | FE 정적 호스팅 및 `/api` 프록시 |
| `k8s/` | dev/cbt FE/BE 배포/서비스/Ingress |

## 구조 이해 포인트

1. 이 저장소는 PHP 운영툴의 후속/대체 성격이지만, 데이터 계층은 여전히 레거시 MySQL 테이블에 강하게 결합되어 있습니다.
2. 프런트는 SPA로 바뀌었지만 백엔드는 REST라기보다 `운영용 JSON CRUD API` 성격이 강합니다.
3. 상태관리의 중심은 `Vuex search/personal` 두 모듈이고, 나머지 View는 API를 직접 호출합니다.
4. 관리자 기능의 핵심은 새 마스터를 만드는 CRUD보다 `TASK_TBL에 이미 쌓인 잘못된 type/svc 값을 bulk 교정`하는 기능입니다.
5. 프로젝트 영역은 코드가 남아 있어도 현재 활성 라우팅이 아니므로, 2차 개발에서는 `재활성화`와 `폐기` 중 하나를 먼저 결정해야 합니다.
6. 아지트 QA알리미는 코드상 옵션/로그/페이징까지 남아 있지만 현재 스펙아웃 항목으로 취급해야 합니다.
