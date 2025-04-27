import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { AssignedMenuRole } from 'src/modules/assigned-menu-role/entities/assigned-menu-role.entity';

@Entity('Roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: false })
  isAgent: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isConfigurator: boolean;

  @Column({ default: true })
  state: boolean;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @OneToMany(() => Permission, (permission) => permission.role)
  permissions: Permission[];

  @OneToMany(() => AssignedMenuRole, assignedMenuRole => assignedMenuRole.menu)
  assignedMenuRoles: AssignedMenuRole[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

