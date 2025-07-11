import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerateTables1748029360104 implements MigrationInterface {
    name = 'GenerateTables1748029360104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "endpoint" character varying NOT NULL, "methods" text array NOT NULL, "roleId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_e83fa8a46bd5a3bfaa095d40812" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Menus" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "father" uuid, "nameView" character varying, "classIcon" character varying NOT NULL, "orderItem" integer NOT NULL, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_61cd8f3464d2c0406396a128fed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "AssignedMenuRoles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "menuId" uuid NOT NULL, "roleId" uuid NOT NULL, CONSTRAINT "PK_47265fa676eb16036fc6b0a11c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "isAgent" boolean NOT NULL DEFAULT false, "isAdmin" boolean NOT NULL DEFAULT false, "isConfigurator" boolean NOT NULL DEFAULT false, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_8eadedb8470c92966389ecc2165" UNIQUE ("name"), CONSTRAINT "PK_efba48c6a0c7a9b6260f771b165" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "IdentificationTypes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "description" character varying NOT NULL, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_c37d6413e6d3b50de41652cda74" UNIQUE ("code"), CONSTRAINT "UQ_a8a63e0b105a93b22b370fe7cb0" UNIQUE ("description"), CONSTRAINT "PK_c8ba17123ecce2479925da42740" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "AssignedUserBranches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "branchId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_adacb0005551fec174b7b61b442" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "AssignedUserTickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ticketId" uuid NOT NULL, "userId" uuid NOT NULL, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_bedf16e947711a18c8fbc024234" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "SurveyCalifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying NOT NULL, "score" integer NOT NULL DEFAULT '0', "imageName" character varying NOT NULL, "imageBase64" text, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_989db6a800db58a863d87893b7c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "SurveyResponses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "surveyCalificationId" uuid NOT NULL, "userId" uuid NOT NULL, "ticketId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_5d3681a0485b30adb63ca4026a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "TicketDetails" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" text, "ticketId" uuid, "userId" uuid, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_5bc9f5a4568b2727c795cbcfa95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Ticketstates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "orderTicket" integer, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_f96eab11a5044fd62051d1d3ba7" UNIQUE ("title"), CONSTRAINT "PK_42cc5177d71ce44e32ca2191fcf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "TicketCategories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying, "prefix" character varying NOT NULL, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_0b0809800465022e8694726dd31" UNIQUE ("prefix"), CONSTRAINT "PK_704006e34cc07cf70667d28b4ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "TicketPriorities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "hoursResponse" integer, "hoursResolution" integer, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_6e364976cdb91b7a28eb77ac6b4" UNIQUE ("title"), CONSTRAINT "PK_99117bc93976ace6257eace153d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "TicketTitles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying, "ticketPriorityId" uuid, "ticketCategoryId" uuid, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_495b5511c5643f2ed442a840524" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ticketNumber" SERIAL NOT NULL, "description" text, "ticketStateId" uuid, "ticketTitleId" uuid, "userId" uuid, "branchId" uuid, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_fdd22d4de0e8337cf0201ee6836" UNIQUE ("ticketNumber"), CONSTRAINT "PK_6533595a87a7d0e3b7ed082b2aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_1b63dcf532962b97c70b5da21dc" UNIQUE ("name"), CONSTRAINT "PK_239def2db2f16e60df4a159b05b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "lastname" character varying NOT NULL, "companyId" uuid, "companyname" character varying, "email" character varying NOT NULL, "address" character varying NOT NULL, "phone" bigint, "identificationTypeId" uuid, "numberIdentification" character varying, "username" character varying NOT NULL, "password" character varying NOT NULL, "roleId" uuid, "branchId" uuid, "isAgentDefault" boolean, "state" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_ffc81a3b97dcbf8e320d5106c0d" UNIQUE ("username"), CONSTRAINT "PK_16d4f7d636df336db11d87413e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Audits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "endpoint" character varying NOT NULL, "method" character varying NOT NULL, "status" character varying NOT NULL, "message" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_58286da856c1e319298b685bcc1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Permissions" ADD CONSTRAINT "FK_b113ea79f15a2bae2f904765c8e" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Menus" ADD CONSTRAINT "FK_1d44f0c419af5ae9fdbcd810958" FOREIGN KEY ("father") REFERENCES "Menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AssignedMenuRoles" ADD CONSTRAINT "FK_af2561938f8517b72988f0e6909" FOREIGN KEY ("menuId") REFERENCES "Menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AssignedMenuRoles" ADD CONSTRAINT "FK_c6bc0ad6e6b1ca697c88c654a44" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AssignedUserBranches" ADD CONSTRAINT "FK_8e31a7944225fc13afba9ab8679" FOREIGN KEY ("branchId") REFERENCES "Branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AssignedUserBranches" ADD CONSTRAINT "FK_17a04dba267c2f483b9d52fbbb5" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AssignedUserTickets" ADD CONSTRAINT "FK_5ff3dbb00891dece29c4a46d1f1" FOREIGN KEY ("ticketId") REFERENCES "Tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "AssignedUserTickets" ADD CONSTRAINT "FK_955b68edc3b6ac9bfafb417188e" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "SurveyResponses" ADD CONSTRAINT "FK_a4149f9cfd389a9574b5337041b" FOREIGN KEY ("surveyCalificationId") REFERENCES "SurveyCalifications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "SurveyResponses" ADD CONSTRAINT "FK_f79a67e8dbd2e73120b61bb83ab" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "SurveyResponses" ADD CONSTRAINT "FK_97c0927315e9ebadd402abcd00c" FOREIGN KEY ("ticketId") REFERENCES "Tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TicketDetails" ADD CONSTRAINT "FK_edae1cb18a4d3fa50cfabc91b5e" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TicketDetails" ADD CONSTRAINT "FK_ad54ae418987717e4a50fff63a1" FOREIGN KEY ("ticketId") REFERENCES "Tickets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TicketTitles" ADD CONSTRAINT "FK_222ced57de8225ad6c063c185d3" FOREIGN KEY ("ticketCategoryId") REFERENCES "TicketCategories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TicketTitles" ADD CONSTRAINT "FK_ce90c8a81b316935547c4ed5855" FOREIGN KEY ("ticketPriorityId") REFERENCES "TicketPriorities"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Tickets" ADD CONSTRAINT "FK_f2074c269d97f7a06dda867c964" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Tickets" ADD CONSTRAINT "FK_b66bba7ac2d3df999e331f291a7" FOREIGN KEY ("ticketTitleId") REFERENCES "TicketTitles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Tickets" ADD CONSTRAINT "FK_3cbe19891380fdff728e7a0f5e0" FOREIGN KEY ("ticketStateId") REFERENCES "Ticketstates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Tickets" ADD CONSTRAINT "FK_a8fc2d80c485817164b54937de2" FOREIGN KEY ("branchId") REFERENCES "Branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "FK_65c56db5a9988b90b0d7245e0f0" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "FK_acd585adaed19fa672db8ff319d" FOREIGN KEY ("companyId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "FK_4416de500bb36e2448b70f34c4b" FOREIGN KEY ("identificationTypeId") REFERENCES "IdentificationTypes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "FK_e4cf5d9f8964b073fa9b328bdba" FOREIGN KEY ("branchId") REFERENCES "Branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "FK_e4cf5d9f8964b073fa9b328bdba"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "FK_4416de500bb36e2448b70f34c4b"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "FK_acd585adaed19fa672db8ff319d"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "FK_65c56db5a9988b90b0d7245e0f0"`);
        await queryRunner.query(`ALTER TABLE "Tickets" DROP CONSTRAINT "FK_a8fc2d80c485817164b54937de2"`);
        await queryRunner.query(`ALTER TABLE "Tickets" DROP CONSTRAINT "FK_3cbe19891380fdff728e7a0f5e0"`);
        await queryRunner.query(`ALTER TABLE "Tickets" DROP CONSTRAINT "FK_b66bba7ac2d3df999e331f291a7"`);
        await queryRunner.query(`ALTER TABLE "Tickets" DROP CONSTRAINT "FK_f2074c269d97f7a06dda867c964"`);
        await queryRunner.query(`ALTER TABLE "TicketTitles" DROP CONSTRAINT "FK_ce90c8a81b316935547c4ed5855"`);
        await queryRunner.query(`ALTER TABLE "TicketTitles" DROP CONSTRAINT "FK_222ced57de8225ad6c063c185d3"`);
        await queryRunner.query(`ALTER TABLE "TicketDetails" DROP CONSTRAINT "FK_ad54ae418987717e4a50fff63a1"`);
        await queryRunner.query(`ALTER TABLE "TicketDetails" DROP CONSTRAINT "FK_edae1cb18a4d3fa50cfabc91b5e"`);
        await queryRunner.query(`ALTER TABLE "SurveyResponses" DROP CONSTRAINT "FK_97c0927315e9ebadd402abcd00c"`);
        await queryRunner.query(`ALTER TABLE "SurveyResponses" DROP CONSTRAINT "FK_f79a67e8dbd2e73120b61bb83ab"`);
        await queryRunner.query(`ALTER TABLE "SurveyResponses" DROP CONSTRAINT "FK_a4149f9cfd389a9574b5337041b"`);
        await queryRunner.query(`ALTER TABLE "AssignedUserTickets" DROP CONSTRAINT "FK_955b68edc3b6ac9bfafb417188e"`);
        await queryRunner.query(`ALTER TABLE "AssignedUserTickets" DROP CONSTRAINT "FK_5ff3dbb00891dece29c4a46d1f1"`);
        await queryRunner.query(`ALTER TABLE "AssignedUserBranches" DROP CONSTRAINT "FK_17a04dba267c2f483b9d52fbbb5"`);
        await queryRunner.query(`ALTER TABLE "AssignedUserBranches" DROP CONSTRAINT "FK_8e31a7944225fc13afba9ab8679"`);
        await queryRunner.query(`ALTER TABLE "AssignedMenuRoles" DROP CONSTRAINT "FK_c6bc0ad6e6b1ca697c88c654a44"`);
        await queryRunner.query(`ALTER TABLE "AssignedMenuRoles" DROP CONSTRAINT "FK_af2561938f8517b72988f0e6909"`);
        await queryRunner.query(`ALTER TABLE "Menus" DROP CONSTRAINT "FK_1d44f0c419af5ae9fdbcd810958"`);
        await queryRunner.query(`ALTER TABLE "Permissions" DROP CONSTRAINT "FK_b113ea79f15a2bae2f904765c8e"`);
        await queryRunner.query(`DROP TABLE "Audits"`);
        await queryRunner.query(`DROP TABLE "Users"`);
        await queryRunner.query(`DROP TABLE "Branches"`);
        await queryRunner.query(`DROP TABLE "Tickets"`);
        await queryRunner.query(`DROP TABLE "TicketTitles"`);
        await queryRunner.query(`DROP TABLE "TicketPriorities"`);
        await queryRunner.query(`DROP TABLE "TicketCategories"`);
        await queryRunner.query(`DROP TABLE "Ticketstates"`);
        await queryRunner.query(`DROP TABLE "TicketDetails"`);
        await queryRunner.query(`DROP TABLE "SurveyResponses"`);
        await queryRunner.query(`DROP TABLE "SurveyCalifications"`);
        await queryRunner.query(`DROP TABLE "AssignedUserTickets"`);
        await queryRunner.query(`DROP TABLE "AssignedUserBranches"`);
        await queryRunner.query(`DROP TABLE "IdentificationTypes"`);
        await queryRunner.query(`DROP TABLE "Roles"`);
        await queryRunner.query(`DROP TABLE "AssignedMenuRoles"`);
        await queryRunner.query(`DROP TABLE "Menus"`);
        await queryRunner.query(`DROP TABLE "Permissions"`);
    }

}
