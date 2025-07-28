import { MigrationInterface, QueryRunner } from 'typeorm';

export class Update1752780084009 implements MigrationInterface {
  name = 'Update1752780084009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Tickets" DROP CONSTRAINT "Tickets_branchId_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" DROP CONSTRAINT "FK_50b5b32fa84c8e507ac01727742"`,
    );
    await queryRunner.query(
      `ALTER TABLE "SurveyCalifications" ADD "score" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `UPDATE "Users" SET "limite_ticket" = 0 WHERE "limite_ticket" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Users" ALTER COLUMN "limite_ticket" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "Users" DROP CONSTRAINT "UQ_3c3ab3f49a87e6ddb607f3c4945"`,
    );
    await queryRunner.query(
      `ALTER TABLE "AssignedUserTickets" ALTER COLUMN "state" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" DROP COLUMN "start_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ADD "start_time" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "labor_hours" DROP COLUMN "end_time"`);
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ADD "end_time" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ALTER COLUMN "is_active" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "Tickets" ADD CONSTRAINT "FK_a8fc2d80c485817164b54937de2" FOREIGN KEY ("branchId") REFERENCES "Branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ADD CONSTRAINT "FK_50b5b32fa84c8e507ac01727742" FOREIGN KEY ("branch_id") REFERENCES "Branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "labor_hours" DROP CONSTRAINT "FK_50b5b32fa84c8e507ac01727742"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Tickets" DROP CONSTRAINT "FK_a8fc2d80c485817164b54937de2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ALTER COLUMN "is_active" SET DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "labor_hours" DROP COLUMN "end_time"`);
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ADD "end_time" TIME NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" DROP COLUMN "start_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ADD "start_time" TIME NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "AssignedUserTickets" ALTER COLUMN "state" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Users" ADD CONSTRAINT "UQ_3c3ab3f49a87e6ddb607f3c4945" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "Users" ALTER COLUMN "limite_ticket" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "SurveyCalifications" DROP COLUMN "score"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ADD CONSTRAINT "FK_50b5b32fa84c8e507ac01727742" FOREIGN KEY ("branch_id") REFERENCES "Branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
