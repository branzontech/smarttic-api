import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('GeneralParameter')
export class GeneralParameter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ['string', 'integer', 'float', 'boolean', 'json'],
  })
  type: 'string' | 'integer' | 'float' | 'boolean' | 'json';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
