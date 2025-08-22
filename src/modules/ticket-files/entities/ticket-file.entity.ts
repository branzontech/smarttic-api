import { AssignedTicketDetailFile } from 'src/modules/assigned-ticket-detail-file/entities/assigned-ticket-detail-file.entity';
import { AssignedTicketFile } from 'src/modules/assigned-ticket-file/entities/assigned-ticket-file.entity';
import { 
  Entity, PrimaryGeneratedColumn, Column, 
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn, 
  OneToMany
} from 'typeorm';

@Entity('ticketFile')
export class TicketFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  fileType: string;

  @Column()
  fileExtension: string;

  @Column('bigint')
  fileSize: number;

  @Column({ nullable: true })
  description: string;


  @OneToMany(() => AssignedTicketFile, (atf) => atf.file)
  assignedTickets: AssignedTicketFile[];

  @OneToMany(() => AssignedTicketDetailFile, (atdf) => atdf.file)
  assignedTicketDetails: AssignedTicketDetailFile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;  
}
