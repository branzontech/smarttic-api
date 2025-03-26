import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { AssignedUserBranch } from 'src/modules/assigned-user-branch/entities/assigned-user-branch.entity';

@Entity('Branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  state: boolean;

  @OneToMany(() => User, (user) => user.branch)
  users: User[];

  @OneToMany(() => AssignedUserBranch, (assignedUserBranch) => assignedUserBranch.branch)
  assignedUsers: AssignedUserBranch[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}

