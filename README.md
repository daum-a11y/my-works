# My Works

이 저장소는 접근성팀 업무보고 운영툴의 React 이관 앱입니다.

## 앱 구성

- `src`: 앱 소스
- `public`: 정적 자산

## 실행

```bash
pnpm install
pnpm dev
```

## Supabase 반영

앱 코드는 아래 SQL 객체를 전제로 동작합니다.

- `members_public_view`
- `active_members_public_view`
- `project_pages_public_view`
- `bind_auth_session_member(...)`
- `admin_search_tasks(...)`

따라서 DB에는 아래 migration까지 적용돼 있어야 합니다.

- `supabase/migrations/000_initial_ops_schema.sql`
- 이미 초기 SQL을 적용한 운영 DB라면 `supabase/sql/005_harden_auth_rls.sql`도 추가 적용해야 합니다.
- 승인대기 상태를 운영할 경우 `supabase/sql/006_member_status_pending.sql`도 추가 적용해야 합니다.

현재 초기 migration에 공개 view/RPC/RLS 보정이 포함돼 있습니다. 이 단계가 빠지면 회원 조회, 페이지 조회, 세션-멤버 바인딩, 관리자 내보내기에서 런타임 오류가 날 수 있습니다.

## 환경변수

루트의 `.env.example`를 참고합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`: 비밀번호 재설정 메일이 돌아올 앱 기준 URL. 예: `http://localhost:5173`

로컬 개발에서는 `.env` 파일을 사용하고, Cloudflare 배포에서는 `.env` 파일을 업로드하지 않고 `Create a Worker` 화면 하단의 `Variable name` / `Variable value` 입력칸에 같은 키를 직접 등록합니다.

## Cloudflare 배포

이 저장소는 `Vite + React` 정적 SPA이며, 현재 Cloudflare UI 기준으로는 `Workers + Static Assets` 방식으로 배포합니다.

- Build command: `pnpm build`
- Deploy command: `npx wrangler deploy`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_APP_URL`

`VITE_APP_URL`은 실제 배포 주소를 넣어야 합니다. `workers.dev` 주소를 사용한다면 보통 `https://<project-name>.<account-subdomain>.workers.dev` 형식입니다.

자세한 절차는 [docs/cloudflare-workers-deployment.md](./docs/cloudflare-workers-deployment.md)를 참고합니다.

## 인증 운영 정책

- 공개 회원가입은 지원하지 않습니다. 계정 생성은 관리자 초대 기준입니다.
- 로그인 화면에서는 비밀번호 찾기만 제공합니다.
- 비밀번호 재설정 메일은 `${VITE_APP_URL}/auth/recovery`로 복귀하도록 동작합니다.
- 관리자 초대 메일은 Supabase Edge Function `invite-member`를 통해 발송됩니다.

Supabase Dashboard에서도 공개 가입을 차단해야 합니다.

- Dashboard -> Authentication -> Providers -> Email
- 일반 이메일 회원가입 옵션은 비활성화합니다.
- 초대 기반 계정 생성과 비밀번호 재설정만 운영합니다.

Supabase Auth 설정에서도 아래 Redirect URL을 허용해야 합니다.

- 개발 예시: `http://localhost:5173/auth/recovery`
- 운영 예시는 실제 서비스 도메인의 `/auth/recovery`

관리자 초대 기능을 쓰려면 아래 함수도 배포해야 합니다.

```bash
supabase functions deploy invite-member
```

초대 기능은 위 한 줄로 끝나지 않습니다. 아래가 모두 되어야 실제로 동작합니다.

1. 앱 환경변수 설정

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

2. Supabase Auth Redirect URL 등록

- `${VITE_APP_URL}/auth/recovery`

3. Edge Function 시크릿 등록

```bash
supabase secrets set \
  SUPABASE_URL=https://<project-ref>.supabase.co \
  SUPABASE_ANON_KEY=<anon-key> \
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

4. Edge Function 배포

```bash
supabase functions deploy invite-member
```

5. 관리자 계정 확인

- 초대 메일을 보내는 사용자는 `public.members.auth_user_id`가 연결되어 있어야 합니다.
- 초대 메일을 보내는 사용자는 `public.members.user_level = 1` 이어야 합니다.
- 초대 메일을 보내는 사용자는 `public.members.user_active = true` 이어야 합니다.

6. 완료 기준

- 관리자 화면에서 사용자 추가 후 `저장 및 초대` 클릭
- 초대 대상자가 메일 수신
- 메일 링크로 앱 진입
- 비밀번호 설정 완료
- 이후 로그인 가능

즉, `invite-member` 함수 배포만으로 끝나는 것이 아니라:
- 앱 환경변수
- Auth Redirect URL
- Function 시크릿
- Function 배포
- 관리자 계정 권한 상태

가 모두 맞아야 관리자 초대 메일이 실제로 동작합니다.
