import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerateTableGeneralParameter1749311740583 implements MigrationInterface {
    name = 'GenerateTableGeneralParameter1749311740583'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."GeneralParameter_type_enum" AS ENUM('string', 'integer', 'float', 'boolean', 'json')`);
        await queryRunner.query(`CREATE TABLE "GeneralParameter" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" text NOT NULL, "description" character varying NOT NULL, "type" "public"."GeneralParameter_type_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_4d5488d4175686f921ddca83a1c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "GeneralParameter"`);
        await queryRunner.query(`DROP TYPE "public"."GeneralParameter_type_enum"`);
    }

}
