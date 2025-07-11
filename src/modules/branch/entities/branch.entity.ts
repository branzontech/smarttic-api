import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { AssignedUserBranch } from 'src/modules/assigned-user-branch/entities/assigned-user-branch.entity';
import { Ticket } from 'src/modules/ticket/entities/ticket.entity';

@Entity('Branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'state', default: true })
  state: boolean;

  @OneToMany(() => User, (user) => user.branch)
  users: User[];

  @OneToMany(() => AssignedUserBranch, (assignedUserBranch) => assignedUserBranch.branch)
  assignedUsers: AssignedUserBranch[];

  @OneToMany(() => Ticket, (ticket) => ticket.branch)
  tickets: Ticket[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

