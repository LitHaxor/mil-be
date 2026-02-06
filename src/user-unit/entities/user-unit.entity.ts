import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Workshop } from '../../workshop/entities/workshop.entity';
import { LogBook } from '../../log-book/entities/log-book.entity';
import { ConsumeRequest } from '../../consume-request/entities/consume-request.entity';

export enum UnitType {
  WEAPON = 'weapon',
  VEHICLE = 'vehicle',
  OTHER = 'other',
}

export enum UnitStatus {
  IN_WORKSHOP = 'in_workshop',
  UNDER_MAINTENANCE = 'under_maintenance',
  COMPLETED = 'completed',
  EXITED = 'exited',
}

@Entity('user_units')
export class UserUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  unit_number: string;

  @Column({
    type: 'enum',
    enum: UnitType,
  })
  unit_type: UnitType;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column('jsonb', { nullable: true })
  specifications: Record<string, any>;

  @Column({
    type: 'enum',
    enum: UnitStatus,
    default: UnitStatus.IN_WORKSHOP,
  })
  status: UnitStatus;

  @Column({ nullable: true })
  workshop_id: string;

  @ManyToOne(() => Workshop, (workshop) => workshop.user_units)
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @OneToMany(() => LogBook, (log) => log.user_unit)
  log_books: LogBook[];

  @OneToMany(() => ConsumeRequest, (request) => request.user_unit)
  consume_requests: ConsumeRequest[];

  @Column({ type: 'timestamp', nullable: true })
  entered_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  exited_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_maintenance_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
