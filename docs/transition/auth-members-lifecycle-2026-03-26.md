# Auth / Members 운영 정리

작성일: 2026-03-26

## 1. 왜 `members`가 여러 개처럼 보이는가

Supabase 화면에서 보이는 항목은 아래처럼 역할이 다릅니다.

### 실제 운영 테이블

- `public.members`
  - 실제 사용자 원본 테이블
  - 수정 기준도 이 테이블이다
  - `auth_user_id`, `legacy_user_id`, `email`, `user_level`, `user_active`가 실제 사용자 상태다

### 조회용 view

- `public.members_public_view`
  - `members`에서 일반 조회에 필요한 컬럼만 노출한 view
- `public.active_members_public_view`
  - `members_public_view`와 같지만 `user_active = true`만 노출한 view

중요:
- 위 두 개는 별도 데이터 저장소가 아니다
- 둘 다 `public.members`를 읽는 `select` view다
- 운영 데이터 수정은 `public.members`만 보면 된다

### 이관용 보조 테이블

- `legacy_xref.members`
  - 레거시 사용자와 신규 `members.id`를 연결해 두는 이관용 매핑 테이블
  - 런타임 사용자 테이블이 아니다

## 2. 현재 운영 기준에서 무엇을 보면 되는가

운영자가 실제로 보면 되는 대상은 아래뿐이다.

1. 사용자 존재 여부: `public.members`
2. 인증 연결 여부: `public.members.auth_user_id`
3. 관리자 여부: `public.members.user_level`
4. 활성 여부: `public.members.user_active`

즉:
- 사용자 추가/수정/권한 변경 기준: `public.members`
- 일반 앱 조회 최적화용: `members_public_view`, `active_members_public_view`
- 이관 검증용: `legacy_xref.members`

## 3. 신규 가입자 동작

정상 목표 동작은 아래다.

1. 사용자가 Supabase Auth로 회원가입한다
2. 같은 이메일의 기존 `members` 행이 있으면 `auth_user_id`를 연결한다
3. 없으면 `public.members`에 새 사용자를 자동 생성한다
4. 이후 로그인하면 앱은 `members`를 기준으로 정상 사용자로 인식한다

이 동작은 아래 초기 migration에 포함했다.

- `/Users/gio.a/Documents/workspace/next/my-works/supabase/migrations/20260324_000001_initial_ops_schema.sql`

포함 내용:
- `public.next_member_legacy_user_id(text)`
- 확장된 `public.bind_auth_session_member(uuid, text)`
- `auth.users` insert 후 자동 연결 트리거 `public.handle_auth_user_created()`

주의:
- 이 migration을 실제 Supabase DB에 적용해야만 동작한다
- 저장소 파일만 있어서는 운영 DB가 바뀌지 않는다

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
- `/Users/gio.a/Documents/workspace/next/my-works/supabase/migrations/20260324_000001_initial_ops_schema.sql`

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

-- 2) 아직도 members가 없는 auth 사용자만 신규 members 생성
insert into public.members (
  auth_user_id,
  legacy_user_id,
  name,
  email,
  user_level,
  user_active,
  joined_at,
  report_required
)
select
  au.id,
  public.next_member_legacy_user_id(au.email),
  split_part(lower(trim(au.email)), '@', 1),
  lower(trim(au.email)),
  0,
  true,
  coalesce(au.created_at, timezone('utc', now())),
  true
from auth.users au
left join public.members m_auth
  on m_auth.auth_user_id = au.id
left join public.members m_email
  on lower(m_email.email) = lower(trim(au.email))
where au.email is not null
  and m_auth.id is null
  and m_email.id is null;

commit;
```

주의:
- 위 SQL은 누락 사용자를 기본적으로 일반 사용자(`user_level = 0`)로 넣는다
- 관리자여야 하는 계정은 이후 `public.members.user_level = 1`로 별도 지정해야 한다

## 6. 확인용 SQL

### Auth 계정과 members 연결 상태 확인

```sql
select
  au.id as auth_user_id,
  au.email,
  m.id as member_id,
  m.legacy_user_id,
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

- 신규 가입 후 `public.members`에 사용자가 생긴다
- 로그인 후 해당 사용자가 바로 앱에 들어온다
- 관리자 계정은 `public.members.user_level = 1`이다
- `auth.users`에는 있는데 `public.members`에 없는 사용자가 0명이다

비정상 상태는 아래다.

- 회원가입은 되는데 로그인 직후 다시 guest로 떨어진다
- `auth.users`에는 있는데 `members.auth_user_id`가 비어 있다
- 관리자 계정인데 `user_level = 0`이라 `/admin/*` 진입이 안 된다
