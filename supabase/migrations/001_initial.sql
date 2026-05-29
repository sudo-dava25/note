create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default '' check (char_length(title) <= 200),
  content     text not null default '' check (char_length(content) <= 50000),
  color       text not null default 'none',
  is_pinned   boolean not null default false,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name    text not null check (char_length(name) <= 30),
  unique (user_id, name)
);

create table note_tags (
  note_id uuid references notes(id) on delete cascade,
  tag_id  uuid references tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

create index idx_notes_user_deleted on notes(user_id, is_deleted);
create index idx_notes_user_pinned  on notes(user_id, is_pinned) where is_deleted = false;
create index idx_notes_updated      on notes(user_id, updated_at desc) where is_deleted = false;
create index idx_note_tags_note     on note_tags(note_id);
create index idx_note_tags_tag      on note_tags(tag_id);

alter table notes add column fts_vector tsvector
  generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored;

create index idx_notes_fts on notes using gin(fts_vector);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();

alter table notes     enable row level security;
alter table tags      enable row level security;
alter table note_tags enable row level security;

create policy notes_owner on notes
  using (user_id = auth.uid());

create policy tags_owner on tags
  using (user_id = auth.uid());

create policy note_tags_owner on note_tags
  using (
    exists (
      select 1 from notes
      where notes.id = note_tags.note_id
        and notes.user_id = auth.uid()
    )
  );
