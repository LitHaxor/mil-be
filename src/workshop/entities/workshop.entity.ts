import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserUnit } from '../../user-unit/entities/user-unit.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';

@Entity('workshops')
export class Workshop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  division: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  created_by_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  owner: User;

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
