alter table public.tracks
  add column if not exists album_id text,
  add column if not exists album_type text,
  add column if not exists album_release_date text,
  add column if not exists album_total_tracks integer,
  add column if not exists track_number integer;

create index if not exists tracks_album_id_idx on public.tracks (album_id);
