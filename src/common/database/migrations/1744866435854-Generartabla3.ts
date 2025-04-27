import { MigrationInterface, QueryRunner } from "typeorm";

export class Generartabla31744866435854 implements MigrationInterface {
    name = 'Generartabla31744866435854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "TicketTitles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "ticketCategoryId" uuid, "ticketPriorityId" uuid, CONSTRAINT "PK_495b5511c5643f2ed442a840524" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Tickes" ADD CONSTRAINT "FK_d951206cfd5fe365aef578a5cc3" FOREIGN KEY ("titleId") REFERENCES "TicketTitles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TicketTitles" ADD CONSTRAINT "FK_222ced57de8225ad6c063c185d3" FOREIGN KEY ("ticketCategoryId") REFERENCES "TicketCategories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TicketTitles" ADD CONSTRAINT "FK_ce90c8a81b316935547c4ed5855" FOREIGN KEY ("ticketPriorityId") REFERENCES "TicketPriorities"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TicketTitles" DROP CONSTRAINT "FK_ce90c8a81b316935547c4ed5855"`);
        await queryRunner.query(`ALTER TABLE "TicketTitles" DROP CONSTRAINT "FK_222ced57de8225ad6c063c185d3"`);
        await queryRunner.query(`ALTER TABLE "Tickes" DROP CONSTRAINT "FK_d951206cfd5fe365aef578a5cc3"`);
        await queryRunner.query(`DROP TABLE "TicketTitles"`);
    }

}
