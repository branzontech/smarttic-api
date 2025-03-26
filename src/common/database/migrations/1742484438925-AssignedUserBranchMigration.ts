import { MigrationInterface, QueryRunner } from "typeorm";

export class AssignedUserBranchMigration1742484438925 implements MigrationInterface {
    name = 'AssignedUserBranchMigration1742484438925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "AssignedUserBranches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "branchId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_adacb0005551fec174b7b61b442" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "idIdentificationType"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "idBranch"`);
        await queryRunner.query(`ALTER TABLE "AssignedUserBranches" ADD CONSTRAINT "FK_8e31a7944225fc13afba9ab8679" FOREIGN KEY ("branchId") REFERENCES "Branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AssignedUserBranches" ADD CONSTRAINT "FK_17a04dba267c2f483b9d52fbbb5" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "AssignedUserBranches" DROP CONSTRAINT "FK_17a04dba267c2f483b9d52fbbb5"`);
        await queryRunner.query(`ALTER TABLE "AssignedUserBranches" DROP CONSTRAINT "FK_8e31a7944225fc13afba9ab8679"`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "idBranch" character varying`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "idIdentificationType" character varying`);
        await queryRunner.query(`DROP TABLE "AssignedUserBranches"`);
    }

}
