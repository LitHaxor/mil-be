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
  // Existing
  ENTRY = 'entry',
  EXIT = 'exit',
  MAINTENANCE = 'maintenance',
  INVENTORY_CONSUMED = 'inventory_consumed',
  COMMENT = 'comment',

  // NEW: Entry/Exit logs
  ENTRY_CREATED = 'entry_created',
  ENTRY_UPDATED = 'entry_updated',
  EXIT_CREATED = 'exit_created',
  EXIT_UPDATED = 'exit_updated',

  // NEW: Job card logs
  JOB_CARD_CREATED = 'job_card_created',
  JOB_CARD_APPROVED = 'job_card_approved',
  JOB_CARD_REJECTED = 'job_card_rejected',
  JOB_CARD_VETOED = 'job_card_vetoed',
  JOB_CARD_ISSUED = 'job_card_issued',

  // NEW: Inventory logs
  INVENTORY_DEDUCTED = 'inventory_deducted',
  INVENTORY_RESTORED = 'inventory_restored',

  // NEW: Unit logs
  UNIT_CREATED = 'unit_created',
  UNIT_UPDATED = 'unit_updated',
  UNIT_DELETED = 'unit_deleted',

  // NEW: Workshop assignment logs
  WORKSHOP_ASSIGNED_INSPECTOR = 'workshop_assigned_inspector',
  WORKSHOP_ASSIGNED_STORE_MAN = 'workshop_assigned_store_man',
  WORKSHOP_ASSIGNED_CAPTAIN = 'workshop_assigned_captain',
  WORKSHOP_ASSIGNED_OC = 'workshop_assigned_oc',
}

@Entity('log_books')
export class LogBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: LogType,
  })
  log_type: LogType;

  @Column('text')
  description: string;

  // Actor (who performed the action)
  @Column({ nullable: true })
  actor_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  // Denormalized references for fast querying
  @Column({ nullable: true })
  workshop_id: string;

  @Column({ nullable: true })
  user_unit_id: string;

  @ManyToOne(() => UserUnit, (unit) => unit.log_books, { nullable: true })
  @JoinColumn({ name: 'user_unit_id' })
  user_unit: UserUnit;

  @Column({ nullable: true })
  entry_id: string;

  @Column({ nullable: true })
  job_card_id: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
