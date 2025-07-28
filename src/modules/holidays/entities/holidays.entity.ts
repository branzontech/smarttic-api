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

@Entity('holidays')
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: string;

  @Column()
  name: string;

  @Column({ type: 'uuid', nullable: true })
  branch_id: string | null;

  @ManyToOne(() => Branch, (branch) => branch.id, {
    nullable: true, 
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
