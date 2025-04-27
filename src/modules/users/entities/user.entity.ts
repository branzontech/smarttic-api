import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn } from 'typeorm';
import { Role } from 'src/modules/roles/entities/role.entity';
import { IdentificationType } from 'src/modules/identification-type/entities/identification-type.entity';
import { Branch } from 'src/modules/branch/entities/branch.entity'
import { AssignedUserBranch } from 'src/modules/assigned-user-branch/entities/assigned-user-branch.entity';
import { Ticket } from 'src/modules/ticket/entities/ticket.entity';
import { SurveyResponse } from 'src/modules/survey-response/entities/survey-response.entity';
import { AssignedUserTicket } from 'src/modules/assigned-user-ticket/entities/assigned-user-ticket.entity';

@Entity('Users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  lastname: string;

  @Column({nullable: true})
  companyId: string;

  @Column({nullable: true})
  companyname: string;

  @Column({ unique: true })
  email: string;

  @Column()
  address: string;

  @Column({ type: 'bigint', nullable: true})
  phone: number;

  @Column({nullable: true})
  identificationTypeId: string;

  @Column({nullable: true})
  numberIdentification: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({nullable: true})
  roleId?: string;

  @Column({nullable: true})
  branchId?: string;

  @Column({ nullable: true })
  isAgentDefault: boolean;

  @Column({ default: true })
  state: boolean;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true, onDelete: 'SET NULL' })
  role?: Role;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company?: User;

  @ManyToOne(() => IdentificationType, (identificationType) => identificationType.users, { nullable: true, onDelete: 'SET NULL' })
  identificationType?: IdentificationType;

  @ManyToOne(() => Branch, (branch) => branch.users, { nullable: true, onDelete: 'SET NULL' })
  branch?: Branch;

  @OneToMany(() => AssignedUserBranch, (assignedUserBranch) => assignedUserBranch.user)
  assignedBranches: AssignedUserBranch[];

  @OneToMany(() => AssignedUserTicket, (assignedUserTicket) => assignedUserTicket.user)
  assignedTickets: AssignedUserTicket[];

  @OneToMany(() => Ticket, (ticket) => ticket.user)
  tickets: Ticket[];

  @OneToMany(() => SurveyResponse, (surveyResponse) => surveyResponse.user)
  surveyResponses: SurveyResponse[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

