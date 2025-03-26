import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial2AuthMigration1742339250840 implements MigrationInterface {
    name = 'Initial2AuthMigration1742339250840'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "endpoint" character varying NOT NULL, "methods" text array NOT NULL, "roleId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_e83fa8a46bd5a3bfaa095d40812" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "isAgent" boolean NOT NULL DEFAULT false, "isAdmin" boolean NOT NULL DEFAULT false, "isConfigurator" boolean NOT NULL DEFAULT false, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_8eadedb8470c92966389ecc2165" UNIQUE ("name"), CONSTRAINT "PK_efba48c6a0c7a9b6260f771b165" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "IdentificationTypes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "description" character varying NOT NULL, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_c37d6413e6d3b50de41652cda74" UNIQUE ("code"), CONSTRAINT "UQ_a8a63e0b105a93b22b370fe7cb0" UNIQUE ("description"), CONSTRAINT "PK_c8ba17123ecce2479925da42740" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_1b63dcf532962b97c70b5da21dc" UNIQUE ("name"), CONSTRAINT "PK_239def2db2f16e60df4a159b05b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "lastname" character varying NOT NULL, "email" character varying NOT NULL, "address" character varying NOT NULL, "phone" integer, "idIdentificationType" character varying, "numberIdentification" integer, "username" character varying NOT NULL, "password" character varying NOT NULL, "roleId" uuid, "idBranch" character varying, "isAgentDefault" boolean, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "identificationTypeId" uuid, "branchId" uuid, CONSTRAINT "UQ_3c3ab3f49a87e6ddb607f3c4945" UNIQUE ("email"), CONSTRAINT "UQ_ffc81a3b97dcbf8e320d5106c0d" UNIQUE ("username"), CONSTRAINT "PK_16d4f7d636df336db11d87413e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Audits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "endpoint" character varying NOT NULL, "method" character varying NOT NULL, "status" character varying NOT NULL, "message" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_58286da856c1e319298b685bcc1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Permissions" ADD CONSTRAINT "FK_b113ea79f15a2bae2f904765c8e" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "FK_65c56db5a9988b90b0d7245e0f0" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "FK_4416de500bb36e2448b70f34c4b" FOREIGN KEY ("identificationTypeId") REFERENCES "IdentificationTypes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "FK_e4cf5d9f8964b073fa9b328bdba" FOREIGN KEY ("branchId") REFERENCES "Branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "FK_e4cf5d9f8964b073fa9b328bdba"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "FK_4416de500bb36e2448b70f34c4b"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "FK_65c56db5a9988b90b0d7245e0f0"`);
        await queryRunner.query(`ALTER TABLE "Permissions" DROP CONSTRAINT "FK_b113ea79f15a2bae2f904765c8e"`);
        await queryRunner.query(`DROP TABLE "Audits"`);
        await queryRunner.query(`DROP TABLE "Users"`);
        await queryRunner.query(`DROP TABLE "Branches"`);
        await queryRunner.query(`DROP TABLE "IdentificationTypes"`);
        await queryRunner.query(`DROP TABLE "Roles"`);
        await queryRunner.query(`DROP TABLE "Permissions"`);
    }

}
