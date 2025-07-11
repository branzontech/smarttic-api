import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeRelationshipFormCategorytoFormTitle1752208349771 implements MigrationInterface {
    name = 'ChangeRelationshipFormCategorytoFormTitle1752208349771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TicketCategories" DROP CONSTRAINT "FK_1616b001da209d6835191ffe189"`);
        await queryRunner.query(`ALTER TABLE "TicketCategories" DROP COLUMN "formId"`);
        await queryRunner.query(`ALTER TABLE "TicketTitles" ADD "formId" uuid`);
        await queryRunner.query(`ALTER TABLE "TicketTitles" ADD CONSTRAINT "FK_8c2f48ab67b07b89aa580b300d0" FOREIGN KEY ("formId") REFERENCES "Forms"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TicketTitles" DROP CONSTRAINT "FK_8c2f48ab67b07b89aa580b300d0"`);
        await queryRunner.query(`ALTER TABLE "TicketTitles" DROP COLUMN "formId"`);
        await queryRunner.query(`ALTER TABLE "TicketCategories" ADD "formId" uuid`);
        await queryRunner.query(`ALTER TABLE "TicketCategories" ADD CONSTRAINT "FK_1616b001da209d6835191ffe189" FOREIGN KEY ("formId") REFERENCES "Forms"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
