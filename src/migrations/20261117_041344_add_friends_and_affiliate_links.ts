import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_friendships_status" AS ENUM ('pending', 'accepted', 'declined');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum__friendships_v_version_status" AS ENUM ('pending', 'accepted', 'declined');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "friendships" (
      "id" serial PRIMARY KEY NOT NULL,
      "requester_id" integer NOT NULL,
      "recipient_id" integer NOT NULL,
      "status" "enum_friendships_status" DEFAULT 'pending' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "friendships_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "admins_id" integer,
      "users_id" integer
    );

    CREATE TABLE IF NOT EXISTS "_friendships_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_requester_id" integer NOT NULL,
      "version_recipient_id" integer NOT NULL,
      "version_status" "enum__friendships_v_version_status" DEFAULT 'pending' NOT NULL,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_friendships_v_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "admins_id" integer,
      "users_id" integer
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "friendships_id" integer;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_requester_id_users_id_fk' AND conrelid = 'public.friendships'::regclass) THEN
        ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk"
          FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_recipient_id_users_id_fk' AND conrelid = 'public.friendships'::regclass) THEN
        ALTER TABLE "friendships" ADD CONSTRAINT "friendships_recipient_id_users_id_fk"
          FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_rels_parent_fk' AND conrelid = 'public.friendships_rels'::regclass) THEN
        ALTER TABLE "friendships_rels" ADD CONSTRAINT "friendships_rels_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."friendships"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_rels_admins_fk' AND conrelid = 'public.friendships_rels'::regclass) THEN
        ALTER TABLE "friendships_rels" ADD CONSTRAINT "friendships_rels_admins_fk"
          FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_rels_users_fk' AND conrelid = 'public.friendships_rels'::regclass) THEN
        ALTER TABLE "friendships_rels" ADD CONSTRAINT "friendships_rels_users_fk"
          FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_friendships_v_parent_id_friendships_id_fk' AND conrelid = 'public._friendships_v'::regclass) THEN
        ALTER TABLE "_friendships_v" ADD CONSTRAINT "_friendships_v_parent_id_friendships_id_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."friendships"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_friendships_v_version_requester_id_users_id_fk' AND conrelid = 'public._friendships_v'::regclass) THEN
        ALTER TABLE "_friendships_v" ADD CONSTRAINT "_friendships_v_version_requester_id_users_id_fk"
          FOREIGN KEY ("version_requester_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_friendships_v_version_recipient_id_users_id_fk' AND conrelid = 'public._friendships_v'::regclass) THEN
        ALTER TABLE "_friendships_v" ADD CONSTRAINT "_friendships_v_version_recipient_id_users_id_fk"
          FOREIGN KEY ("version_recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_friendships_v_rels_parent_fk' AND conrelid = 'public._friendships_v_rels'::regclass) THEN
        ALTER TABLE "_friendships_v_rels" ADD CONSTRAINT "_friendships_v_rels_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."_friendships_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_friendships_v_rels_admins_fk' AND conrelid = 'public._friendships_v_rels'::regclass) THEN
        ALTER TABLE "_friendships_v_rels" ADD CONSTRAINT "_friendships_v_rels_admins_fk"
          FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_friendships_v_rels_users_fk' AND conrelid = 'public._friendships_v_rels'::regclass) THEN
        ALTER TABLE "_friendships_v_rels" ADD CONSTRAINT "_friendships_v_rels_users_fk"
          FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_friendships_fk' AND conrelid = 'public.payload_locked_documents_rels'::regclass) THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_friendships_fk"
          FOREIGN KEY ("friendships_id") REFERENCES "public"."friendships"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "friendships_requester_idx" ON "friendships" USING btree ("requester_id");
    CREATE INDEX IF NOT EXISTS "friendships_recipient_idx" ON "friendships" USING btree ("recipient_id");
    CREATE INDEX IF NOT EXISTS "friendships_status_idx" ON "friendships" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "friendships_updated_at_idx" ON "friendships" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "friendships_created_at_idx" ON "friendships" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "friendships_rels_order_idx" ON "friendships_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "friendships_rels_parent_idx" ON "friendships_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "friendships_rels_path_idx" ON "friendships_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "friendships_rels_admins_id_idx" ON "friendships_rels" USING btree ("admins_id");
    CREATE INDEX IF NOT EXISTS "friendships_rels_users_id_idx" ON "friendships_rels" USING btree ("users_id");
    CREATE INDEX IF NOT EXISTS "_friendships_v_parent_idx" ON "_friendships_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_friendships_v_version_version_requester_idx" ON "_friendships_v" USING btree ("version_requester_id");
    CREATE INDEX IF NOT EXISTS "_friendships_v_version_version_recipient_idx" ON "_friendships_v" USING btree ("version_recipient_id");
    CREATE INDEX IF NOT EXISTS "_friendships_v_version_version_status_idx" ON "_friendships_v" USING btree ("version_status");
    CREATE INDEX IF NOT EXISTS "_friendships_v_version_version_updated_at_idx" ON "_friendships_v" USING btree ("version_updated_at");
    CREATE INDEX IF NOT EXISTS "_friendships_v_version_version_created_at_idx" ON "_friendships_v" USING btree ("version_created_at");
    CREATE INDEX IF NOT EXISTS "_friendships_v_created_at_idx" ON "_friendships_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_friendships_v_updated_at_idx" ON "_friendships_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_friendships_v_rels_order_idx" ON "_friendships_v_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_friendships_v_rels_parent_idx" ON "_friendships_v_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_friendships_v_rels_path_idx" ON "_friendships_v_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "_friendships_v_rels_admins_id_idx" ON "_friendships_v_rels" USING btree ("admins_id");
    CREATE INDEX IF NOT EXISTS "_friendships_v_rels_users_id_idx" ON "_friendships_v_rels" USING btree ("users_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_friendships_id_idx"
      ON "payload_locked_documents_rels" USING btree ("friendships_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF to_regclass('public.friendships') IS NOT NULL AND EXISTS (SELECT 1 FROM "friendships") THEN
        RAISE EXCEPTION 'Friendship rows exist; refusing to remove them during migration rollback.';
      END IF;
    END $$;

    ALTER TABLE IF EXISTS "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_friendships_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_friendships_id_idx";
    ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "friendships_id";
    DROP TABLE IF EXISTS "_friendships_v_rels";
    DROP TABLE IF EXISTS "_friendships_v";
    DROP TABLE IF EXISTS "friendships_rels";
    DROP TABLE IF EXISTS "friendships";
    DROP TYPE IF EXISTS "public"."enum__friendships_v_version_status";
    DROP TYPE IF EXISTS "public"."enum_friendships_status";
  `)
}
