import { TicketTitle } from 'src/modules/ticket-title/entities/ticket-title.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('TicketPriorities')
export class TicketPriority {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  hoursResponse: number;

  @Column({ nullable: true })
  hoursResolution: number;

  @Column({ default: true })
  state: boolean;

  @OneToMany(() => TicketTitle, (title) => title.ticketPriority)
  ticketTitles: TicketTitle[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}




