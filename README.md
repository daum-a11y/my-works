# My Works

- 업무 운영 지원 도구

## 기술 스택

### 프론트엔드

- React 19
- TypeScript
- Vite 8
- React Router 7

### 데이터 처리

- Supabase
- TanStack Query
- React Hook Form
- Zod

### UI / 시각화

- Sass
- React Aria Components
- Lucide React
- Recharts
- ExcelJS

### 테스트 / 배포

- Vitest
- Testing Library
- Playwright
- jest-axe
- Cloudflare Wrangler

## 실행 방법

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 파일 생성

```bash
cp .env.example .env
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

## 환경 변수

`.env.example` 파일을 참고하여 .env 파일을 생성합니다.

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=http://localhost:5173
```

- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key
- `VITE_APP_URL`: 인증 메일 및 리디렉션에 사용하는 앱 기준 URL

### 테스트

- 단위 테스트: `pnpm test`
- 감시 모드: `pnpm test:watch`
- E2E 테스트: `pnpm test:e2e`

## 배포

프로덕션 빌드 후 Cloudflare에 배포합니다.

```bash
pnpm build
pnpm deploy
```

배포 설정은 [wrangler.jsonc](/Users/gio.a/Documents/workspace/next/my-works/wrangler.jsonc)에서 관리합니다.
