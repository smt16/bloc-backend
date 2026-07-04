import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Core Bloc domain: gyms, users, social graph, routes, sessions, climb logs,
 * activity feed (reactions + comments) and crews.
 *
 * Mirrors the product surface introduced in the bloc-mobile "app design"
 * commit (feed, logbook, route detail, profile, explore, crews).
 */
export class CoreDomain1751630000000 implements MigrationInterface {
  name = 'CoreDomain1751630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- gyms ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "gyms" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" varchar(120) NOT NULL,
        "city" varchar(120),
        "accent_color" varchar(9),
        "climbers_here" integer NOT NULL DEFAULT 0,
        CONSTRAINT "pk_gyms" PRIMARY KEY ("id")
      )
    `);

    // --- users --------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "auth0_sub" varchar(128) NOT NULL,
        "email" varchar(320),
        "name" varchar(120),
        "handle" varchar(40),
        "picture_url" text,
        "avatar_color" varchar(9),
        "initials" varchar(4),
        "top_grade" varchar(8),
        "home_gym_id" uuid,
        "bio" text,
        "style_tags" text[] NOT NULL DEFAULT '{}',
        "privacy" varchar(16) NOT NULL DEFAULT 'public',
        "streak_days" integer NOT NULL DEFAULT 0,
        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_auth0_sub" UNIQUE ("auth0_sub"),
        CONSTRAINT "uq_users_handle" UNIQUE ("handle"),
        CONSTRAINT "fk_users_home_gym" FOREIGN KEY ("home_gym_id")
          REFERENCES "gyms" ("id") ON DELETE SET NULL
      )
    `);

    // --- follows ------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "follows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "follower_id" uuid NOT NULL,
        "followee_id" uuid NOT NULL,
        CONSTRAINT "pk_follows" PRIMARY KEY ("id"),
        CONSTRAINT "uq_follow_pair" UNIQUE ("follower_id", "followee_id"),
        CONSTRAINT "fk_follows_follower" FOREIGN KEY ("follower_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_follows_followee" FOREIGN KEY ("followee_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_follows_follower" ON "follows" ("follower_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_follows_followee" ON "follows" ("followee_id")`,
    );

    // --- milestones ---------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "milestones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "kind" varchar(16) NOT NULL DEFAULT 'milestone',
        "title" varchar(120) NOT NULL,
        "detail" text,
        "icon" varchar(40),
        "tone" varchar(16) NOT NULL DEFAULT 'accent',
        "earned" boolean NOT NULL DEFAULT true,
        "achieved_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "pk_milestones" PRIMARY KEY ("id"),
        CONSTRAINT "fk_milestones_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_milestones_user" ON "milestones" ("user_id")`,
    );

    // --- climbing_routes ----------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "climbing_routes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "gym_id" uuid NOT NULL,
        "name" varchar(120) NOT NULL,
        "grade" varchar(8) NOT NULL,
        "wall" varchar(80),
        "color" varchar(9),
        "setter" varchar(80),
        "setter_initials" varchar(4),
        "setter_note" text,
        "style_tags" text[] NOT NULL DEFAULT '{}',
        "beta_video_count" integer NOT NULL DEFAULT 0,
        CONSTRAINT "pk_climbing_routes" PRIMARY KEY ("id"),
        CONSTRAINT "fk_routes_gym" FOREIGN KEY ("gym_id")
          REFERENCES "gyms" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_routes_gym" ON "climbing_routes" ("gym_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_routes_grade" ON "climbing_routes" ("grade")`,
    );

    // --- climb_sessions -----------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "climb_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "gym_id" uuid,
        "session_date" date NOT NULL,
        "duration_mins" integer,
        "note" text,
        CONSTRAINT "pk_climb_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sessions_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sessions_gym" FOREIGN KEY ("gym_id")
          REFERENCES "gyms" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_user" ON "climb_sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_gym" ON "climb_sessions" ("gym_id")`,
    );

    // --- climb_logs ---------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "climb_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "route_id" uuid,
        "gym_id" uuid,
        "session_id" uuid,
        "grade" varchar(8) NOT NULL,
        "outcome" varchar(16) NOT NULL,
        "attempts" integer NOT NULL DEFAULT 1,
        "note" text,
        "has_media" boolean NOT NULL DEFAULT false,
        "logged_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_climb_logs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_logs_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_logs_route" FOREIGN KEY ("route_id")
          REFERENCES "climbing_routes" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_logs_gym" FOREIGN KEY ("gym_id")
          REFERENCES "gyms" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_logs_session" FOREIGN KEY ("session_id")
          REFERENCES "climb_sessions" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_logs_user" ON "climb_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_logs_route" ON "climb_logs" ("route_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_logs_session" ON "climb_logs" ("session_id")`,
    );

    // --- route_comments -----------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "route_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "route_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "body" text NOT NULL,
        CONSTRAINT "pk_route_comments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_route_comments_route" FOREIGN KEY ("route_id")
          REFERENCES "climbing_routes" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_route_comments_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_route_comments_route" ON "route_comments" ("route_id")`,
    );

    // --- feed_items ---------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "feed_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "kind" varchar(16) NOT NULL,
        "headline" varchar(160) NOT NULL,
        "route_id" uuid,
        "gym_id" uuid,
        "session_id" uuid,
        "grade" varchar(8),
        "route_name" varchar(120),
        "note" text,
        "attempts" integer,
        "has_media" boolean NOT NULL DEFAULT false,
        CONSTRAINT "pk_feed_items" PRIMARY KEY ("id"),
        CONSTRAINT "fk_feed_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_feed_route" FOREIGN KEY ("route_id")
          REFERENCES "climbing_routes" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_feed_gym" FOREIGN KEY ("gym_id")
          REFERENCES "gyms" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_feed_session" FOREIGN KEY ("session_id")
          REFERENCES "climb_sessions" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_feed_user" ON "feed_items" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_feed_created" ON "feed_items" ("created_at")`,
    );

    // --- reactions ----------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "reactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "feed_item_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "type" varchar(16) NOT NULL,
        CONSTRAINT "pk_reactions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_reaction_user_item" UNIQUE ("feed_item_id", "user_id"),
        CONSTRAINT "fk_reactions_feed" FOREIGN KEY ("feed_item_id")
          REFERENCES "feed_items" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_reactions_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_reactions_feed" ON "reactions" ("feed_item_id")`,
    );

    // --- feed_comments ------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "feed_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "feed_item_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "body" text NOT NULL,
        CONSTRAINT "pk_feed_comments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_feed_comments_feed" FOREIGN KEY ("feed_item_id")
          REFERENCES "feed_items" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_feed_comments_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_feed_comments_feed" ON "feed_comments" ("feed_item_id")`,
    );

    // --- crews --------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "crews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" varchar(80) NOT NULL,
        "emoji" varchar(16),
        "blurb" text,
        CONSTRAINT "pk_crews" PRIMARY KEY ("id")
      )
    `);

    // --- crew_members -------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "crew_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "crew_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" varchar(16) NOT NULL DEFAULT 'member',
        "last_active_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "pk_crew_members" PRIMARY KEY ("id"),
        CONSTRAINT "uq_crew_member" UNIQUE ("crew_id", "user_id"),
        CONSTRAINT "fk_crew_members_crew" FOREIGN KEY ("crew_id")
          REFERENCES "crews" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_crew_members_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_crew_members_crew" ON "crew_members" ("crew_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_crew_members_user" ON "crew_members" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "crew_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feed_comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feed_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "route_comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "climb_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "climb_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "climbing_routes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "milestones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "follows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gyms"`);
  }
}
