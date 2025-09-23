import { Entity, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { TicketDetail } from 'src/modules/ticket-detail/entities/ticket-detail.entity';
import { TicketFile } from 'src/modules/ticket-files/entities/ticket-file.entity';

@Entity('AssignedTicketDetailFile')
export class AssignedTicketDetailFile {
  @PrimaryColumn('uuid')
  ticketDetailId: string;

  @PrimaryColumn('uuid')
  fileId: string;

  @ManyToOne(() => TicketDetail, (td) => td.ticketDetailFiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketDetailId' })
  ticketDetail: TicketDetail;

  @ManyToOne(() => TicketFile, (file) => file.assignedTicketDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: TicketFile;
}
