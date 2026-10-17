-- CampusOS schema for Supabase / PostgreSQL
-- Run once in Supabase SQL Editor. Review existing table names before running on a live database.
-- This script creates core college tables, relationships, indexes, profile trigger and RLS policies.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  role text not null default 'student' check (role in ('student','teacher','admin')),
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_bn text,
  description text,
  head_name text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  designation text,
  department_id uuid references public.departments(id) on delete set null,
  subject text,
  qualification text,
  phone text,
  email text,
  photo_url text,
  bio text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  student_id text not null unique,
  full_name text not null,
  department_id uuid references public.departments(id) on delete set null,
  program text,
  session text,
  year_level text,
  roll_number text,
  email text,
  phone text,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  category text not null default 'General',
  file_url text,
  cover_image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  image_url text not null,
  button_label text default 'Explore more',
  button_url text default '#about',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_counters (
  id uuid primary key default gen_random_uuid(),
  counter_key text not null unique,
  label text not null,
  value text not null,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department_id uuid references public.departments(id) on delete set null,
  program text,
  session text,
  year_level text,
  file_url text,
  details jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  exam_name text,
  student_id uuid references public.students(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  session text,
  roll_number text,
  grade text,
  gpa numeric(4,2),
  marks jsonb not null default '{}'::jsonb,
  file_url text,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  activity_type text not null check (activity_type in ('bncc','scouts','blood_donation','event','gallery','other')),
  title text not null,
  description text not null default '',
  image_url text,
  event_date timestamptz,
  location text,
  contact_name text,
  contact_phone text,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  image_url text not null,
  category text not null default 'Campus',
  taken_at date,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_profile_id uuid references public.profiles(id) on delete set null,
  attendance_date date not null default current_date,
  status text not null check (status in ('present','absent','late','excused')),
  subject text,
  notes text,
  created_at timestamptz not null default now(),
  unique(student_id, attendance_date, subject)
);

create table if not exists public.site_settings (
  setting_key text primary key,
  setting_value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists notices_publication_idx on public.notices (is_published, published_at desc);
create index if not exists hero_slides_active_order_idx on public.hero_slides (is_active, sort_order);
create index if not exists teachers_department_idx on public.teachers (department_id, sort_order);
create index if not exists students_department_idx on public.students (department_id, session);
create index if not exists activities_type_public_idx on public.activities (activity_type, is_published, event_date desc);
create index if not exists gallery_public_order_idx on public.gallery_items (is_published, sort_order);
create index if not exists routines_public_idx on public.routines (is_published, created_at desc);
create index if not exists results_public_idx on public.results (is_published, created_at desc);
create index if not exists attendance_student_date_idx on public.attendance (student_id, attendance_date desc);

create or replace function public.is_campus_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'); $$;
revoke all on function public.is_campus_admin() from public;
grant execute on function public.is_campus_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email, 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_campusos on auth.users;
create trigger on_auth_user_created_campusos after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Prevent a user from promoting their own account by editing their profile row.
create or replace function public.prevent_self_role_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_campus_admin() then
    raise exception 'Only a campus administrator can change account roles';
  end if;
  return new;
end;
$$;
drop trigger if exists prevent_profile_role_change on public.profiles;
create trigger prevent_profile_role_change before update on public.profiles
for each row execute procedure public.prevent_self_role_change();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','departments','teachers','students','notices','hero_slides','routines','activities'] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute procedure public.touch_updated_at()', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.notices enable row level security;
alter table public.hero_slides enable row level security;
alter table public.site_counters enable row level security;
alter table public.routines enable row level security;
alter table public.results enable row level security;
alter table public.activities enable row level security;
alter table public.gallery_items enable row level security;
alter table public.attendance enable row level security;
alter table public.site_settings enable row level security;

-- Policies are dropped/recreated so re-running the policy section is safe.
do $$ declare p record; begin
  for p in select schemaname, tablename, policyname from pg_policies where schemaname='public' and tablename = any(array['profiles','departments','teachers','students','notices','hero_slides','site_counters','routines','results','activities','gallery_items','attendance','site_settings']) loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

create policy "profiles select self or admin" on public.profiles for select to authenticated using (id = auth.uid() or public.is_campus_admin());
create policy "profiles update self or admin" on public.profiles for update to authenticated using (id = auth.uid() or public.is_campus_admin()) with check (id = auth.uid() or public.is_campus_admin());
-- Role assignment must be performed by trusted SQL/editor; do not let a normal user promote themselves.
create policy "departments public read active" on public.departments for select to anon, authenticated using (is_active or public.is_campus_admin());
create policy "departments admin manage" on public.departments for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
create policy "teachers public read active" on public.teachers for select to anon, authenticated using (is_active or public.is_campus_admin());
create policy "teachers admin manage" on public.teachers for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
create policy "students self or admin read" on public.students for select to authenticated using (profile_id = auth.uid() or public.is_campus_admin());
create policy "students admin manage" on public.students for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
create policy "notices public read published" on public.notices for select to anon, authenticated using (is_published or public.is_campus_admin());
create policy "notices admin manage" on public.notices for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
create policy "hero slides public read active" on public.hero_slides for select to anon, authenticated using (is_active or public.is_campus_admin());
create policy "hero slides admin manage" on public.hero_slides for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
create policy "counters public read active" on public.site_counters for select to anon, authenticated using (is_active or public.is_campus_admin());
create policy "counters admin manage" on public.site_counters for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
create policy "routines public read published" on public.routines for select to anon, authenticated using (is_published or public.is_campus_admin());
create policy "routines admin manage" on public.routines for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
create policy "results public read published" on public.results for select to anon, authenticated using (is_published or public.is_campus_admin());
create policy "results admin manage" on public.results for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
create policy "activities public read published" on public.activities for select to anon, authenticated using (is_published or public.is_campus_admin());
create policy "activities admin manage" on public.activities for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
create policy "gallery public read published" on public.gallery_items for select to anon, authenticated using (is_published or public.is_campus_admin());
create policy "gallery admin manage" on public.gallery_items for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
create policy "attendance student or admin read" on public.attendance for select to authenticated using (public.is_campus_admin() or exists (select 1 from public.students s where s.id = attendance.student_id and s.profile_id = auth.uid()));
create policy "attendance admin manage" on public.attendance for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
create policy "site settings public read" on public.site_settings for select to anon, authenticated using (true);
create policy "site settings admin manage" on public.site_settings for all to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());

grant select on public.departments, public.teachers, public.notices, public.hero_slides, public.site_counters, public.routines, public.results, public.activities, public.gallery_items, public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.departments, public.teachers, public.students, public.notices, public.hero_slides, public.site_counters, public.routines, public.results, public.activities, public.gallery_items, public.attendance, public.site_settings to authenticated;
grant select, update on public.profiles to authenticated;

insert into public.departments (name, name_bn, sort_order) values
  ('Zoology','প্রাণিবিজ্ঞান',1),('Botany','উদ্ভিদবিজ্ঞান',2),('Chemistry','রসায়ন',3),('Physics','পদার্থবিজ্ঞান',4),('Mathematics','গণিত',5),('Accounting','হিসাববিজ্ঞান',6)
on conflict (name) do nothing;
insert into public.site_counters (counter_key,label,value,sort_order) values
  ('students','Students','2,850+',1),('teachers','Teachers','120+',2),('departments','Departments','25+',3),('years','Years of legacy','50+',4)
on conflict (counter_key) do nothing;

-- IMPORTANT: after creating your first Auth user, assign the administrator role manually in SQL Editor:
-- update public.profiles set role = 'admin' where email = 'YOUR-ADMIN-EMAIL';
-- Never expose a service_role key in frontend code. Configure Storage separately if you need private documents.
