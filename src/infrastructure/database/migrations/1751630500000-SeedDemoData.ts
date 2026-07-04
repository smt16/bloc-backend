import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Demo seed mirroring bloc-mobile's `src/data/mock.ts` so the API returns
 * realistic content out of the box (gyms, climbers, routes, crews, feed).
 *
 * All rows use fixed UUID prefixes per table so `down()` can remove exactly the
 * seeded data without touching real user activity.
 */
export class SeedDemoData1751630500000 implements MigrationInterface {
  name = 'SeedDemoData1751630500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Gyms
    await queryRunner.query(`
      INSERT INTO "gyms" ("id","name","city","accent_color","climbers_here") VALUES
      ('11111111-1111-1111-1111-000000000001','The Cliffs LIC','Long Island City, NY','#FF6B3D',42),
      ('11111111-1111-1111-1111-000000000002','Brooklyn Boulders','Gowanus, NY','#8B5CF6',67),
      ('11111111-1111-1111-1111-000000000003','VITAL Brooklyn','Bushwick, NY','#38E1D6',29),
      ('11111111-1111-1111-1111-000000000004','B-Pump Ogikubo','Tokyo, JP','#FF3D5A',18),
      ('11111111-1111-1111-1111-000000000005','Movement Denver','Denver, CO','#3DDC97',24)
    `);

    // Climbers
    await queryRunner.query(`
      INSERT INTO "users"
        ("id","auth0_sub","name","handle","avatar_color","initials","top_grade","home_gym_id","style_tags","privacy","streak_days") VALUES
      ('22222222-2222-2222-2222-000000000001','seed|maya','Maya Ramos','mayasends','#FF3D77','MR','V6','11111111-1111-1111-1111-000000000002','{Crimpy,Slab}','public',5),
      ('22222222-2222-2222-2222-000000000002','seed|diego','Diego Alvarez','dieaglo','#38E1D6','DA','V4','11111111-1111-1111-1111-000000000005','{Endurance}','public',3),
      ('22222222-2222-2222-2222-000000000003','seed|yuki','Yuki Tanaka','yuki.climbs','#8B5CF6','YT','V7','11111111-1111-1111-1111-000000000004','{Powerful,Overhang}','public',12),
      ('22222222-2222-2222-2222-000000000004','seed|sana','Sana Kapoor','sanak','#3DDC97','SK','V5','11111111-1111-1111-1111-000000000003','{Balance}','public',30),
      ('22222222-2222-2222-2222-000000000005','seed|leo','Leo Fischer','leo_f','#F2C94C','LF','V8','11111111-1111-1111-1111-000000000001','{Slopers,Compression}','public',6)
    `);

    // Routes
    await queryRunner.query(`
      INSERT INTO "climbing_routes"
        ("id","gym_id","name","grade","wall","color","setter","setter_initials","setter_note","style_tags","beta_video_count") VALUES
      ('33333333-3333-3333-3333-000000000001','11111111-1111-1111-1111-000000000002','Tundra','V6','Comp slab','#38E1D6','Nils K.','NK','Trust your feet on the top-out.','{Crimpy,Slab,Balance}',6),
      ('33333333-3333-3333-3333-000000000002','11111111-1111-1111-1111-000000000004','Static Memory','V7','45° cave','#FF3D5A','Aya M.','AM','Powerful overhang — commit to the dyno.','{Powerful,Overhang,Dyno}',9),
      ('33333333-3333-3333-3333-000000000003','11111111-1111-1111-1111-000000000001','Paper Cranes','V4','Sunset wall','#FF9F45','Jordan P.','JP',NULL,'{Techy,Vertical}',3),
      ('33333333-3333-3333-3333-000000000004','11111111-1111-1111-1111-000000000001','Molasses','V3','Cave','#F2C94C','Jordan P.','JP',NULL,'{Sloper,Compression}',2)
    `);

    // Crews
    await queryRunner.query(`
      INSERT INTO "crews" ("id","name","emoji","blurb") VALUES
      ('44444444-4444-4444-4444-000000000001','Dawn Patrol','🌅','Early birds who climb before work.'),
      ('44444444-4444-4444-4444-000000000002','Slab Club','🦶','Footwork nerds & balance believers.'),
      ('44444444-4444-4444-4444-000000000003','Women Who Send','💪','Support, beta, and projecting together.'),
      ('44444444-4444-4444-4444-000000000004','V5 Grind','🎯','Breaking into the mid grades as a squad.')
    `);

