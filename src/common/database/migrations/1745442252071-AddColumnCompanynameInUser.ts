import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnCompanynameInUser1745442252071 implements MigrationInterface {
    name = 'AddColumnCompanynameInUser1745442252071'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ADD "companyname" character varying`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "phone" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "phone" integer`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "companyname"`);
    }

}
