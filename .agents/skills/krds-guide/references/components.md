# KRDS Components Reference

Use this file when the task is about component choice, component implementation, or component review.

For the full 조사본, see:

- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/component-inventory.md`

## 1. Category Map

### 아이덴티티

- 공식 배너
- 운영기관 식별자
- 헤더
- 푸터

### 탐색

- 건너뛰기 링크
- 메인 메뉴
- 브레드크럼
- 사이드 메뉴
- 콘텐츠 내 탐색
- 페이지네이션

### 레이아웃 및 표현

- 구조화 목록
- 긴급 공지
- 달력
- 디스클로저
- 모달
- 배지
- 아코디언
- 이미지
- 캐러셀
- 탭
- 표
- 텍스트 목록
- 파비콘

### 액션

- 링크
- 버튼
- 플로팅 버튼

### 선택

- 라디오 버튼
- 체크박스
- 셀렉트
- 태그
- 토글 스위치

### 피드백

- 단계 표시기
- 스피너

### 도움

- 따라하기 패널
- 맥락적 도움말
- 코치마크
- 툴팁
- 음성지원

### 입력

- 도움 패널
- 날짜 입력 필드
- 텍스트 영역
- 텍스트 입력 필드
- 파일 업로드

### 설정

- 언어 변경
- 화면 크기 조정

### 콘텐츠

- 접근 가능한 미디어
- 숨긴 콘텐츠

### 모바일

- 범위슬라이드
- 뒤로가기 버튼
- 바텀시트
- 수량 토글
- 토스트
- 스낵바
- 탭바
- 스플래시 스크린

## 2. Structural Reading of KRDS Component Docs

KRDS component detail pages are usually organized as:

- 개요
- 접근성
- 코드

And the body commonly includes:

- 구조
- 사용성 가이드라인
- 접근성 가이드라인
- 예시
- 마크업 가이드
- FAQ
- 정보 변경 내역

When reviewing or implementing, mirror this structure in your reasoning:

1. structure
2. usability
3. accessibility
4. code or markup

## 3. Important Exceptions

- `도움 패널` is currently listed under 입력 on the summary page.
- Conceptually it overlaps with help/support behavior.
- Do not assume the category name alone tells you the right usage.

## 4. Identity Components

Treat these as constrained components:

- 공식 배너
- 운영기관 식별자
- 헤더
- 푸터

They are not generic branding playgrounds.

Specific KRDS notes from the 조사본:

- 공식 배너는 모든 화면 최상단에 동일한 위치로 제공
- 공식 정부 서비스가 아닌 사이트에서는 사용 금지
- 건너뛰기 링크를 공식 배너보다 먼저 제공
- 공식 배너 영역 선택자 메모: `#krds-masthead`

## 5. Choosing Help Components

Use the right help surface:

- very short clarification:
  맥락적 도움말
- short in-place explanation:
  툴팁 or 맥락적 도움말
- guided onboarding or task walk-through:
  따라하기 패널 plus 코치마크
- broader persistent assistance:
  도움 패널

## 6. Selection and Input Components

If the task involves forms, do not stop at component visuals.

Also load [patterns.md](patterns.md) when any of these are involved:

- 개인정보 입력
- 신청서 작성
- 확인/확정
- 필터링/정렬
- 첨부

## 7. What to Check in Reviews

Flag these KRDS mismatches:

- wrong component family chosen for the task
- help surface too heavy or too light for the context
- identity components styled too freely
- navigation components missing location or bypass support
- table/list/card structures that break information consistency
- component markup that ignores documented accessibility behavior

## 8. URL Map

If you need the exact official page, use the researched inventory:

- `/Volumes/workspace/workspace/my-works/.agents/skills/krds-guide/references/research/component-inventory.md`

That file includes the current detail URLs for every visible component menu.