    // Crew memberships (some active today)
    await queryRunner.query(`
      INSERT INTO "crew_members" ("id","crew_id","user_id","role","last_active_at") VALUES
      ('cccccccc-cccc-cccc-cccc-000000000001','44444444-4444-4444-4444-000000000001','22222222-2222-2222-2222-000000000005','owner',now()),
      ('cccccccc-cccc-cccc-cccc-000000000002','44444444-4444-4444-4444-000000000001','22222222-2222-2222-2222-000000000001','member',now()),
      ('cccccccc-cccc-cccc-cccc-000000000003','44444444-4444-4444-4444-000000000001','22222222-2222-2222-2222-000000000002','member',now() - interval '2 days'),
      ('cccccccc-cccc-cccc-cccc-000000000004','44444444-4444-4444-4444-000000000002','22222222-2222-2222-2222-000000000004','owner',now()),
      ('cccccccc-cccc-cccc-cccc-000000000005','44444444-4444-4444-4444-000000000002','22222222-2222-2222-2222-000000000003','member',now()),
      ('cccccccc-cccc-cccc-cccc-000000000006','44444444-4444-4444-4444-000000000002','22222222-2222-2222-2222-000000000005','member',now() - interval '3 days'),
      ('cccccccc-cccc-cccc-cccc-000000000007','44444444-4444-4444-4444-000000000003','22222222-2222-2222-2222-000000000001','owner',now()),
      ('cccccccc-cccc-cccc-cccc-000000000008','44444444-4444-4444-4444-000000000003','22222222-2222-2222-2222-000000000004','member',now() - interval '1 day'),
      ('cccccccc-cccc-cccc-cccc-000000000009','44444444-4444-4444-4444-000000000004','22222222-2222-2222-2222-000000000002','owner',now() - interval '5 days'),
      ('cccccccc-cccc-cccc-cccc-000000000010','44444444-4444-4444-4444-000000000004','22222222-2222-2222-2222-000000000004','member',now())
    `);

    // Social graph
    await queryRunner.query(`
      INSERT INTO "follows" ("id","follower_id","followee_id") VALUES
      ('bbbbbbbb-bbbb-bbbb-bbbb-000000000001','22222222-2222-2222-2222-000000000001','22222222-2222-2222-2222-000000000003'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-000000000002','22222222-2222-2222-2222-000000000001','22222222-2222-2222-2222-000000000005'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-000000000003','22222222-2222-2222-2222-000000000002','22222222-2222-2222-2222-000000000001'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-000000000004','22222222-2222-2222-2222-000000000004','22222222-2222-2222-2222-000000000001'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-000000000005','22222222-2222-2222-2222-000000000005','22222222-2222-2222-2222-000000000004'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-000000000006','22222222-2222-2222-2222-000000000003','22222222-2222-2222-2222-000000000005')
    `);

    // Milestones + achievements for a showcase climber (Leo)
    await queryRunner.query(`
      INSERT INTO "milestones" ("id","user_id","kind","title","detail","icon","tone","earned","achieved_at") VALUES
      ('dddddddd-dddd-dddd-dddd-000000000001','22222222-2222-2222-2222-000000000005','milestone','First V5','“Paper Cranes” at The Cliffs LIC','trophy','accent',true, now() - interval '2 months'),
      ('dddddddd-dddd-dddd-dddd-000000000002','22222222-2222-2222-2222-000000000005','milestone','30-day streak','Consistency unlocked','flame','purple',true, now() - interval '3 months'),
      ('dddddddd-dddd-dddd-dddd-000000000003','22222222-2222-2222-2222-000000000005','milestone','Joined Slab Club','Found your people','people','cyan',true, now() - interval '4 months'),
      ('dddddddd-dddd-dddd-dddd-000000000004','22222222-2222-2222-2222-000000000005','achievement','First V5','trophy','trophy','accent',true,NULL),
      ('dddddddd-dddd-dddd-dddd-000000000005','22222222-2222-2222-2222-000000000005','achievement','30-day streak','flame','flame','purple',true,NULL),
      ('dddddddd-dddd-dddd-dddd-000000000006','22222222-2222-2222-2222-000000000005','achievement','First V7','rocket','rocket','accent',false,NULL)
    `);

