이 폴더는 KRDS 전환 전 스타일 전체를 비교 기준으로 남기기 위한 백업 폴더다.

- `original/`
  - Git 히스토리 기준으로 복구한 기존 `src/styles` 전체 백업
  - 포함 범위:
    - `components/*.scss`
    - `pages/*.scss`
    - `fonts.css`
    - `global.css`
    - `reset.css`
    - `tokens.css`
    - `tokens.css.bak`
- `styles/`
  - 현재 워크스페이스에 남아 있는 `src/styles` 잔존본 백업
- `tokens.css.bak`
  - 루트에서 바로 열어보는 비교용 복사본

현재 기준 비교는 아래 두 축으로 보면 된다.

- 기존 스타일 전체 원본 기준: `src/styles.bak/original/`
- 현재 워크스페이스 잔존본 기준: `src/styles.bak/styles/`

주의:
- 이 폴더의 파일은 앱 진입점에서 import 하지 않는다.
- 비교용 참고 자료로만 유지한다.
