import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';

@Entity('NoteAgentTickets')
export class NoteAgentTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'description', type: 'text'  })
  description: string;

  @Column({ name: 'ticketId', nullable: true })
  ticketId: string;

  @Column({ name: 'userId' })
  userId: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.notes, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @ManyToOne(() => User, (user) => user.agentNotes , { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  agent: User;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
