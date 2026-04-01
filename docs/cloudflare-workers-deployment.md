# Cloudflare Workers 정적 배포 가이드

이 문서는 `my-works`를 현재 Cloudflare UI 기준으로 `Workers + Static Assets` 방식으로 배포할 때 필요한 설정을 정리합니다. 기준 운영 방식은 `레포 1개 + Cloudflare 프로젝트 2개 + 프로젝트별 env 분리`입니다.

## 대상

- 프레임워크: `Vite + React`
- 배포 형태: 정적 SPA
- 빌드 산출물: `dist`

## 1. 현재 Cloudflare UI 기준

일부 계정 UI에서는 예전처럼 `Pages`를 별도로 고르는 단계가 보이지 않습니다. 이 경우 `Workers & Pages`에서 `Create application` 후 `Create a Worker` 흐름으로 진행하면 됩니다.

이 저장소는 그 흐름에 맞춰 배포합니다.

## 2. 배포 방식

이 저장소는 `wrangler.jsonc` 하나에 이름을 고정해서 운영/개발 두 프로젝트를 동시에 처리하지 않습니다. 대신 Cloudflare 프로젝트별 `Deploy command`에서 Worker 이름과 assets 경로를 직접 지정합니다.

이 방식의 장점:

- 레포는 하나로 유지
- Cloudflare 프로젝트는 운영/개발 두 개로 분리 가능
- 프로젝트별 env를 따로 관리 가능
- `name` 충돌을 피하기 쉬움

## 3. Cloudflare 화면에서 넣을 값

Git 저장소 연결 후 `Create and deploy` 단계에서 아래 값으로 입력합니다.

### 운영 프로젝트

- Project name: `my-works`
- Branch: `main`
- Build command: `pnpm run build`
- Deploy command: `npx wrangler deploy --name my-works --assets=./dist`
- Path: `/`

### 개발 프로젝트

- Project name: `my-works-dev`
- Branch: `develop`
- Build command: `pnpm run build`
- Deploy command: `npx wrangler deploy --name my-works-dev --assets=./dist`
- Path: `/`

고정된 운영/개발 2개 환경을 원하면 `Builds for non-production branches`는 굳이 켤 필요가 없습니다. 프로젝트를 둘로 나눠 브랜치와 env를 분리하는 편이 단순합니다.

## 4. 환경변수

이 프로젝트는 프론트엔드에서 `import.meta.env`로 환경변수를 읽습니다. 따라서 `.env` 파일을 업로드하는 방식이 아니라, Cloudflare 화면의 변수 입력 칸에 직접 등록해야 합니다.

각 프로젝트에 아래 값을 따로 넣습니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

운영 프로젝트 예시:

```env
VITE_SUPABASE_URL=https://<prod-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<prod-anon-key>
VITE_APP_URL=https://my-works.<account-subdomain>.workers.dev
```

개발 프로젝트 예시:

```env
VITE_SUPABASE_URL=https://<dev-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<dev-anon-key>
VITE_APP_URL=https://my-works-dev.<account-subdomain>.workers.dev
```

주의:

- `VITE_*` 값은 브라우저 번들에 포함됩니다.
- `SUPABASE_SERVICE_ROLE_KEY` 같은 비밀키는 넣으면 안 됩니다.

## 5. Supabase 설정

비밀번호 재설정과 인증 복귀 경로를 쓰려면 Supabase Auth 설정에 아래 URL을 허용해야 합니다.

- 개발 예시: `http://localhost:5173/auth/recovery`
- 운영 예시: `https://<운영도메인>/auth/recovery`

즉 `VITE_APP_URL`이 운영 주소라면 다음 URL을 Redirect URL에 포함해야 합니다.

```text
${VITE_APP_URL}/auth/recovery
```

## 6. 브랜치 배포와 Preview

현재 운영 방식에서는 아래처럼 이해하면 됩니다.

- 운영 프로젝트: `main`만 배포
- 개발 프로젝트: `develop`만 배포
- `Builds for non-production branches`: 기본적으로 `Disabled` 권장

이 설정을 `Enabled`로 켜면 non-production 브랜치 전체가 preview 빌드 대상이 될 수 있어, 브랜치가 많으면 빌드 소모가 빨라질 수 있습니다.

즉, 고정된 운영/개발 두 벌 환경이 목적이면:

- preview 브랜치 기능에 의존하지 않음
- Cloudflare 프로젝트 2개를 사용
- 각 프로젝트가 자기 브랜치와 자기 env만 담당

## 7. 배포 후 확인

- 빌드가 성공했는지 확인
- 기본 URL에서 앱이 열리는지 확인
- `/dashboard` 직접 접속이 되는지 확인
- `/auth/recovery` 경로가 열리는지 확인
- 로그인과 비밀번호 재설정 흐름이 정상인지 확인
- 운영 프로젝트와 개발 프로젝트 URL이 서로 다른지 확인

## 8. 권장 사항

- `NODE_VERSION=22`를 Cloudflare 환경변수로 추가하면 빌드 환경 차이를 줄이기 쉽습니다.
- 운영과 개발 환경은 프로젝트 자체를 분리하고 변수 값을 따로 둡니다.
- 운영 도메인을 바꾼 뒤에는 `VITE_APP_URL`과 Supabase Redirect URL을 함께 갱신합니다.
