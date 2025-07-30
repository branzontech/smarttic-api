import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBreakFieldsToLaborHours1753069424376
  implements MigrationInterface
{
  name = 'AddBreakFieldsToLaborHours1753069424376';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ADD "start_break" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ADD "end_break" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "labor_hours" DROP COLUMN "end_break"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labor_hours" DROP COLUMN "start_break"`,
    );
  }
}
