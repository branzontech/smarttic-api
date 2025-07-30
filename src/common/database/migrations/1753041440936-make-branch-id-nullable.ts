import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeBranchIdNullable1753041440936 implements MigrationInterface {
  name = 'MakeBranchIdNullable1753041440936';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "holidays" DROP CONSTRAINT "FK_c90bd385193eb39f844aaad363e"
    `);
    await queryRunner.query(`
      ALTER TABLE "holidays" ALTER COLUMN "branch_id" DROP NOT NULL
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
      ALTER TABLE "holidays" DROP CONSTRAINT "FK_c90bd385193eb39f844aaad363e"
    `);
    await queryRunner.query(`
      ALTER TABLE "holidays" ALTER COLUMN "branch_id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "holidays"
      ADD CONSTRAINT "FK_c90bd385193eb39f844aaad363e"
      FOREIGN KEY ("branch_id") REFERENCES "Branches"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }
}
