import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { UserUnit } from './user-unit.entity';
import { Inventory } from './inventory.entity';

@Entity('workshops')
export class Workshop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  division: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => User, (user) => user.workshop)
  users: User[];

  @OneToMany(() => UserUnit, (unit) => unit.workshop)
  user_units: UserUnit[];

  @OneToMany(() => Inventory, (inventory) => inventory.workshop)
  inventory_items: Inventory[];

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
