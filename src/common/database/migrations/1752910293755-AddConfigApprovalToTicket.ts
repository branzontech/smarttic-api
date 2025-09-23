import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConfigApprovalToTicket1752910293755 implements MigrationInterface {
    name = 'AddConfigApprovalToTicket1752910293755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TicketCategories" ADD "preapproval" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "Ticketstates" ADD "isInitialPreapproval" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "Ticketstates" ADD "isRejectedPreapproval" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "isDesignatedApprover" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "isDesignatedApprover"`);
        await queryRunner.query(`ALTER TABLE "Ticketstates" DROP COLUMN "isRejectedPreapproval"`);
        await queryRunner.query(`ALTER TABLE "Ticketstates" DROP COLUMN "isInitialPreapproval"`);
        await queryRunner.query(`ALTER TABLE "TicketCategories" DROP COLUMN "preapproval"`);
    }

}
