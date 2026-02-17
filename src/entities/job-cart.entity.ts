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
import { Entry } from './entry.entity';
import { UserUnit } from '../user-unit/entities/user-unit.entity';
import { Workshop } from '../workshop/entities/workshop.entity';
import { SparePartTemplate } from '../spare-part/entities/spare-part-template.entity';
import { User } from './user.entity';
import { ConsumeRequest } from '../consume-request/entities/consume-request.entity';

export enum JobCartStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ISSUED = 'issued',
  REJECTED = 'rejected',
  OC_VETOED = 'oc_vetoed',
  COMPLETED = 'completed',
}

@Entity('job_carts')
export class JobCart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entry_id: string;

  @ManyToOne(() => Entry, { nullable: false })
  @JoinColumn({ name: 'entry_id' })
  entry: Entry;

  @Column()
  user_unit_id: string;

  @ManyToOne(() => UserUnit, { nullable: false })
  @JoinColumn({ name: 'user_unit_id' })
  user_unit: UserUnit;

  @Column()
  workshop_id: string;

  @ManyToOne(() => Workshop, { nullable: false })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column({ nullable: true })
  spare_part_id: string;

  @ManyToOne(() => SparePartTemplate, { nullable: true })
  @JoinColumn({ name: 'spare_part_id' })
  spare_part: SparePartTemplate;

  @Column()
  inspector_id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  @Column('int')
  requested_quantity: number;

  @Column({
    type: 'enum',
    enum: JobCartStatus,
    default: JobCartStatus.PENDING,
  })
  status: JobCartStatus;

  // Approval tracking
  @Column({ nullable: true })
  approved_by_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approved_by: User;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date;

  // Rejection tracking
  @Column({ nullable: true })
  rejected_by_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'rejected_by_id' })
  rejected_by: User;

  @Column({ type: 'timestamp', nullable: true })
  rejected_at: Date;

  @Column('text', { nullable: true })
  rejection_reason: string;

  // Issue tracking
  @Column({ nullable: true })
  issued_by_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'issued_by_id' })
  issued_by: User;

  @Column({ type: 'timestamp', nullable: true })
  issued_at: Date;

  // Consume requests
  @OneToMany(() => ConsumeRequest, (consumeRequest) => consumeRequest.job_cart)
  consume_requests: ConsumeRequest[];

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
