create policy "Anyone authenticated can update track metadata"
  on public.tracks for update
  to authenticated
  using (true)
  with check (true);
