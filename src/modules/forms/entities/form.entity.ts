// src/modules/form/entities/form.entity.ts
import { FormField } from 'src/modules/form-fields/entities/form-field.entity';
import { FormResponse } from 'src/modules/form-responses/entities/form-response.entity';
import { TicketTitle } from 'src/modules/ticket-title/entities/ticket-title.entity';

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn, 
  DeleteDateColumn,
  Relation
} from 'typeorm';

@Entity('Forms')
export class Form {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_template', default: true })
  isTemplate: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'version', default: 1 })
  version: number;

  @OneToMany(() => FormField, (formField) => formField.form, { 
    cascade: true,
    eager: true 
  })
  fields: FormField[];

  @OneToMany(() => TicketTitle, (category) => category.form)
  titles: Relation<TicketTitle[]>;

  @OneToMany(() => FormResponse, (response) => response.form)
  responses: Relation<FormResponse[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
