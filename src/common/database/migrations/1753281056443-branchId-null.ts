import { MigrationInterface, QueryRunner } from 'typeorm';

export class BranchIdNull1753281056443 implements MigrationInterface {
  name = 'BranchIdNull1753281056443';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "labor_hours" DROP CONSTRAINT "FK_50b5b32fa84c8e507ac01727742"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ALTER COLUMN "branch_id" DROP NOT NULL`,
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
      `ALTER TABLE "labor_hours" ALTER COLUMN "branch_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ADD CONSTRAINT "FK_50b5b32fa84c8e507ac01727742" FOREIGN KEY ("branch_id") REFERENCES "Branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
