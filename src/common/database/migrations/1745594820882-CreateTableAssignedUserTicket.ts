import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableAssignedUserTicket1745594820882 implements MigrationInterface {
    name = 'CreateTableAssignedUserTicket1745594820882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "AssignedUserTickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ticketId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_bedf16e947711a18c8fbc024234" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "AssignedUserTickets" ADD CONSTRAINT "FK_5ff3dbb00891dece29c4a46d1f1" FOREIGN KEY ("ticketId") REFERENCES "Tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AssignedUserTickets" ADD CONSTRAINT "FK_955b68edc3b6ac9bfafb417188e" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "AssignedUserTickets" DROP CONSTRAINT "FK_955b68edc3b6ac9bfafb417188e"`);
        await queryRunner.query(`ALTER TABLE "AssignedUserTickets" DROP CONSTRAINT "FK_5ff3dbb00891dece29c4a46d1f1"`);
        await queryRunner.query(`DROP TABLE "AssignedUserTickets"`);
    }

}
