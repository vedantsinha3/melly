-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Cached Spotify track metadata
create table if not exists public.tracks (
  spotify_id text primary key,
  name text not null,
  artist_names text[] not null default '{}',
  album_name text not null,
  album_art_url text,
  duration_ms integer not null default 0,
  preview_url text,
  genre text
);

-- User song ratings with rank position
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null references public.tracks(spotify_id) on delete cascade,
  rank_position integer not null,
  score numeric(3, 1) not null,
  notes text,
  listened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, track_id)
);

create index if not exists ratings_user_rank_idx on public.ratings (user_id, rank_position);

-- Pairwise comparison history
create table if not exists public.comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  new_track_id text not null references public.tracks(spotify_id) on delete cascade,
  compared_track_id text not null references public.tracks(spotify_id) on delete cascade,
  preferred_track_id text not null references public.tracks(spotify_id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.user s
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.ratings enable row level security;
alter table public.comparisons enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Anyone authenticated can read tracks"
  on public.tracks for select
  to authenticated
  using (true);

create policy "Anyone authenticated can insert tracks"
  on public.tracks for insert
  to authenticated
  with check (true);

create policy "Users can view own ratings"
  on public.ratings for select
  using (auth.uid() = user_id);

create policy "Users can insert own ratings"
  on public.ratings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ratings"
  on public.ratings for update
  using (auth.uid() = user_id);

create policy "Users can delete own ratings"
  on public.ratings for delete
  using (auth.uid() = user_id);

create policy "Users can view own comparisons"
  on public.comparisons for select
  using (auth.uid() = user_id);

create policy "Users can insert own comparisons"
  on public.comparisons for insert
  with check (auth.uid() = user_id);
