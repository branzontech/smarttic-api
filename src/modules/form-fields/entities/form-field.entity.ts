
import { Form } from 'src/modules/forms/entities/form.entity';
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn
} from 'typeorm';

@Entity('FormFields')
export class FormField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'varchar', length: 255 })
  fieldKey: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'text', 'number', 'select', 'checkbox', 'date', etc.

  @Column({ type: 'json', nullable: true })
  options: any; 

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'json', nullable: true })
  validations: any; 

  @Column({ type: 'varchar', nullable: true })
  defaultValue: string;

  @ManyToOne(() => Form, (form) => form.fields, { onDelete: 'CASCADE' })
  form: Form;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
