import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_community_posts_status" AS ENUM('published', 'hidden', 'deleted');
  CREATE TYPE "public"."enum__community_posts_v_version_status" AS ENUM('published', 'hidden', 'deleted');
  CREATE TYPE "public"."enum_community_comments_status" AS ENUM('published', 'hidden', 'deleted');
  CREATE TYPE "public"."enum__community_comments_v_version_status" AS ENUM('published', 'hidden', 'deleted');
  CREATE TYPE "public"."enum_community_reactions_reaction" AS ENUM('support', 'heart', 'leaf');
  CREATE TYPE "public"."enum__community_reactions_v_version_reaction" AS ENUM('support', 'heart', 'leaf');
  CREATE TYPE "public"."enum_community_reports_reason" AS ENUM('harassment', 'hate', 'personal-information', 'spam', 'other');
  CREATE TYPE "public"."enum_community_reports_status" AS ENUM('open', 'under-review', 'resolved', 'dismissed');
  CREATE TYPE "public"."enum__community_reports_v_version_reason" AS ENUM('harassment', 'hate', 'personal-information', 'spam', 'other');
  CREATE TYPE "public"."enum__community_reports_v_version_status" AS ENUM('open', 'under-review', 'resolved', 'dismissed');
  CREATE TABLE "community_rate_limits" (
    "user_id" integer NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "action" varchar NOT NULL CHECK ("action" IN ('feedRead', 'commentsRead', 'post', 'comment', 'reaction', 'report', 'block')),
    "window_start" timestamp(3) with time zone NOT NULL,
    "request_count" integer NOT NULL DEFAULT 0 CHECK ("request_count" >= 0),
    PRIMARY KEY ("user_id", "action")
  );
  CREATE TABLE "community_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"author_id" integer NOT NULL,
  	"content" varchar NOT NULL,
  	"status" "enum_community_posts_status" DEFAULT 'published' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "community_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "_community_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_author_id" integer NOT NULL,
  	"version_content" varchar NOT NULL,
  	"version_status" "enum__community_posts_v_version_status" DEFAULT 'published' NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_community_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "community_comments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"post_id" integer NOT NULL,
  	"author_id" integer NOT NULL,
  	"content" varchar NOT NULL,
  	"status" "enum_community_comments_status" DEFAULT 'published' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "community_comments_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "_community_comments_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_post_id" integer NOT NULL,
  	"version_author_id" integer NOT NULL,
  	"version_content" varchar NOT NULL,
  	"version_status" "enum__community_comments_v_version_status" DEFAULT 'published' NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_community_comments_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "community_reactions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"post_id" integer NOT NULL,
  	"author_id" integer NOT NULL,
  	"reaction" "enum_community_reactions_reaction" NOT NULL,
  	"reaction_key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "community_reactions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "_community_reactions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_post_id" integer NOT NULL,
  	"version_author_id" integer NOT NULL,
  	"version_reaction" "enum__community_reactions_v_version_reaction" NOT NULL,
  	"version_reaction_key" varchar NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_community_reactions_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "community_reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reporter_id" integer NOT NULL,
  	"post_id" integer,
  	"comment_id" integer,
  	"reason" "enum_community_reports_reason" NOT NULL,
  	"details" varchar,
  	"report_key" varchar NOT NULL,
  	"status" "enum_community_reports_status" DEFAULT 'open' NOT NULL,
  	"admin_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "community_reports_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "_community_reports_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_reporter_id" integer NOT NULL,
  	"version_post_id" integer,
  	"version_comment_id" integer,
  	"version_reason" "enum__community_reports_v_version_reason" NOT NULL,
  	"version_details" varchar,
  	"version_report_key" varchar NOT NULL,
  	"version_status" "enum__community_reports_v_version_status" DEFAULT 'open' NOT NULL,
  	"version_admin_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_community_reports_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "community_blocks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"blocker_id" integer NOT NULL,
  	"blocked_id" integer NOT NULL,
  	"block_key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "community_blocks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "_community_blocks_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_blocker_id" integer NOT NULL,
  	"version_blocked_id" integer NOT NULL,
  	"version_block_key" varchar NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_community_blocks_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  ALTER TABLE "users" ADD COLUMN "community_age_confirmed_at" timestamp(3) with time zone;
  ALTER TABLE "_users_v" ADD COLUMN "version_community_age_confirmed_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "community_posts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "community_comments_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "community_reactions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "community_reports_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "community_blocks_id" integer;
  ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_posts_rels" ADD CONSTRAINT "community_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_posts_rels" ADD CONSTRAINT "community_posts_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_posts_rels" ADD CONSTRAINT "community_posts_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_posts_v" ADD CONSTRAINT "_community_posts_v_parent_id_community_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_posts_v" ADD CONSTRAINT "_community_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_posts_v_rels" ADD CONSTRAINT "_community_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_community_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_posts_v_rels" ADD CONSTRAINT "_community_posts_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_posts_v_rels" ADD CONSTRAINT "_community_posts_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_comments_rels" ADD CONSTRAINT "community_comments_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_comments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_comments_rels" ADD CONSTRAINT "community_comments_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_comments_rels" ADD CONSTRAINT "community_comments_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_comments_v" ADD CONSTRAINT "_community_comments_v_parent_id_community_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_comments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_comments_v" ADD CONSTRAINT "_community_comments_v_version_post_id_community_posts_id_fk" FOREIGN KEY ("version_post_id") REFERENCES "public"."community_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_comments_v" ADD CONSTRAINT "_community_comments_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_comments_v_rels" ADD CONSTRAINT "_community_comments_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_community_comments_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_comments_v_rels" ADD CONSTRAINT "_community_comments_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_comments_v_rels" ADD CONSTRAINT "_community_comments_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_reactions_rels" ADD CONSTRAINT "community_reactions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_reactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_reactions_rels" ADD CONSTRAINT "community_reactions_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_reactions_rels" ADD CONSTRAINT "community_reactions_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_reactions_v" ADD CONSTRAINT "_community_reactions_v_parent_id_community_reactions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_reactions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_reactions_v" ADD CONSTRAINT "_community_reactions_v_version_post_id_community_posts_id_fk" FOREIGN KEY ("version_post_id") REFERENCES "public"."community_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_reactions_v" ADD CONSTRAINT "_community_reactions_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_reactions_v_rels" ADD CONSTRAINT "_community_reactions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_community_reactions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_reactions_v_rels" ADD CONSTRAINT "_community_reactions_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_reactions_v_rels" ADD CONSTRAINT "_community_reactions_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_comment_id_community_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."community_comments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_reports_rels" ADD CONSTRAINT "community_reports_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_reports_rels" ADD CONSTRAINT "community_reports_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_reports_rels" ADD CONSTRAINT "community_reports_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_reports_v" ADD CONSTRAINT "_community_reports_v_parent_id_community_reports_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_reports"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_reports_v" ADD CONSTRAINT "_community_reports_v_version_reporter_id_users_id_fk" FOREIGN KEY ("version_reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_reports_v" ADD CONSTRAINT "_community_reports_v_version_post_id_community_posts_id_fk" FOREIGN KEY ("version_post_id") REFERENCES "public"."community_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_reports_v" ADD CONSTRAINT "_community_reports_v_version_comment_id_community_comments_id_fk" FOREIGN KEY ("version_comment_id") REFERENCES "public"."community_comments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_reports_v_rels" ADD CONSTRAINT "_community_reports_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_community_reports_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_reports_v_rels" ADD CONSTRAINT "_community_reports_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_reports_v_rels" ADD CONSTRAINT "_community_reports_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_blocks" ADD CONSTRAINT "community_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_blocks" ADD CONSTRAINT "community_blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "community_blocks_rels" ADD CONSTRAINT "community_blocks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_blocks_rels" ADD CONSTRAINT "community_blocks_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "community_blocks_rels" ADD CONSTRAINT "community_blocks_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_blocks_v" ADD CONSTRAINT "_community_blocks_v_parent_id_community_blocks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_blocks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_blocks_v" ADD CONSTRAINT "_community_blocks_v_version_blocker_id_users_id_fk" FOREIGN KEY ("version_blocker_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_blocks_v" ADD CONSTRAINT "_community_blocks_v_version_blocked_id_users_id_fk" FOREIGN KEY ("version_blocked_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_community_blocks_v_rels" ADD CONSTRAINT "_community_blocks_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_community_blocks_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_blocks_v_rels" ADD CONSTRAINT "_community_blocks_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_community_blocks_v_rels" ADD CONSTRAINT "_community_blocks_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "community_posts_author_idx" ON "community_posts" USING btree ("author_id");
  CREATE INDEX "community_posts_status_idx" ON "community_posts" USING btree ("status");
  CREATE INDEX "community_posts_updated_at_idx" ON "community_posts" USING btree ("updated_at");
  CREATE INDEX "community_posts_created_at_idx" ON "community_posts" USING btree ("created_at");
  CREATE INDEX "community_posts_rels_order_idx" ON "community_posts_rels" USING btree ("order");
  CREATE INDEX "community_posts_rels_parent_idx" ON "community_posts_rels" USING btree ("parent_id");
  CREATE INDEX "community_posts_rels_path_idx" ON "community_posts_rels" USING btree ("path");
  CREATE INDEX "community_posts_rels_admins_id_idx" ON "community_posts_rels" USING btree ("admins_id");
  CREATE INDEX "community_posts_rels_users_id_idx" ON "community_posts_rels" USING btree ("users_id");
  CREATE INDEX "_community_posts_v_parent_idx" ON "_community_posts_v" USING btree ("parent_id");
  CREATE INDEX "_community_posts_v_version_version_author_idx" ON "_community_posts_v" USING btree ("version_author_id");
  CREATE INDEX "_community_posts_v_version_version_status_idx" ON "_community_posts_v" USING btree ("version_status");
  CREATE INDEX "_community_posts_v_version_version_updated_at_idx" ON "_community_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_community_posts_v_version_version_created_at_idx" ON "_community_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_community_posts_v_created_at_idx" ON "_community_posts_v" USING btree ("created_at");
  CREATE INDEX "_community_posts_v_updated_at_idx" ON "_community_posts_v" USING btree ("updated_at");
  CREATE INDEX "_community_posts_v_rels_order_idx" ON "_community_posts_v_rels" USING btree ("order");
  CREATE INDEX "_community_posts_v_rels_parent_idx" ON "_community_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_community_posts_v_rels_path_idx" ON "_community_posts_v_rels" USING btree ("path");
  CREATE INDEX "_community_posts_v_rels_admins_id_idx" ON "_community_posts_v_rels" USING btree ("admins_id");
  CREATE INDEX "_community_posts_v_rels_users_id_idx" ON "_community_posts_v_rels" USING btree ("users_id");
  CREATE INDEX "community_comments_post_idx" ON "community_comments" USING btree ("post_id");
  CREATE INDEX "community_comments_author_idx" ON "community_comments" USING btree ("author_id");
  CREATE INDEX "community_comments_status_idx" ON "community_comments" USING btree ("status");
  CREATE INDEX "community_comments_updated_at_idx" ON "community_comments" USING btree ("updated_at");
  CREATE INDEX "community_comments_created_at_idx" ON "community_comments" USING btree ("created_at");
  CREATE INDEX "community_comments_rels_order_idx" ON "community_comments_rels" USING btree ("order");
  CREATE INDEX "community_comments_rels_parent_idx" ON "community_comments_rels" USING btree ("parent_id");
  CREATE INDEX "community_comments_rels_path_idx" ON "community_comments_rels" USING btree ("path");
  CREATE INDEX "community_comments_rels_admins_id_idx" ON "community_comments_rels" USING btree ("admins_id");
  CREATE INDEX "community_comments_rels_users_id_idx" ON "community_comments_rels" USING btree ("users_id");
  CREATE INDEX "_community_comments_v_parent_idx" ON "_community_comments_v" USING btree ("parent_id");
  CREATE INDEX "_community_comments_v_version_version_post_idx" ON "_community_comments_v" USING btree ("version_post_id");
  CREATE INDEX "_community_comments_v_version_version_author_idx" ON "_community_comments_v" USING btree ("version_author_id");
  CREATE INDEX "_community_comments_v_version_version_status_idx" ON "_community_comments_v" USING btree ("version_status");
  CREATE INDEX "_community_comments_v_version_version_updated_at_idx" ON "_community_comments_v" USING btree ("version_updated_at");
  CREATE INDEX "_community_comments_v_version_version_created_at_idx" ON "_community_comments_v" USING btree ("version_created_at");
  CREATE INDEX "_community_comments_v_created_at_idx" ON "_community_comments_v" USING btree ("created_at");
  CREATE INDEX "_community_comments_v_updated_at_idx" ON "_community_comments_v" USING btree ("updated_at");
  CREATE INDEX "_community_comments_v_rels_order_idx" ON "_community_comments_v_rels" USING btree ("order");
  CREATE INDEX "_community_comments_v_rels_parent_idx" ON "_community_comments_v_rels" USING btree ("parent_id");
  CREATE INDEX "_community_comments_v_rels_path_idx" ON "_community_comments_v_rels" USING btree ("path");
  CREATE INDEX "_community_comments_v_rels_admins_id_idx" ON "_community_comments_v_rels" USING btree ("admins_id");
  CREATE INDEX "_community_comments_v_rels_users_id_idx" ON "_community_comments_v_rels" USING btree ("users_id");
  CREATE INDEX "community_reactions_post_idx" ON "community_reactions" USING btree ("post_id");
  CREATE INDEX "community_reactions_author_idx" ON "community_reactions" USING btree ("author_id");
  CREATE UNIQUE INDEX "community_reactions_reaction_key_idx" ON "community_reactions" USING btree ("reaction_key");
  CREATE INDEX "community_reactions_updated_at_idx" ON "community_reactions" USING btree ("updated_at");
  CREATE INDEX "community_reactions_created_at_idx" ON "community_reactions" USING btree ("created_at");
  CREATE INDEX "community_reactions_rels_order_idx" ON "community_reactions_rels" USING btree ("order");
  CREATE INDEX "community_reactions_rels_parent_idx" ON "community_reactions_rels" USING btree ("parent_id");
  CREATE INDEX "community_reactions_rels_path_idx" ON "community_reactions_rels" USING btree ("path");
  CREATE INDEX "community_reactions_rels_admins_id_idx" ON "community_reactions_rels" USING btree ("admins_id");
  CREATE INDEX "community_reactions_rels_users_id_idx" ON "community_reactions_rels" USING btree ("users_id");
  CREATE INDEX "_community_reactions_v_parent_idx" ON "_community_reactions_v" USING btree ("parent_id");
  CREATE INDEX "_community_reactions_v_version_version_post_idx" ON "_community_reactions_v" USING btree ("version_post_id");
  CREATE INDEX "_community_reactions_v_version_version_author_idx" ON "_community_reactions_v" USING btree ("version_author_id");
  CREATE INDEX "_community_reactions_v_version_version_reaction_key_idx" ON "_community_reactions_v" USING btree ("version_reaction_key");
  CREATE INDEX "_community_reactions_v_version_version_updated_at_idx" ON "_community_reactions_v" USING btree ("version_updated_at");
  CREATE INDEX "_community_reactions_v_version_version_created_at_idx" ON "_community_reactions_v" USING btree ("version_created_at");
  CREATE INDEX "_community_reactions_v_created_at_idx" ON "_community_reactions_v" USING btree ("created_at");
  CREATE INDEX "_community_reactions_v_updated_at_idx" ON "_community_reactions_v" USING btree ("updated_at");
  CREATE INDEX "_community_reactions_v_rels_order_idx" ON "_community_reactions_v_rels" USING btree ("order");
  CREATE INDEX "_community_reactions_v_rels_parent_idx" ON "_community_reactions_v_rels" USING btree ("parent_id");
  CREATE INDEX "_community_reactions_v_rels_path_idx" ON "_community_reactions_v_rels" USING btree ("path");
  CREATE INDEX "_community_reactions_v_rels_admins_id_idx" ON "_community_reactions_v_rels" USING btree ("admins_id");
  CREATE INDEX "_community_reactions_v_rels_users_id_idx" ON "_community_reactions_v_rels" USING btree ("users_id");
  CREATE INDEX "community_reports_reporter_idx" ON "community_reports" USING btree ("reporter_id");
  CREATE INDEX "community_reports_post_idx" ON "community_reports" USING btree ("post_id");
  CREATE INDEX "community_reports_comment_idx" ON "community_reports" USING btree ("comment_id");
  CREATE UNIQUE INDEX "community_reports_report_key_idx" ON "community_reports" USING btree ("report_key");
  CREATE INDEX "community_reports_status_idx" ON "community_reports" USING btree ("status");
  CREATE INDEX "community_reports_updated_at_idx" ON "community_reports" USING btree ("updated_at");
  CREATE INDEX "community_reports_created_at_idx" ON "community_reports" USING btree ("created_at");
  CREATE INDEX "community_reports_rels_order_idx" ON "community_reports_rels" USING btree ("order");
  CREATE INDEX "community_reports_rels_parent_idx" ON "community_reports_rels" USING btree ("parent_id");
  CREATE INDEX "community_reports_rels_path_idx" ON "community_reports_rels" USING btree ("path");
  CREATE INDEX "community_reports_rels_admins_id_idx" ON "community_reports_rels" USING btree ("admins_id");
  CREATE INDEX "community_reports_rels_users_id_idx" ON "community_reports_rels" USING btree ("users_id");
  CREATE INDEX "_community_reports_v_parent_idx" ON "_community_reports_v" USING btree ("parent_id");
  CREATE INDEX "_community_reports_v_version_version_reporter_idx" ON "_community_reports_v" USING btree ("version_reporter_id");
  CREATE INDEX "_community_reports_v_version_version_post_idx" ON "_community_reports_v" USING btree ("version_post_id");
  CREATE INDEX "_community_reports_v_version_version_comment_idx" ON "_community_reports_v" USING btree ("version_comment_id");
  CREATE INDEX "_community_reports_v_version_version_report_key_idx" ON "_community_reports_v" USING btree ("version_report_key");
  CREATE INDEX "_community_reports_v_version_version_status_idx" ON "_community_reports_v" USING btree ("version_status");
  CREATE INDEX "_community_reports_v_version_version_updated_at_idx" ON "_community_reports_v" USING btree ("version_updated_at");
  CREATE INDEX "_community_reports_v_version_version_created_at_idx" ON "_community_reports_v" USING btree ("version_created_at");
  CREATE INDEX "_community_reports_v_created_at_idx" ON "_community_reports_v" USING btree ("created_at");
  CREATE INDEX "_community_reports_v_updated_at_idx" ON "_community_reports_v" USING btree ("updated_at");
  CREATE INDEX "_community_reports_v_rels_order_idx" ON "_community_reports_v_rels" USING btree ("order");
  CREATE INDEX "_community_reports_v_rels_parent_idx" ON "_community_reports_v_rels" USING btree ("parent_id");
  CREATE INDEX "_community_reports_v_rels_path_idx" ON "_community_reports_v_rels" USING btree ("path");
  CREATE INDEX "_community_reports_v_rels_admins_id_idx" ON "_community_reports_v_rels" USING btree ("admins_id");
  CREATE INDEX "_community_reports_v_rels_users_id_idx" ON "_community_reports_v_rels" USING btree ("users_id");
  CREATE INDEX "community_blocks_blocker_idx" ON "community_blocks" USING btree ("blocker_id");
  CREATE INDEX "community_blocks_blocked_idx" ON "community_blocks" USING btree ("blocked_id");
  CREATE UNIQUE INDEX "community_blocks_block_key_idx" ON "community_blocks" USING btree ("block_key");
  CREATE INDEX "community_blocks_updated_at_idx" ON "community_blocks" USING btree ("updated_at");
  CREATE INDEX "community_blocks_created_at_idx" ON "community_blocks" USING btree ("created_at");
  CREATE INDEX "community_blocks_rels_order_idx" ON "community_blocks_rels" USING btree ("order");
  CREATE INDEX "community_blocks_rels_parent_idx" ON "community_blocks_rels" USING btree ("parent_id");
  CREATE INDEX "community_blocks_rels_path_idx" ON "community_blocks_rels" USING btree ("path");
  CREATE INDEX "community_blocks_rels_admins_id_idx" ON "community_blocks_rels" USING btree ("admins_id");
  CREATE INDEX "community_blocks_rels_users_id_idx" ON "community_blocks_rels" USING btree ("users_id");
  CREATE INDEX "_community_blocks_v_parent_idx" ON "_community_blocks_v" USING btree ("parent_id");
  CREATE INDEX "_community_blocks_v_version_version_blocker_idx" ON "_community_blocks_v" USING btree ("version_blocker_id");
  CREATE INDEX "_community_blocks_v_version_version_blocked_idx" ON "_community_blocks_v" USING btree ("version_blocked_id");
  CREATE INDEX "_community_blocks_v_version_version_block_key_idx" ON "_community_blocks_v" USING btree ("version_block_key");
  CREATE INDEX "_community_blocks_v_version_version_updated_at_idx" ON "_community_blocks_v" USING btree ("version_updated_at");
  CREATE INDEX "_community_blocks_v_version_version_created_at_idx" ON "_community_blocks_v" USING btree ("version_created_at");
  CREATE INDEX "_community_blocks_v_created_at_idx" ON "_community_blocks_v" USING btree ("created_at");
  CREATE INDEX "_community_blocks_v_updated_at_idx" ON "_community_blocks_v" USING btree ("updated_at");
  CREATE INDEX "_community_blocks_v_rels_order_idx" ON "_community_blocks_v_rels" USING btree ("order");
  CREATE INDEX "_community_blocks_v_rels_parent_idx" ON "_community_blocks_v_rels" USING btree ("parent_id");
  CREATE INDEX "_community_blocks_v_rels_path_idx" ON "_community_blocks_v_rels" USING btree ("path");
  CREATE INDEX "_community_blocks_v_rels_admins_id_idx" ON "_community_blocks_v_rels" USING btree ("admins_id");
  CREATE INDEX "_community_blocks_v_rels_users_id_idx" ON "_community_blocks_v_rels" USING btree ("users_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_community_posts_fk" FOREIGN KEY ("community_posts_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_community_comments_fk" FOREIGN KEY ("community_comments_id") REFERENCES "public"."community_comments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_community_reactions_fk" FOREIGN KEY ("community_reactions_id") REFERENCES "public"."community_reactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_community_reports_fk" FOREIGN KEY ("community_reports_id") REFERENCES "public"."community_reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_community_blocks_fk" FOREIGN KEY ("community_blocks_id") REFERENCES "public"."community_blocks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_community_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("community_posts_id");
  CREATE INDEX "payload_locked_documents_rels_community_comments_id_idx" ON "payload_locked_documents_rels" USING btree ("community_comments_id");
  CREATE INDEX "payload_locked_documents_rels_community_reactions_id_idx" ON "payload_locked_documents_rels" USING btree ("community_reactions_id");
  CREATE INDEX "payload_locked_documents_rels_community_reports_id_idx" ON "payload_locked_documents_rels" USING btree ("community_reports_id");
   CREATE INDEX "payload_locked_documents_rels_community_blocks_id_idx" ON "payload_locked_documents_rels" USING btree ("community_blocks_id");
   CREATE INDEX "community_posts_feed_idx" ON "community_posts" ("status", "created_at" DESC, "id" DESC);
   CREATE INDEX "community_comments_feed_idx" ON "community_comments" ("post_id", "status", "created_at" DESC, "id" DESC);
   CREATE INDEX "community_reactions_post_author_idx" ON "community_reactions" ("post_id", "author_id");
   CREATE INDEX "community_blocks_blocked_blocker_idx" ON "community_blocks" ("blocked_id", "blocker_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     IF EXISTS (SELECT 1 FROM "community_posts")
       OR EXISTS (SELECT 1 FROM "community_comments")
       OR EXISTS (SELECT 1 FROM "community_reactions")
       OR EXISTS (SELECT 1 FROM "community_reports")
       OR EXISTS (SELECT 1 FROM "community_blocks")
       OR EXISTS (SELECT 1 FROM "community_rate_limits") THEN
       RAISE EXCEPTION 'Community data exists; refusing to remove it during migration rollback.';
     END IF;
   END $$;
   DROP INDEX "community_posts_feed_idx";
   DROP INDEX "community_comments_feed_idx";
   DROP INDEX "community_reactions_post_author_idx";
   DROP INDEX "community_blocks_blocked_blocker_idx";
   DROP TABLE "community_rate_limits";
   ALTER TABLE "community_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "community_posts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_community_posts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_community_posts_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "community_comments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "community_comments_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_community_comments_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_community_comments_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "community_reactions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "community_reactions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_community_reactions_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_community_reactions_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "community_reports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "community_reports_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_community_reports_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_community_reports_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "community_blocks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "community_blocks_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_community_blocks_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_community_blocks_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "community_posts" CASCADE;
  DROP TABLE "community_posts_rels" CASCADE;
  DROP TABLE "_community_posts_v" CASCADE;
  DROP TABLE "_community_posts_v_rels" CASCADE;
  DROP TABLE "community_comments" CASCADE;
  DROP TABLE "community_comments_rels" CASCADE;
  DROP TABLE "_community_comments_v" CASCADE;
  DROP TABLE "_community_comments_v_rels" CASCADE;
  DROP TABLE "community_reactions" CASCADE;
  DROP TABLE "community_reactions_rels" CASCADE;
  DROP TABLE "_community_reactions_v" CASCADE;
  DROP TABLE "_community_reactions_v_rels" CASCADE;
  DROP TABLE "community_reports" CASCADE;
  DROP TABLE "community_reports_rels" CASCADE;
  DROP TABLE "_community_reports_v" CASCADE;
  DROP TABLE "_community_reports_v_rels" CASCADE;
  DROP TABLE "community_blocks" CASCADE;
  DROP TABLE "community_blocks_rels" CASCADE;
  DROP TABLE "_community_blocks_v" CASCADE;
  DROP TABLE "_community_blocks_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_community_posts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_community_comments_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_community_reactions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_community_reports_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_community_blocks_fk";
  
  DROP INDEX "payload_locked_documents_rels_community_posts_id_idx";
  DROP INDEX "payload_locked_documents_rels_community_comments_id_idx";
  DROP INDEX "payload_locked_documents_rels_community_reactions_id_idx";
  DROP INDEX "payload_locked_documents_rels_community_reports_id_idx";
  DROP INDEX "payload_locked_documents_rels_community_blocks_id_idx";
  ALTER TABLE "users" DROP COLUMN "community_age_confirmed_at";
  ALTER TABLE "_users_v" DROP COLUMN "version_community_age_confirmed_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "community_posts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "community_comments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "community_reactions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "community_reports_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "community_blocks_id";
  DROP TYPE "public"."enum_community_posts_status";
  DROP TYPE "public"."enum__community_posts_v_version_status";
  DROP TYPE "public"."enum_community_comments_status";
  DROP TYPE "public"."enum__community_comments_v_version_status";
  DROP TYPE "public"."enum_community_reactions_reaction";
  DROP TYPE "public"."enum__community_reactions_v_version_reaction";
  DROP TYPE "public"."enum_community_reports_reason";
  DROP TYPE "public"."enum_community_reports_status";
  DROP TYPE "public"."enum__community_reports_v_version_reason";
  DROP TYPE "public"."enum__community_reports_v_version_status";`)
}
