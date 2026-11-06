-- Daha once kurdugun channel_state tablosunu tamamlar; mevcut kayitlari silmez.
alter table public.channel_state add column if not exists cycle_started_at timestamptz, add column if not exists duration_seconds integer not null default 3600, add column if not exists updated_at timestamptz not null default now(), add column if not exists updated_by uuid references auth.users(id);
alter table public.channel_state enable row level security;
drop policy if exists "Members can view channels" on public.channel_state;
create policy "Members can view channels" on public.channel_state for select to authenticated using (true);
drop policy if exists "Members can update channels" on public.channel_state;
create policy "Members can update channels" on public.channel_state for update to authenticated using (true) with check (true);
grant select,update on public.channel_state to authenticated;
do $$ begin if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='channel_state') then alter publication supabase_realtime add table public.channel_state; end if; end $$;
insert into public.channel_state(channel) values('CH1'),('CH2'),('CH3'),('CH4'),('CH5'),('CH6') on conflict(channel) do nothing;
