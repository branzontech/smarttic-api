import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from 'src/modules/branch/entities/branch.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('AssignedUserBranches')
export class AssignedUserBranch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branchId' })
  branchId: string;

  @Column({ name: 'userId' })
  userId: string;

  @ManyToOne(() => Branch, (branch) => branch.assignedUsers)
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @ManyToOne(() => User, (user) => user.assignedBranches)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'deletedAt' })
  deletedAt?: Date;
}