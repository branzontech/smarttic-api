import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewFieldStatus1753324681154 implements MigrationInterface {
  name = 'NewFieldStatus1753324681154';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "labor_hours" ADD "status" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "labor_hours" DROP COLUMN "status"`);
  }
}
