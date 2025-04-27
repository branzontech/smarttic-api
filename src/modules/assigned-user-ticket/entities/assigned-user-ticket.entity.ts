import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    JoinColumn, 
    CreateDateColumn, 
    UpdateDateColumn,
    DeleteDateColumn 
  } from 'typeorm';
  import { Ticket } from '../../ticket/entities/ticket.entity';
  import { User } from '../../users/entities/user.entity';
  
  @Entity('AssignedUserTickets')
  export class AssignedUserTicket {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'ticketId' })
    ticketId: string;
  
    @Column({ name: 'userId' })
    userId: string;
  
    @ManyToOne(() => Ticket, (ticket) => ticket.assignedUsers)
    @JoinColumn({ name: 'ticketId' })
    ticket: Ticket;
  
    @ManyToOne(() => User, (user) => user.assignedTickets)
    @JoinColumn({ name: 'userId' })
    user: User;
  
    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;
  
    @DeleteDateColumn({ name: 'deletedAt' })
    deletedAt?: Date;
  }
