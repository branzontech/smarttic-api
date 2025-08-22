import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1753892863852 implements MigrationInterface {
    name = 'UpdateDB1753892863852'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "holidays" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" character varying NOT NULL, "name" character varying NOT NULL, "branch_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3646bdd4c3817d954d830881dfe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "labor_hours" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "day_of_week" integer NOT NULL, "start_time" character varying NOT NULL, "end_time" character varying NOT NULL, "start_break" character varying, "end_break" character varying, "is_active" boolean NOT NULL, "status" character varying NOT NULL, "branch_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a6767d5d488f20847f6ffe5eb38" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "holidays" ADD CONSTRAINT "FK_c90bd385193eb39f844aaad363e" FOREIGN KEY ("branch_id") REFERENCES "Branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "labor_hours" ADD CONSTRAINT "FK_50b5b32fa84c8e507ac01727742" FOREIGN KEY ("branch_id") REFERENCES "Branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "labor_hours" DROP CONSTRAINT "FK_50b5b32fa84c8e507ac01727742"`);
        await queryRunner.query(`ALTER TABLE "holidays" DROP CONSTRAINT "FK_c90bd385193eb39f844aaad363e"`);
        await queryRunner.query(`DROP TABLE "labor_hours"`);
        await queryRunner.query(`DROP TABLE "holidays"`);
    }

}
