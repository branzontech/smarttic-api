import { Form } from 'src/modules/forms/entities/form.entity';
import { TicketTitle } from 'src/modules/ticket-title/entities/ticket-title.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne } from 'typeorm';

@Entity('TicketCategories')
export class TicketCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  description: string;

  @Column({ unique: true })
  prefix: string;

  @Column({ name: 'state', default: true })
  state: boolean;

  @OneToMany(() => TicketTitle, (title) => title.ticketCategory)
  ticketTitles: TicketTitle[];  

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}



