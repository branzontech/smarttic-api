import { TicketTitle } from 'src/modules/ticket-title/entities/ticket-title.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('TicketCategories')
export class TicketCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  description: string;

  @Column({ unique: true })
  prefix: string;

  @Column({ default: true })
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



