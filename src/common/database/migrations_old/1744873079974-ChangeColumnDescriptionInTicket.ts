import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeColumnDescriptionInTicket1744873079974 implements MigrationInterface {
    name = 'ChangeColumnDescriptionInTicket1744873079974'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Tickes" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "Tickes" ADD "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Tickes" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "Tickes" ADD "description" character varying`);
    }

}
