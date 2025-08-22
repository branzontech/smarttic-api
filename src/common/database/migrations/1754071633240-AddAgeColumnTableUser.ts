import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAgeColumnTableUser1754071633240 implements MigrationInterface {
    name = 'AddAgeColumnTableUser1754071633240'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ADD "age" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "age"`);
    }

}
