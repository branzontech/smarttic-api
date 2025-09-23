import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnTableUser1753976715759 implements MigrationInterface {
    name = 'AddColumnTableUser1753976715759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ADD "profileImageName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "profileImageName"`);
    }

}
