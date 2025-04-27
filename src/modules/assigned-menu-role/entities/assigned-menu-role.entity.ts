import { Menu } from 'src/modules/menu/entities/menu.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('AssignedMenuRoles')
export class AssignedMenuRole {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  menuId: string;

  @Column()
  roleId: string;

  @ManyToOne(() => Menu, menu => menu.assignedMenuRoles)
  menu: Menu;

  @ManyToOne(() => Role, role => role.assignedMenuRoles)
  role: Role;

}
