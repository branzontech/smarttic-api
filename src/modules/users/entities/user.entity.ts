import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from 'src/modules/roles/entities/role.entity';
import { IdentificationType } from 'src/modules/identification-type/entities/identification-type.entity';
import { Branch } from 'src/modules/branch/entities/branch.entity'
import { AssignedUserBranch } from 'src/modules/assigned-user-branch/entities/assigned-user-branch.entity';

@Entity('Users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  lastname: string;

  @Column({ unique: true })
  email: string;

  @Column()
  address: string;

  @Column({nullable: true})
  phone: number;

  @Column({nullable: true})
  identificationTypeId: string;

  @Column({nullable: true})
  numberIdentification: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({nullable: true})
  roleId?: string;

  @Column({nullable: true})
  branchId?: string;

  @Column({ nullable: true })
  isAgentDefault: boolean;

  @Column({ default: true })
  state: boolean;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true, onDelete: 'SET NULL' })
  role?: Role;

  @ManyToOne(() => IdentificationType, (identificationType) => identificationType.users, { nullable: true, onDelete: 'SET NULL' })
  identificationType?: IdentificationType;

  @ManyToOne(() => Branch, (branch) => branch.users, { nullable: true, onDelete: 'SET NULL' })
  branch?: Branch;

  @OneToMany(() => AssignedUserBranch, (assignedUserBranch) => assignedUserBranch.user)
  assignedBranches: AssignedUserBranch[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}

