import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserUnit } from './user-unit.entity';
import { User } from './user.entity';

export enum LogType {
  ENTRY = 'entry',
  EXIT = 'exit',
  MAINTENANCE = 'maintenance',
  INVENTORY_CONSUMED = 'inventory_consumed',
  COMMENT = 'comment',
}

@Entity('log_books')
export class LogBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_unit_id: string;

  @ManyToOne(() => UserUnit, (unit) => unit.log_books)
  @JoinColumn({ name: 'user_unit_id' })
  user_unit: UserUnit;

  @Column({
    type: 'enum',
    enum: LogType,
  })
  log_type: LogType;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  performed_by_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performed_by_id' })
  performed_by: User;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // For storing additional data like consumed items

  @CreateDateColumn()
  created_at: Date;
}
