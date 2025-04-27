import { TicketCategory } from 'src/modules/ticket-category/entities/ticket-category.entity';
import { TicketPriority } from 'src/modules/ticket-priority/entities/ticket-priority.entity';
import { Ticket } from 'src/modules/ticket/entities/ticket.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, DeleteDateColumn } from 'typeorm';

@Entity('TicketTitles')
export class TicketTitle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  ticketPriorityId: string;

  @Column({ nullable: true })
  ticketCategoryId: string;

  @Column({ default: true })
  state: boolean;

  @ManyToOne(() => TicketCategory, (ticketCategory) => ticketCategory.ticketTitles, { nullable: true, onDelete: 'SET NULL' })
  ticketCategory: TicketCategory;

  @ManyToOne(() => TicketPriority, (ticketPriority) => ticketPriority.ticketTitles, { nullable: true, onDelete: 'SET NULL' })
  ticketPriority: TicketPriority;

  @OneToMany(() => Ticket, (ticket) => ticket.ticketTitle)
  tickets: Ticket[];

  @CreateDateColumn() 
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}


