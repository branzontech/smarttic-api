import { SurveyCalification } from 'src/modules/survey-calification/entities/survey-calification.entity';
import { Ticket } from 'src/modules/ticket/entities/ticket.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('SurveyResponses')
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'surveyCalificationId' })
  surveyCalificationId: string;

  @Column({ name: 'userId' })
  userId: string;

  @Column({ name: 'ticketId' })
  ticketId: string;

  @ManyToOne(() => SurveyCalification, (surveyCalification) => surveyCalification.surveyResponses)
  @JoinColumn({ name: 'surveyCalificationId' })
  surveyCalification: SurveyCalification;

  @ManyToOne(() => User, (user) => user.surveyResponses)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Ticket, (ticket) => ticket.surveyResponses)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
