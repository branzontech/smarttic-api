import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableNoteAgentTicket1753113494164 implements MigrationInterface {
    name = 'CreateTableNoteAgentTicket1753113494164'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "NoteAgentTickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" text NOT NULL, "ticketId" uuid, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_ae179cf675f7a46253a597f9ce4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "NoteAgentTickets" ADD CONSTRAINT "FK_7ca8788f57b25becdf6f47dcb35" FOREIGN KEY ("ticketId") REFERENCES "Tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "NoteAgentTickets" ADD CONSTRAINT "FK_78737836cee43413c1e50f5f47f" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "NoteAgentTickets" DROP CONSTRAINT "FK_78737836cee43413c1e50f5f47f"`);
        await queryRunner.query(`ALTER TABLE "NoteAgentTickets" DROP CONSTRAINT "FK_7ca8788f57b25becdf6f47dcb35"`);
        await queryRunner.query(`DROP TABLE "NoteAgentTickets"`);
    }

}
