import { AssignedUserTicket } from 'src/modules/assigned-user-ticket/entities/assigned-user-ticket.entity';
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

  @Column({ default: true })
  state: boolean;

  @ManyToOne(() => User, (user) => user.tickets, { nullable: true, onDelete: 'SET NULL' })
  user: User;

  @ManyToOne(() => TicketTitle, (ticketTitle) => ticketTitle.tickets, { nullable: true, onDelete: 'SET NULL' })
  ticketTitle: TicketTitle;

  @ManyToOne(() => TicketState, (ticketState) => ticketState.tickets, { nullable: true, onDelete: 'SET NULL' })
  ticketState: TicketState;

  @OneToMany(() => TicketDetail, (TicketDetail) => TicketDetail.ticket)
  ticketDetails: TicketDetail[];

  @OneToMany(() => SurveyResponse, (surveyResponse) => surveyResponse.surveyCalification)
  surveyResponses: SurveyResponse[];

  @OneToMany(() => AssignedUserTicket, (assignedUserTicket) => assignedUserTicket.ticket)
  assignedUsers: AssignedUserTicket[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
