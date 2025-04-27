import { MigrationInterface, QueryRunner } from "typeorm";

export class TableTicket1744890626951 implements MigrationInterface {
    name = 'TableTicket1744890626951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "TicketDetails" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying, "ticketId" uuid, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "PK_5bc9f5a4568b2727c795cbcfa95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ticketNumber" SERIAL NOT NULL, "description" text, "ticketStateId" uuid, "ticketTitleId" uuid, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "UQ_fdd22d4de0e8337cf0201ee6836" UNIQUE ("ticketNumber"), CONSTRAINT "PK_6533595a87a7d0e3b7ed082b2aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "SurveyResponses" ADD CONSTRAINT "FK_97c0927315e9ebadd402abcd00c" FOREIGN KEY ("ticketId") REFERENCES "Tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TicketDetails" ADD CONSTRAINT "FK_edae1cb18a4d3fa50cfabc91b5e" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TicketDetails" ADD CONSTRAINT "FK_ad54ae418987717e4a50fff63a1" FOREIGN KEY ("ticketId") REFERENCES "Tickets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Tickets" ADD CONSTRAINT "FK_f2074c269d97f7a06dda867c964" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Tickets" ADD CONSTRAINT "FK_b66bba7ac2d3df999e331f291a7" FOREIGN KEY ("ticketTitleId") REFERENCES "TicketTitles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Tickets" ADD CONSTRAINT "FK_3cbe19891380fdff728e7a0f5e0" FOREIGN KEY ("ticketStateId") REFERENCES "Ticketstates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Tickets" DROP CONSTRAINT "FK_3cbe19891380fdff728e7a0f5e0"`);
        await queryRunner.query(`ALTER TABLE "Tickets" DROP CONSTRAINT "FK_b66bba7ac2d3df999e331f291a7"`);
        await queryRunner.query(`ALTER TABLE "Tickets" DROP CONSTRAINT "FK_f2074c269d97f7a06dda867c964"`);
        await queryRunner.query(`ALTER TABLE "TicketDetails" DROP CONSTRAINT "FK_ad54ae418987717e4a50fff63a1"`);
        await queryRunner.query(`ALTER TABLE "TicketDetails" DROP CONSTRAINT "FK_edae1cb18a4d3fa50cfabc91b5e"`);
        await queryRunner.query(`ALTER TABLE "SurveyResponses" DROP CONSTRAINT "FK_97c0927315e9ebadd402abcd00c"`);
        await queryRunner.query(`DROP TABLE "Tickets"`);
        await queryRunner.query(`DROP TABLE "TicketDetails"`);
    }

}
