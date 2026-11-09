SET local check_function_bodies = off;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";

CREATE SCHEMA "private";

CREATE TABLE "public"."likes" (
  "post_id"    bigint                   NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "user_id"    uuid                     NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "likes_pkey" PRIMARY KEY (post_id, user_id)
);

ALTER TABLE "public"."likes"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."posts" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "content"    text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "image_path" text,
  "like_count" integer                  NOT NULL DEFAULT 0,
  CONSTRAINT "posts_content_check" CHECK (((char_length(content) >= 1) AND (char_length(content) <= 280))),
  CONSTRAINT "posts_pkey" PRIMARY KEY (id),
  "user_id"    uuid                     DEFAULT auth.uid()
);

ALTER TABLE "public"."posts"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SEQUENCE "public"."posts_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."posts_id_seq" FROM "authenticated";

REVOKE ALL ON SEQUENCE "public"."posts_id_seq" FROM "service_role";

CREATE OR REPLACE FUNCTION private.update_like_count()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = like_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$function$;

ALTER TABLE "public"."likes"
  ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

CREATE TRIGGER on_like_changed
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION private.update_like_count();

CREATE POLICY "誰でもいいねを読める" ON "public"."likes"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "ログインしている人も投稿を読める" ON "public"."posts"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "自分のフォルダに画像を置ける" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'post-images'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "自分のフォルダの画像を削除できる" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'post-images'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "自分のフォルダの画像を読める" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'post-images'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."posts";

REVOKE ALL ON TABLE "public"."likes" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."likes" TO "anon";

REVOKE ALL ON TABLE "public"."likes" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."likes" TO "authenticated";

REVOKE ALL ON TABLE "public"."likes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."likes" TO "postgres";

REVOKE ALL ON TABLE "public"."likes" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."likes" TO "service_role";

REVOKE ALL ON TABLE "public"."posts" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."posts" TO "anon";

REVOKE ALL ON TABLE "public"."posts" FROM "authenticated";

REVOKE ALL ("content") ON TABLE "public"."posts" FROM "authenticated";

GRANT UPDATE ("content") ON TABLE "public"."posts" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."posts" TO "authenticated";

REVOKE ALL ON TABLE "public"."posts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."posts" TO "postgres";

REVOKE ALL ON TABLE "public"."posts" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."posts" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "service_role";

ALTER TABLE "public"."likes"
  ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX likes_user_id_idx ON public.likes USING btree (user_id);

CREATE POLICY "自分としていいねできる" ON "public"."likes"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "自分のいいねだけ取り消せる" ON "public"."likes"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

ALTER TABLE "public"."posts"
  ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX posts_user_id_idx ON public.posts USING btree (user_id);

CREATE POLICY "自分の投稿だけ削除できる" ON "public"."posts"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "自分の投稿だけ書き換えられる" ON "public"."posts"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "自分の投稿として投稿できる" ON "public"."posts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

