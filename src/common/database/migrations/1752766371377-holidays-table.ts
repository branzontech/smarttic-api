import { MigrationInterface, QueryRunner } from 'typeorm';

export class HolidaysTable1752766371377 implements MigrationInterface {
  name = 'HolidaysTable1752766371377';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "holidays" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "date" character varying NOT NULL,
        "name" character varying NOT NULL,
        "year" integer NOT NULL,
        "branch_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_3646bdd4c3817d954d830881dfe" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "holidays"
      ADD CONSTRAINT "FK_c90bd385193eb39f844aaad363e"
      FOREIGN KEY ("branch_id") REFERENCES "Branches"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "holidays"
      DROP CONSTRAINT "FK_c90bd385193eb39f844aaad363e"
    `);
    await queryRunner.query(`DROP TABLE "holidays"`);
  }
}
