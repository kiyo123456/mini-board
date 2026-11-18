-- supabase db reset のたびに入る、ローカル用のサンプルデータ
insert into public.posts (content)
values
  ('ローカルのサンプル投稿です'),
  ('supabase db reset のたびに、この2件が入ります');