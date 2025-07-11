import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnImageBase641745278732444 implements MigrationInterface {
    name = 'AddColumnImageBase641745278732444'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "SurveyCalifications" ADD "imageBase64" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "SurveyCalifications" DROP COLUMN "imageBase64"`);
    }

}
