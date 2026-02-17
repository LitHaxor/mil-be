import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserUnit } from '../../user-unit/entities/user-unit.entity';
import { SparePartTemplate } from '../../spare-part/entities/spare-part-template.entity';
import { User } from '../../entities/user.entity';
import { JobCart } from '../../entities/job-cart.entity';

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('consume_requests')
export class ConsumeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_unit_id: string;

  @ManyToOne(() => UserUnit, (unit) => unit.consume_requests)
  @JoinColumn({ name: 'user_unit_id' })
  user_unit: UserUnit;

  @Column({ nullable: true })
  job_cart_id: string;

  @ManyToOne(() => JobCart, { nullable: true })
  @JoinColumn({ name: 'job_cart_id' })
  job_cart: JobCart;

  @Column()
  spare_part_id: string;

  @ManyToOne(() => SparePartTemplate)
  @JoinColumn({ name: 'spare_part_id' })
  spare_part: SparePartTemplate;

  @Column('int')
  requested_quantity: number;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column()
  requested_by_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by_id' })
  requested_by: User;

  @Column({ nullable: true })
  approved_by_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approved_by: User;

  @Column({ nullable: true })
  rejection_reason: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
