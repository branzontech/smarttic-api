import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnLimitTicketAgent1752784449214 implements MigrationInterface {
    name = 'AddColumnLimitTicketAgent1752784449214'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ADD "limite_ticket" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "limite_ticket"`);
    }

}
