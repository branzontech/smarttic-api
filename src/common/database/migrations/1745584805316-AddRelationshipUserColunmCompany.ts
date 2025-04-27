import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelationshipUserColunmCompany1745584805316 implements MigrationInterface {
    name = 'AddRelationshipUserColunmCompany1745584805316'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "FK_acd585adaed19fa672db8ff319d" FOREIGN KEY ("companyId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "FK_acd585adaed19fa672db8ff319d"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "companyId"`);
    }

}
