import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnBranchIdInTicket1748016888866 implements MigrationInterface {
    name = 'AddColumnBranchIdInTicket1748016888866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Tickets" ADD "branchId" uuid`);
        await queryRunner.query(`ALTER TABLE "Tickets" ADD CONSTRAINT "FK_a8fc2d80c485817164b54937de2" FOREIGN KEY ("branchId") REFERENCES "Branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Tickets" DROP CONSTRAINT "FK_a8fc2d80c485817164b54937de2"`);
        await queryRunner.query(`ALTER TABLE "Tickets" DROP COLUMN "branchId"`);
    }

}
