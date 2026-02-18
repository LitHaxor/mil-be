import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workshop } from './workshop.entity';
import { SparePartTemplate } from './spare-part-template.entity';
import { User } from './user.entity';

export enum SourceStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SOURCED = 'sourced',
}

@Entity('source_requests')
export class SourceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workshop_id: string;

  @ManyToOne(() => Workshop)
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column({ nullable: true })
  spare_part_id: string;

  @ManyToOne(() => SparePartTemplate, { nullable: true })
  @JoinColumn({ name: 'spare_part_id' })
  spare_part: SparePartTemplate;

  @Column('int')
  quantity: number;

  @Column({
    type: 'enum',
    enum: SourceStatus,
    default: SourceStatus.REQUESTED,
  })
  status: SourceStatus;

  @Column()
  requested_by_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by_id' })
  requested_by: User;

  @Column({ nullable: true })
  supplier_name: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  total_cost: number;

  @Column({ nullable: true })
  rejection_reason: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  sourced_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
