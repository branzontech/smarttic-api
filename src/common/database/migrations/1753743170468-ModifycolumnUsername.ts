import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifycolumnUsername1753743170468 implements MigrationInterface {
    name = 'ModifycolumnUsername1753743170468'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "username" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "username" SET NOT NULL`);
    }

}
