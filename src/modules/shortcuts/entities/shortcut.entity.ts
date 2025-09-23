import { Menu } from 'src/modules/menu/entities/menu.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('Shortcuts') 
export class Shortcut {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  menuId: string;
  
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.shortcuts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Menu, (menu) => menu.shortcuts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuId' })
  menu: Menu;

  @CreateDateColumn()
  createdAt: Date;
}
