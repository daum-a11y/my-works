# KRDS 조사 패킷

작성일: 2026-04-14  
용도: KRDS 기반 스킬 작성용 기초 자료

## 범위

- 시작하기 문서: 디자이너, 개발자
- 개발자 Storybook 문서: React
- 스타일 문서: `style_01` ~ `style_07`
- 디자인 원칙 문서: `utility_02`
- 네이밍 원칙 문서: `utility_03`
- 컴포넌트 요약 및 세부 메뉴
- 기본 패턴 요약 및 세부 메뉴
- 서비스 패턴 요약 및 세부 메뉴
- 상세 페이지 샘플 구조
- Codex 스킬로 옮길 때 필요한 정리 기준

## 조사한 공식 문서

- 디자이너 시작하기: <https://www.krds.go.kr/html/site/outline/outline_02.html>
- 개발자 시작하기: <https://www.krds.go.kr/html/site/outline/outline_03.html>
- React Storybook: <https://www.krds.go.kr/storybook/react/>
- 스타일 소개: <https://www.krds.go.kr/html/site/style/style_01.html>
- 색상: <https://www.krds.go.kr/html/site/style/style_02.html>
- 타이포그래피: <https://www.krds.go.kr/html/site/style/style_03.html>
- 형태: <https://www.krds.go.kr/html/site/style/style_04.html>
- 레이아웃: <https://www.krds.go.kr/html/site/style/style_05.html>
- 아이콘: <https://www.krds.go.kr/html/site/style/style_06.html>
- 디자인 토큰: <https://www.krds.go.kr/html/site/style/style_07.html>
- 디자인 원칙: <https://www.krds.go.kr/html/site/utility/utility_02.html>
- 네이밍 원칙: <https://www.krds.go.kr/html/site/utility/utility_03.html>
- 컴포넌트 요약: <https://www.krds.go.kr/html/site/component/component_summary.html>
- 기본 패턴 요약: <https://www.krds.go.kr/html/site/global/global_summary.html>
- 서비스 패턴 요약: <https://www.krds.go.kr/html/site/service/service_summary.html>

## 이 폴더의 파일

- [getting-started-outline.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/getting-started-outline.md)  
  디자이너/개발자 시작하기 문서 핵심 구조, 설치·자산·토큰 온보딩 포인트 정리

- [style-guide-01-07.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/style-guide-01-07.md)  
  스타일 01~07 핵심 요약, 수치, 적용 기준, 스킬 반영 포인트

- [component-inventory.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/component-inventory.md)  
  컴포넌트 카테고리, 세부 메뉴, 샘플 상세 페이지 구조, 코드/접근성 탭 특징

- [pattern-inventory.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/pattern-inventory.md)  
  기본 패턴/서비스 패턴 목록, 샘플 상세 페이지 구조, 플로/체크리스트 특징

- [token-naming-utility-03.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/token-naming-utility-03.md)  
  `utility_03` 기준 토큰 네이밍, 작업 파일 네이밍, 구분자, 세부 속성 축 정리

- [principles-utility-02.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/principles-utility-02.md)  
  `utility_02` 기준 KRDS 상위 UX 원칙, 판단 기준, 리뷰 체크리스트 정리

- [skill-authoring-notes.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/skill-authoring-notes.md)  
  위 자료를 실제 Codex 스킬 구조로 옮길 때의 설계안

## 조사 중 확인한 중요 메모

1. 스타일 메뉴는 요청하신 `style_01` ~ `style_07` 외에도 현재 `style_08` 엘리베이션 문서가 별도로 존재합니다.  
   `style_01` 소개 페이지는 엘리베이션을 핵심 항목으로 설명하지만, 실제 상세 문서는 `style_08.html`에 분리되어 있습니다. 이번 정리는 요청 범위에 맞춰 01~07 중심으로 작성했고, 필요한 범위에서만 이 사실을 메모했습니다.

2. 일부 요약 페이지의 `총 N건` 표기와 실제 노출된 메뉴 수가 맞지 않습니다.  
   - 컴포넌트 요약 페이지는 `총 37건`으로 보이지만 실제 노출 항목은 더 많습니다.
   - 기본 패턴 요약 페이지는 `총 11건`으로 보이지만 실제 노출 항목은 12개입니다.
   스킬에는 화면상 노출 항목 기준으로 인벤토리를 넣는 편이 안전합니다.

3. 문서 상세 페이지 구조가 섹션별로 꽤 규칙적입니다.  
   - 컴포넌트: `개요 / 접근성 / 코드` 탭 중심
   - 기본 패턴: `유형 / 사용성 가이드라인 / 예시 / 접근성`
   - 서비스 패턴: `유형 / 이용 상황별 플로 / 적용 수준 체크리스트`
   이 반복 구조를 스킬 워크플로우에 그대로 반영하는 것이 좋습니다.

4. 토큰 네이밍은 `style_07`만으로는 부족하고, `utility_03`의 네이밍 원칙을 같이 봐야 합니다.  
   토큰 구조와 역할은 `style_07`, 실제 이름 규칙과 구분자 체계는 `utility_03`에서 보강하는 편이 맞습니다.

## 이 자료를 읽는 순서

1. [getting-started-outline.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/getting-started-outline.md)
2. [style-guide-01-07.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/style-guide-01-07.md)
3. [principles-utility-02.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/principles-utility-02.md)
4. [token-naming-utility-03.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/token-naming-utility-03.md)
5. [component-inventory.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/component-inventory.md)
6. [pattern-inventory.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/pattern-inventory.md)
7. [skill-authoring-notes.md](/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/skill-authoring-notes.md)

## 바로 쓸 수 있는 결론

- KRDS 도입, 리소스 준비, Figma 라이브러리 사용, HTML/React/Vue Kit 설치 질문은 `스타일/컴포넌트/패턴` 이전에 `getting-started` 축으로 라우팅하는 편이 맞습니다.
- React 구현 세부는 Storybook을 참조하되, 컴포넌트 선택과 접근성 판단은 `components.md`의 공식 컴포넌트 문서 기준을 우선해야 합니다.
- KRDS 스킬은 `스타일 규칙`, `컴포넌트 선택`, `패턴 선택`, `적용 수준(필수/권장/우수)`, `접근성`, `토큰/코드 반영`의 6축으로 설계하는 것이 맞습니다.
- `SKILL.md`에는 판단 흐름과 체크리스트만 남기고, 자세한 표와 메뉴 인벤토리는 이 폴더의 자료를 `references`로 나누어 넣는 편이 좋습니다.