    // Route sends → powers route stats, recent senders, grade pyramids
    await queryRunner.query(`
      INSERT INTO "climb_logs"
        ("id","user_id","route_id","gym_id","grade","outcome","attempts","note","has_media","logged_at") VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001','22222222-2222-2222-2222-000000000001','33333333-3333-3333-3333-000000000001','11111111-1111-1111-1111-000000000002','V6','send',12,'Screamed at the top.',true, now() - interval '2 hours'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002','22222222-2222-2222-2222-000000000002','33333333-3333-3333-3333-000000000001','11111111-1111-1111-1111-000000000002','V6','send',8,NULL,false, now() - interval '1 day'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003','22222222-2222-2222-2222-000000000004','33333333-3333-3333-3333-000000000001','11111111-1111-1111-1111-000000000002','V6','send',6,NULL,false, now() - interval '3 days'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004','22222222-2222-2222-2222-000000000005','33333333-3333-3333-3333-000000000001','11111111-1111-1111-1111-000000000002','V6','flash',1,'Flashed it.',false, now() - interval '5 hours'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005','22222222-2222-2222-2222-000000000003','33333333-3333-3333-3333-000000000002','11111111-1111-1111-1111-000000000004','V7','project',6,'Sticking the dyno now.',false, now() - interval '5 hours')
    `);

    // A logbook for Leo (sessions + linked sends)
    await queryRunner.query(`
      INSERT INTO "climb_sessions" ("id","user_id","gym_id","session_date","duration_mins","note") VALUES
      ('99999999-9999-9999-9999-000000000001','22222222-2222-2222-2222-000000000005','11111111-1111-1111-1111-000000000001',current_date,95,'Worked the comp wall. Crimps felt good.'),
      ('99999999-9999-9999-9999-000000000002','22222222-2222-2222-2222-000000000005','11111111-1111-1111-1111-000000000001',current_date - 3,120,'New set. So many fun slabs.')
    `);
    await queryRunner.query(`
      INSERT INTO "climb_logs"
        ("id","user_id","route_id","gym_id","session_id","grade","outcome","attempts","has_media","logged_at") VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-000000000006','22222222-2222-2222-2222-000000000005','33333333-3333-3333-3333-000000000003','11111111-1111-1111-1111-000000000001','99999999-9999-9999-9999-000000000001','V4','send',3,false, now()),
      ('aaaaaaaa-aaaa-aaaa-aaaa-000000000007','22222222-2222-2222-2222-000000000005','33333333-3333-3333-3333-000000000004','11111111-1111-1111-1111-000000000001','99999999-9999-9999-9999-000000000001','V3','flash',1,false, now()),
      ('aaaaaaaa-aaaa-aaaa-aaaa-000000000008','22222222-2222-2222-2222-000000000005','33333333-3333-3333-3333-000000000004','11111111-1111-1111-1111-000000000001','99999999-9999-9999-9999-000000000002','V3','send',2,false, now() - interval '3 days')
    `);

    // Activity feed
    await queryRunner.query(`
      INSERT INTO "feed_items"
        ("id","user_id","kind","headline","route_id","route_name","gym_id","grade","note","attempts","has_media","created_at") VALUES
      ('55555555-5555-5555-5555-000000000001','22222222-2222-2222-2222-000000000001','send','sent her first V6','33333333-3333-3333-3333-000000000001','Tundra','11111111-1111-1111-1111-000000000002','V6','Twelve sessions on this crimpy slab. Screamed at the top 🥹',12,true, now() - interval '2 hours'),
      ('55555555-5555-5555-5555-000000000002','22222222-2222-2222-2222-000000000003','project','is projecting','33333333-3333-3333-3333-000000000002','Static Memory','11111111-1111-1111-1111-000000000004','V7','Powerful overhang. Sticking the dyno now — send is close.',6,false, now() - interval '5 hours'),
      ('55555555-5555-5555-5555-000000000003','22222222-2222-2222-2222-000000000002','session','logged a session',NULL,NULL,'11111111-1111-1111-1111-000000000005',NULL,'9 problems, V2 → V4. Legs are done.',NULL,false, now() - interval '8 hours'),
      ('55555555-5555-5555-5555-000000000004','22222222-2222-2222-2222-000000000004','milestone','hit a 30-day streak',NULL,NULL,'11111111-1111-1111-1111-000000000003',NULL,'One month on the wall every other day. Feeling strong.',NULL,false, now() - interval '1 day')
    `);

