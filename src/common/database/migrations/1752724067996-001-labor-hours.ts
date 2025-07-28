import { MigrationInterface, QueryRunner } from 'typeorm';

export class LaborHoursUuid1752729999999 implements MigrationInterface {
  name = 'LaborHoursUuid1752729999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "labor_hours"`);

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "labor_hours" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "day_of_week" integer NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "branch_id" UUID NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_a6767d5d488f20847f6ffe5eb38" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "labor_hours"
      ADD CONSTRAINT "FK_50b5b32fa84c8e507ac01727742"
      FOREIGN KEY ("branch_id") REFERENCES "Branches"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "labor_hours" DROP CONSTRAINT "FK_50b5b32fa84c8e507ac01727742"`,
    );
    await queryRunner.query(`DROP TABLE "labor_hours"`);

    await queryRunner.query(`
      CREATE TABLE "labor_hours" (
        "id" SERIAL NOT NULL,
        "day_of_week" integer NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "branch_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_a6767d5d488f20847f6ffe5eb38" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "labor_hours"
      ADD CONSTRAINT "FK_50b5b32fa84c8e507ac01727742"
      FOREIGN KEY ("branch_id") REFERENCES "Branches"("id") ON DELETE CASCADE
    `);
  }
}
