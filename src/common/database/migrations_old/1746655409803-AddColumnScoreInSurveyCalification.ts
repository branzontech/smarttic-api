import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnScoreInSurveyCalification1746655409803 implements MigrationInterface {
    name = 'AddColumnScoreInSurveyCalification1746655409803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "SurveyCalifications" ADD "score" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "SurveyCalifications" DROP COLUMN "score"`);
    }

}
