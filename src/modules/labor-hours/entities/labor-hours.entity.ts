import { Branch } from 'src/modules/branch/entities/branch.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('labor_hours')
export class LaborHour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  day_of_week: number;

  @Column()
  start_time: string;

  @Column()
  end_time: string;

  @Column({ type: 'varchar', nullable: true })
  start_break: string | null;

  @Column({ type: 'varchar', nullable: true })
  end_break: string | null;

  @Column()
  is_active: boolean;

  @Column()
  status: string;

  @Column({ nullable: true })
  branch_id: string;

  @ManyToOne(() => Branch, (branch) => branch.id, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
