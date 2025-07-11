// src/modules/form-response-files/entities/form-response-file.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { FormResponse } from 'src/modules/form-responses/entities/form-response.entity';

@Entity('FormResponseFiles')
export class FormResponseFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string; 

  @Column()
  originalName: string; 

  @Column()
  fieldKey: string; 

  @Column()
  formResponseId: string;

  @ManyToOne(() => FormResponse, (formResponse) => formResponse.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formResponseId' })
  formResponse: FormResponse;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

