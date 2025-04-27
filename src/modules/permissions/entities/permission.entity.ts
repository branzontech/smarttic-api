import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Role } from 'src/modules/roles/entities/role.entity';

@Entity('Permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  endpoint: string;

  @Column("text", { array: true }) // Se usa "text" para manejar arrays en PostgreSQL
  methods: string[];

  @Column({ nullable: true })
  roleId?: string;

  @ManyToOne(() => Role, (role) => role.permissions, { nullable: true, onDelete: 'SET NULL' })
  role?: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

