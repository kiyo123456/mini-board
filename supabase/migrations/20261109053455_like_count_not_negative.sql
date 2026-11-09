-- いいねの数が0より小さくならないようにする
alter table public.posts
add constraint posts_like_count_check check (like_count >= 0);
