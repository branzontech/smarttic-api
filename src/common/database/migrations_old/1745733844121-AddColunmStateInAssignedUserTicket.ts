import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColunmStateInAssignedUserTicket1745733844121 implements MigrationInterface {
    name = 'AddColunmStateInAssignedUserTicket1745733844121'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "AssignedUserTickets" ADD "state" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "AssignedUserTickets" DROP COLUMN "state"`);
    }

}
