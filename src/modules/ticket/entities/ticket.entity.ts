import { AssignedTicketFile } from 'src/modules/assigned-ticket-file/entities/assigned-ticket-file.entity';
import { AssignedUserTicket } from 'src/modules/assigned-user-ticket/entities/assigned-user-ticket.entity';
import { Branch } from 'src/modules/branch/entities/branch.entity';
import { FormResponse } from 'src/modules/form-responses/entities/form-response.entity';
import { NoteAgentTicket } from 'src/modules/note-agent-tickets/entities/note-agent-ticket.entity';
import { SurveyResponse } from 'src/modules/survey-response/entities/survey-response.entity';
import { TicketDetail } from 'src/modules/ticket-detail/entities/ticket-detail.entity';
import { TicketState } from 'src/modules/ticket-state/entities/ticket-state.entity';
import { TicketTitle } from 'src/modules/ticket-title/entities/ticket-title.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('Tickets')
export class Ticket {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'int',
    generated: 'increment',
    unique: true
  })
  ticketNumber: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  ticketStateId: string;

  @Column({ nullable: true })
  ticketTitleId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  branchId: string;

  @Column({ name: 'state', default: true })
  state: boolean;

  @ManyToOne(() => User, (user) => user.tickets, { nullable: true, onDelete: 'SET NULL' })
  user: User;

  @ManyToOne(() => TicketTitle, (ticketTitle) => ticketTitle.tickets, { nullable: true, onDelete: 'SET NULL' })
  ticketTitle: TicketTitle;

  @ManyToOne(() => TicketState, (ticketState) => ticketState.tickets, { nullable: true, onDelete: 'SET NULL' })
  ticketState: TicketState;

  @OneToMany(() => TicketDetail, (TicketDetail) => TicketDetail.ticket)
  ticketDetails: TicketDetail[];

  @OneToMany(() => SurveyResponse, (surveyResponse) => surveyResponse.ticket)
  surveyResponses: SurveyResponse[];

  @OneToMany(() => AssignedUserTicket, (assignedUserTicket) => assignedUserTicket.ticket)
  assignedUsers: AssignedUserTicket[];

  @OneToMany(() => NoteAgentTicket, (noteAgentTicket) => noteAgentTicket.ticket)
  notes: NoteAgentTicket[];

  @ManyToOne(() => Branch, (branch) => branch.tickets, { nullable: true, onDelete: 'SET NULL' })
  branch?: Branch;

  @OneToOne(() => FormResponse, (formResponse) => formResponse.ticket)
  @JoinColumn() 
  formResponse: FormResponse;

  @OneToMany(() => AssignedTicketFile, (assigned) => assigned.ticket)
  ticketFiles: AssignedTicketFile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
