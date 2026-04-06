# Auth / Members 운영 정리

작성일: 2026-03-26

## 1. 왜 `members`가 여러 개처럼 보이는가

Supabase 화면에서 보이는 항목은 아래처럼 역할이 다릅니다.

### 실제 운영 테이블

- `public.members`
  - 실제 사용자 원본 테이블
  - 수정 기준도 이 테이블이다
  - `auth_user_id`, `email`, `user_level`, `user_active`, `member_status`가 실제 사용자 상태다

### 조회용 view

- `public.members_public_view`
  - `members`에서 일반 조회에 필요한 최소 컬럼만 노출한 view
- `public.active_members_public_view`
  - `members_public_view`와 같지만 `user_active = true`만 노출한 view

중요:
- 위 두 개는 별도 데이터 저장소가 아니다
- 둘 다 `public.members`를 읽는 `select` view다
- 운영 데이터 수정은 `public.members`만 보면 된다

## 2. 현재 운영 기준에서 무엇을 보면 되는가

운영자가 실제로 보면 되는 대상은 아래뿐이다.

1. 사용자 존재 여부: `public.members`
2. 인증 연결 여부: `public.members.auth_user_id`
3. 관리자 여부: `public.members.user_level`
4. 활성 여부: `public.members.user_active`
5. 승인대기 여부: `public.members.member_status`

즉:
- 사용자 추가/수정/권한 변경 기준: `public.members`
- 일반 앱 조회 최적화용: `members_public_view`, `active_members_public_view`

## 3. 신규 가입자 동작

정상 목표 동작은 아래다.

1. 관리자가 `public.members`에 사용자를 먼저 만든다
2. 관리자가 초대 메일을 보낸다
3. 사용자가 초대 링크로 비밀번호를 설정해 Supabase Auth 계정을 만든다
4. 같은 이메일의 기존 `members` 행이 있으면 `auth_user_id`를 연결한다
5. 연결된 활성 사용자만 앱에 들어간다

이 동작은 아래 초기 migration에 포함했다.

- `/Users/gio.a/Documents/workspace/next/my-works/supabase/migrations/000_initial_ops_schema.sql`

포함 내용:
- 확장된 `public.bind_auth_session_member(uuid, text)`
- `auth.users` insert 후 자동 연결 트리거 `public.handle_auth_user_created()`
- 기존 운영 DB 보정용 `supabase/sql/005_harden_auth_rls.sql`
- 승인대기 상태 보정용 `supabase/sql/006_member_status_pending.sql`

주의:
- 이 migration을 실제 Supabase DB에 적용해야만 동작한다
- 저장소 파일만 있어서는 운영 DB가 바뀌지 않는다

중요:

- 공개 회원가입은 사용하지 않는다.
- Supabase Dashboard -> Authentication -> Providers -> Email 에서 일반 이메일 회원가입 옵션을 꺼야 한다.
- 초대되지 않은 사용자가 Auth 계정을 만들더라도 `members` 자동 생성은 하지 않는다.

## 4. 기존에 `auth.users`에만 있고 `members`에 없는 사용자

이미 과거에 생성된 사용자 중:

- `auth.users`에는 있음
- `public.members`에는 없음

인 계정은 자동으로 복구되지 않는다.

이유:
- 자동 연결 트리거는 migration 적용 이후 새로 생성되는 `auth.users` 행부터만 동작한다
- 과거 누락 사용자는 1회 수동 SQL로 정리해야 한다

## 5. 기존 누락 사용자 일괄 복구 SQL

전제:
- 아래 migration이 먼저 적용되어 있어야 한다
- `/Users/gio.a/Documents/workspace/next/my-works/supabase/migrations/000_initial_ops_schema.sql`

실행 SQL:

```sql
begin;

-- 1) 같은 이메일의 기존 members 행이 있으면 auth_user_id 연결
update public.members m
set
  auth_user_id = au.id,
  email = lower(trim(au.email)),
  updated_at = timezone('utc', now())
from auth.users au
where m.auth_user_id is null
  and au.email is not null
  and lower(m.email) = lower(trim(au.email));

commit;
```

주의:
- 현재 운영 기준에서는 `members` 누락 사용자를 자동 생성하지 않는다.
- 초대 대상이 아닌 사용자는 `auth.users`에 있어도 앱 접근 대상으로 보지 않는다.

## 6. 확인용 SQL

### Auth 계정과 members 연결 상태 확인

```sql
select
  au.id as auth_user_id,
  au.email,
  m.id as member_id,
  m.user_level,
  m.user_active
from auth.users au
left join public.members m
  on m.auth_user_id = au.id
order by au.created_at desc nulls last;
```

### 아직도 `members`가 없는 auth 사용자만 확인

```sql
select
  au.id,
  au.email,
  au.created_at
from auth.users au
left join public.members m
  on m.auth_user_id = au.id
where au.email is not null
  and m.id is null
order by au.created_at desc nulls last;
```

## 7. 운영 판단 기준

정상 상태는 아래다.

- 초대된 사용자가 가입하면 기존 `public.members.auth_user_id`가 연결된다
- 로그인 후 해당 사용자가 바로 앱에 들어온다
- 관리자 계정은 `public.members.user_level = 1`이다
- 공개 회원가입은 Dashboard 설정에서 비활성화돼 있다

비정상 상태는 아래다.

- 회원가입은 되는데 로그인 직후 다시 guest로 떨어진다
- `auth.users`에는 있는데 `members.auth_user_id`가 비어 있다
- 관리자 계정인데 `user_level = 0`이라 `/admin/*` 진입이 안 된다
