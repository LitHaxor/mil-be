import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserUnit } from '../../user-unit/entities/user-unit.entity';
import { User } from '../../entities/user.entity';

export enum LogType {
  ENTRY = 'entry',
  EXIT = 'exit',
  MAINTENANCE = 'maintenance',
  INVENTORY_CONSUMED = 'inventory_consumed',
  COMMENT = 'comment',
  ENTRY_CREATED = 'entry_created',
  ENTRY_UPDATED = 'entry_updated',
  EXIT_CREATED = 'exit_created',
  JOB_CARD_CREATED = 'job_card_created',
  JOB_CARD_APPROVED = 'job_card_approved',
  JOB_CARD_REJECTED = 'job_card_rejected',
  JOB_CARD_VETOED = 'job_card_vetoed',
  JOB_CARD_ISSUED = 'job_card_issued',
  INVENTORY_DEDUCTED = 'inventory_deducted',
  INVENTORY_RESTORED = 'inventory_restored',
  WORKSHOP_ASSIGNED_INSPECTOR = 'workshop_assigned_inspector',
  WORKSHOP_ASSIGNED_STORE_MAN = 'workshop_assigned_store_man',
  WORKSHOP_ASSIGNED_CAPTAIN = 'workshop_assigned_captain',
  WORKSHOP_ASSIGNED_OC = 'workshop_assigned_oc',
}

@Entity('log_books')
export class LogBook {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  user_unit_id?: string;

  @ManyToOne(() => UserUnit, (unit) => unit.log_books, { nullable: true })
  @JoinColumn({ name: 'user_unit_id' })
  user_unit?: UserUnit;

  @Column({
    type: 'enum',
    enum: LogType,
  })
  log_type!: LogType;

  @Column('text')
  description!: string;

  @Column({ nullable: true })
  performed_by_id?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performed_by_id' })
  performed_by?: User;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>; // For storing additional data like consumed items

  @CreateDateColumn()
  created_at!: Date;
}