    // Reactions
    await queryRunner.query(`
      INSERT INTO "reactions" ("id","feed_item_id","user_id","type") VALUES
      ('66666666-6666-6666-6666-000000000001','55555555-5555-5555-5555-000000000001','22222222-2222-2222-2222-000000000005','fire'),
      ('66666666-6666-6666-6666-000000000002','55555555-5555-5555-5555-000000000001','22222222-2222-2222-2222-000000000002','fire'),
      ('66666666-6666-6666-6666-000000000003','55555555-5555-5555-5555-000000000001','22222222-2222-2222-2222-000000000004','strong'),
      ('66666666-6666-6666-6666-000000000004','55555555-5555-5555-5555-000000000001','22222222-2222-2222-2222-000000000003','clap'),
      ('66666666-6666-6666-6666-000000000005','55555555-5555-5555-5555-000000000002','22222222-2222-2222-2222-000000000001','strong'),
      ('66666666-6666-6666-6666-000000000006','55555555-5555-5555-5555-000000000002','22222222-2222-2222-2222-000000000005','strong'),
      ('66666666-6666-6666-6666-000000000007','55555555-5555-5555-5555-000000000002','22222222-2222-2222-2222-000000000004','fire'),
      ('66666666-6666-6666-6666-000000000008','55555555-5555-5555-5555-000000000004','22222222-2222-2222-2222-000000000001','clap'),
      ('66666666-6666-6666-6666-000000000009','55555555-5555-5555-5555-000000000004','22222222-2222-2222-2222-000000000005','clap'),
      ('66666666-6666-6666-6666-000000000010','55555555-5555-5555-5555-000000000004','22222222-2222-2222-2222-000000000002','fire')
    `);

    // Feed comments
    await queryRunner.query(`
      INSERT INTO "feed_comments" ("id","feed_item_id","user_id","body") VALUES
      ('77777777-7777-7777-7777-000000000001','55555555-5555-5555-5555-000000000001','22222222-2222-2222-2222-000000000005','Huge! That slab is no joke.'),
      ('77777777-7777-7777-7777-000000000002','55555555-5555-5555-5555-000000000001','22222222-2222-2222-2222-000000000004','So proud of you 🔥')
    `);

    // Route comments (Tundra beta)
    await queryRunner.query(`
      INSERT INTO "route_comments" ("id","route_id","user_id","body") VALUES
      ('88888888-8888-8888-8888-000000000001','33333333-3333-3333-3333-000000000001','22222222-2222-2222-2222-000000000003','Heel hook on the left volume is the move 🔑'),
      ('88888888-8888-8888-8888-000000000002','33333333-3333-3333-3333-000000000001','22222222-2222-2222-2222-000000000004','Sooo crimpy. Skin destroyer.')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const prefixes: [string, string][] = [
      ['route_comments', '88888888'],
      ['feed_comments', '77777777'],
      ['reactions', '66666666'],
      ['feed_items', '55555555'],
      ['climb_logs', 'aaaaaaaa'],
      ['climb_sessions', '99999999'],
      ['milestones', 'dddddddd'],
      ['follows', 'bbbbbbbb'],
      ['crew_members', 'cccccccc'],
      ['crews', '44444444'],
      ['climbing_routes', '33333333'],
      ['users', '22222222'],
      ['gyms', '11111111'],
    ];
    for (const [table, prefix] of prefixes) {
      await queryRunner.query(
        `DELETE FROM "${table}" WHERE "id"::text LIKE '${prefix}%'`,
      );
    }
  }
}
