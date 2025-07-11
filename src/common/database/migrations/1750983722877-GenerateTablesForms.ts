import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerateTablesForms1750983722877 implements MigrationInterface {
    name = 'GenerateTablesForms1750983722877'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "FormFields" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "label" character varying(255) NOT NULL, "fieldKey" character varying(255) NOT NULL, "type" character varying(50) NOT NULL, "options" json, "is_required" boolean NOT NULL DEFAULT false, "order" integer NOT NULL, "validations" json, "default_value" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "formId" uuid, CONSTRAINT "PK_1b95c0a79623cdf5cf5b164c3fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "FormResponses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "responses" jsonb NOT NULL, "formId" uuid NOT NULL, "ticketId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bc0598c67a7929cb59b5aca0bc6" UNIQUE ("ticketId"), CONSTRAINT "PK_3e4e76752b7645d3f2cde62897c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6126dc647f40f094511c1dac45" ON "FormResponses" ("formId", "ticketId") `);
        await queryRunner.query(`CREATE TABLE "Forms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "is_template" boolean NOT NULL DEFAULT true, "is_active" boolean NOT NULL DEFAULT true, "version" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_d034bd2b3fbe8c4d20cca4daa86" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Tickets" ADD "formResponseId" uuid`);
        await queryRunner.query(`ALTER TABLE "Tickets" ADD CONSTRAINT "UQ_d3ead7aa381b6bc71e50675353f" UNIQUE ("formResponseId")`);
        await queryRunner.query(`ALTER TABLE "TicketCategories" ADD "formId" uuid`);
        await queryRunner.query(`ALTER TABLE "FormFields" ADD CONSTRAINT "FK_9296333acd35ec61b91e6eb5007" FOREIGN KEY ("formId") REFERENCES "Forms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Tickets" ADD CONSTRAINT "FK_d3ead7aa381b6bc71e50675353f" FOREIGN KEY ("formResponseId") REFERENCES "FormResponses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "FormResponses" ADD CONSTRAINT "FK_f61cb3b168b4cb07c0651a16539" FOREIGN KEY ("formId") REFERENCES "Forms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TicketCategories" ADD CONSTRAINT "FK_1616b001da209d6835191ffe189" FOREIGN KEY ("formId") REFERENCES "Forms"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TicketCategories" DROP CONSTRAINT "FK_1616b001da209d6835191ffe189"`);
        await queryRunner.query(`ALTER TABLE "FormResponses" DROP CONSTRAINT "FK_f61cb3b168b4cb07c0651a16539"`);
        await queryRunner.query(`ALTER TABLE "Tickets" DROP CONSTRAINT "FK_d3ead7aa381b6bc71e50675353f"`);
        await queryRunner.query(`ALTER TABLE "FormFields" DROP CONSTRAINT "FK_9296333acd35ec61b91e6eb5007"`);
        await queryRunner.query(`ALTER TABLE "TicketCategories" DROP COLUMN "formId"`);
        await queryRunner.query(`ALTER TABLE "Tickets" DROP CONSTRAINT "UQ_d3ead7aa381b6bc71e50675353f"`);
        await queryRunner.query(`ALTER TABLE "Tickets" DROP COLUMN "formResponseId"`);
        await queryRunner.query(`DROP TABLE "Forms"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6126dc647f40f094511c1dac45"`);
        await queryRunner.query(`DROP TABLE "FormResponses"`);
        await queryRunner.query(`DROP TABLE "FormFields"`);
    }

}
