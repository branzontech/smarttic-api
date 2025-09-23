import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTablesTicketFiles1755560416820 implements MigrationInterface {
    name = 'CreateTablesTicketFiles1755560416820'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "AssignedTicketDetailFile" ("ticketDetailId" uuid NOT NULL, "fileId" uuid NOT NULL, CONSTRAINT "PK_8f8472105348a64c521885cd65e" PRIMARY KEY ("ticketDetailId", "fileId"))`);
        await queryRunner.query(`CREATE TABLE "ticketFile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileName" character varying NOT NULL, "fileType" character varying NOT NULL, "fileExtension" character varying NOT NULL, "fileSize" bigint NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_3959adfeac48eeafe848462983d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "AssignedTicketFile" ("ticketId" uuid NOT NULL, "fileId" uuid NOT NULL, CONSTRAINT "PK_38f42400f6b6e94a3ad4390c336" PRIMARY KEY ("ticketId", "fileId"))`);
        await queryRunner.query(`ALTER TABLE "AssignedTicketDetailFile" ADD CONSTRAINT "FK_558438fab0c8843a90a5e158608" FOREIGN KEY ("ticketDetailId") REFERENCES "TicketDetails"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AssignedTicketDetailFile" ADD CONSTRAINT "FK_7fcc31cc4867db9118a36feb530" FOREIGN KEY ("fileId") REFERENCES "ticketFile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AssignedTicketFile" ADD CONSTRAINT "FK_d4b1fb9cd76aea5699bcc33787a" FOREIGN KEY ("ticketId") REFERENCES "Tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AssignedTicketFile" ADD CONSTRAINT "FK_704cad736926725f5d1e7ac336e" FOREIGN KEY ("fileId") REFERENCES "ticketFile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "AssignedTicketFile" DROP CONSTRAINT "FK_704cad736926725f5d1e7ac336e"`);
        await queryRunner.query(`ALTER TABLE "AssignedTicketFile" DROP CONSTRAINT "FK_d4b1fb9cd76aea5699bcc33787a"`);
        await queryRunner.query(`ALTER TABLE "AssignedTicketDetailFile" DROP CONSTRAINT "FK_7fcc31cc4867db9118a36feb530"`);
        await queryRunner.query(`ALTER TABLE "AssignedTicketDetailFile" DROP CONSTRAINT "FK_558438fab0c8843a90a5e158608"`);
        await queryRunner.query(`DROP TABLE "AssignedTicketFile"`);
        await queryRunner.query(`DROP TABLE "ticketFile"`);
        await queryRunner.query(`DROP TABLE "AssignedTicketDetailFile"`);
    }

}
