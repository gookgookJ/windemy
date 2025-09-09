-- Create course_sections table to persist curriculum sections
create table if not exists public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.course_sections enable row level security;

-- Policies mirroring course_sessions
create policy if not exists "Course sections are viewable with course access"
  on public.course_sections
  for select
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_sections.course_id
        and (
          c.is_published = true
          or c.instructor_id = auth.uid()
        )
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy if not exists "Instructors can manage own course sections"
  on public.course_sections
  for all
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_sections.course_id
        and (c.instructor_id = auth.uid())
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      where c.id = course_sections.course_id
        and (c.instructor_id = auth.uid())
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Add section_id to course_sessions to map sessions to sections
alter table public.course_sessions
  add column if not exists section_id uuid references public.course_sections(id) on delete set null;

-- Helpful indexes
create index if not exists idx_course_sections_course_order on public.course_sections(course_id, order_index);
create index if not exists idx_course_sessions_course_section_order on public.course_sessions(course_id, section_id, order_index);
