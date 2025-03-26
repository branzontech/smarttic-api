import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('Audits')
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  endpoint: string;

  @Column()
  method: string;

  @Column()
  status: string;

  @Column()
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}
