import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeColunmDescriptionTicketDetail1745521400131 implements MigrationInterface {
    name = 'ChangeColunmDescriptionTicketDetail1745521400131'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TicketDetails" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "TicketDetails" ADD "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TicketDetails" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "TicketDetails" ADD "description" character varying`);
    }

}
