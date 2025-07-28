import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeleteYearPropierity1753228891480 implements MigrationInterface {
  name = 'DeleteYearPropierity1753228891480';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "holidays" DROP COLUMN "year"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "holidays" ADD "year" integer NOT NULL`,
    );
  }
}
