import { AssignedTicketDetailFile } from 'src/modules/assigned-ticket-detail-file/entities/assigned-ticket-detail-file.entity';
import { Ticket } from 'src/modules/ticket/entities/ticket.entity';
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

@Entity('TicketDetails')
export class TicketDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type:"text", nullable: true })
  description: string;

  @Column({ nullable: true })
  ticketId: string;
  
  @Column({ nullable: true })
  userId: string;

  @Column({ name: 'state', default: true })
  state: boolean;

  @ManyToOne(() => User, (user) => user.tickets, { nullable: true, onDelete: 'SET NULL' })
  user: User;

  @ManyToOne(() => Ticket, (ticket) => ticket.ticketDetails, { nullable: true, onDelete: 'SET NULL' })
  ticket: Ticket;

  @OneToMany(() => AssignedTicketDetailFile, (assigned) => assigned.ticketDetail)
  ticketDetailFiles: AssignedTicketDetailFile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

}
