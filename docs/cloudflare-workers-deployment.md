# Cloudflare Workers 정적 배포 가이드

이 문서는 `my-works`를 현재 Cloudflare UI 기준으로 `Workers + Static Assets` 방식으로 배포할 때 필요한 설정을 정리합니다.

## 대상

- 프레임워크: `Vite + React`
- 배포 형태: 정적 SPA
- 빌드 산출물: `dist`

## 1. 현재 Cloudflare UI 기준

일부 계정 UI에서는 예전처럼 `Pages`를 별도로 고르는 단계가 보이지 않습니다. 이 경우 `Workers & Pages`에서 `Create application` 후 `Create a Worker` 흐름으로 진행하면 됩니다.

이 저장소는 그 흐름에 맞춰 배포합니다.

## 2. 저장소 설정

이 저장소에는 Cloudflare 정적 배포용 `wrangler.jsonc`가 포함됩니다.

- 정적 자산 디렉터리: `dist`
- SPA 라우팅 처리: `single-page-application`

즉, React Router의 `/dashboard`, `/projects`, `/auth/recovery` 같은 경로를 직접 열어도 앱이 정상 진입하도록 맞춥니다.

## 3. Cloudflare 화면에서 넣을 값

Git 저장소 연결 후 `Create and deploy` 단계에서 아래 값으로 입력합니다.

- Project name: `my-works`
- Build command: `pnpm run build`
- Deploy command: `npx wrangler deploy`
- Path: `/`

`Non-production branch deploy command`는 기본값을 그대로 둬도 됩니다.

## 4. 환경변수

이 프로젝트는 프론트엔드에서 `import.meta.env`로 환경변수를 읽습니다. 따라서 `.env` 파일을 업로드하는 방식이 아니라, Cloudflare 화면의 변수 입력 칸에 직접 등록해야 합니다.

필수 값:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

예시:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_APP_URL=https://<your-worker-subdomain>.workers.dev
```

커스텀 도메인을 연결했다면 `VITE_APP_URL`도 실제 운영 도메인으로 바꿉니다.

```env
VITE_APP_URL=https://report.example.com
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

## 6. 브랜치 배포

Cloudflare Git 연동에서는 연결한 기본 브랜치가 운영 배포 기준이 됩니다. 비운영 브랜치 빌드를 켜면 다른 브랜치도 미리보기 형태로 배포할 수 있습니다.

이 화면에 `Pages production branch` 같은 예전 표현이 없더라도, 현재 UI에서는 Worker 배포 기준으로 처리된다고 보면 됩니다.

## 7. 배포 후 확인

- 빌드가 성공했는지 확인
- 기본 URL에서 앱이 열리는지 확인
- `/dashboard` 직접 접속이 되는지 확인
- `/auth/recovery` 경로가 열리는지 확인
- 로그인과 비밀번호 재설정 흐름이 정상인지 확인

## 8. 권장 사항

- `NODE_VERSION=22`를 Cloudflare 환경변수로 추가하면 빌드 환경 차이를 줄이기 쉽습니다.
- 운영과 검수 환경이 다르면 변수 값을 분리합니다.
- 운영 도메인을 바꾼 뒤에는 `VITE_APP_URL`과 Supabase Redirect URL을 함께 갱신합니다.
