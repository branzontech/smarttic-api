import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableShortcuts1757434274513 implements MigrationInterface {
    name = 'CreateTableShortcuts1757434274513'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Shortcuts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "menuId" uuid, CONSTRAINT "PK_2c2bd23f2259e9e13d37b03b44a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Shortcuts" ADD CONSTRAINT "FK_182fe5fe8b4cb0b7bc4277f2120" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Shortcuts" ADD CONSTRAINT "FK_8b68da9174dff008831976a24e3" FOREIGN KEY ("menuId") REFERENCES "Menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Shortcuts" DROP CONSTRAINT "FK_8b68da9174dff008831976a24e3"`);
        await queryRunner.query(`ALTER TABLE "Shortcuts" DROP CONSTRAINT "FK_182fe5fe8b4cb0b7bc4277f2120"`);
        await queryRunner.query(`DROP TABLE "Shortcuts"`);
    }

}
