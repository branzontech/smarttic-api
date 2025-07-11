// src/modules/form-responses/entities/form-response.entity.ts
import { FormResponseFile } from 'src/modules/form-response-files/entities/form-response-file.entity';
import { Form } from 'src/modules/forms/entities/form.entity';
import { Ticket } from 'src/modules/ticket/entities/ticket.entity';
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index,
  OneToOne,
  OneToMany
} from 'typeorm';

@Entity('FormResponses')
@Index(['formId', 'ticketId'], { unique: true }) // Evita respuestas duplicadas
export class FormResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' }) // jsonb es más eficiente para consultas
  responses: Record<string, any>;


  @Column({ name: 'formId' })
  formId: string;

  @Column({ name: 'ticketId', unique: true })
  ticketId: string;

  @ManyToOne(() => Form, (form) => form.responses, { onDelete: 'CASCADE' })
  form: Form;

  @OneToOne(() => Ticket, (ticket) => ticket.formResponse)
  ticket: Ticket;

  @OneToMany(() => FormResponseFile, (file) => file.formResponse)
  files: FormResponseFile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}