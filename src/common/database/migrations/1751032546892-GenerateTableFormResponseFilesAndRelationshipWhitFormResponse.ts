import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerateTableFormResponseFilesAndRelationshipWhitFormResponse1751032546892 implements MigrationInterface {
    name = 'GenerateTableFormResponseFilesAndRelationshipWhitFormResponse1751032546892'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "FormResponseFiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "originalName" character varying NOT NULL, "fieldKey" character varying NOT NULL, "formResponseId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_aea7b5224f3e446384683d2549f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "FormFields" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "FormFields" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "FormFields" DROP COLUMN "default_value"`);
        await queryRunner.query(`ALTER TABLE "FormFields" ADD "defaultValue" character varying`);
        await queryRunner.query(`ALTER TABLE "FormFields" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "FormFields" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "FormResponseFiles" ADD CONSTRAINT "FK_858fe63a9789f83be969caddc2b" FOREIGN KEY ("formResponseId") REFERENCES "FormResponses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "FormResponseFiles" DROP CONSTRAINT "FK_858fe63a9789f83be969caddc2b"`);
        await queryRunner.query(`ALTER TABLE "FormFields" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "FormFields" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "FormFields" DROP COLUMN "defaultValue"`);
        await queryRunner.query(`ALTER TABLE "FormFields" ADD "default_value" character varying`);
        await queryRunner.query(`ALTER TABLE "FormFields" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "FormFields" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP TABLE "FormResponseFiles"`);
    }

}
