import { TicketFile } from "src/modules/ticket-files/entities/ticket-file.entity";
import { Ticket } from "src/modules/ticket/entities/ticket.entity";
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

@Entity('AssignedTicketFile')
export class AssignedTicketFile {

  @PrimaryColumn('uuid')
  ticketId: string;

  @PrimaryColumn('uuid')
  fileId: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.ticketFiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @ManyToOne(() => TicketFile, (file) => file.assignedTickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: TicketFile;
}
