import { AssignedMenuRole } from 'src/modules/assigned-menu-role/entities/assigned-menu-role.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';

@Entity('Menus')
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column({ type: 'uuid', default: null, nullable: true })
  father: string | null;

  @Column({ default: null })
  nameView: string | null;

  @Column()
  classIcon: string;

  @Column()
  orderItem: number;

  @Column({ default: true })
  state: boolean;

  @ManyToOne(() => Menu, { nullable: true })
  @JoinColumn({ name: 'father' })
  parent?: Menu;

  @OneToMany(
    () => AssignedMenuRole,
    (assignedMenuRole) => assignedMenuRole.menu,
  )
  assignedMenuRoles: AssignedMenuRole[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
