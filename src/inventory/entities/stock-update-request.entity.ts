import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Inventory } from './inventory.entity';
import { SparePartTemplate } from '../../spare-part/entities/spare-part-template.entity';
import { Workshop } from '../../workshop/entities/workshop.entity';
import { User } from '../../entities/user.entity';

export enum StockUpdateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('stock_update_requests')
export class StockUpdateRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inventory_id: string;

  @ManyToOne(() => Inventory, { nullable: false })
  @JoinColumn({ name: 'inventory_id' })
  inventory: Inventory;

  @Column()
  spare_part_id: string;

  @ManyToOne(() => SparePartTemplate, { nullable: false })
  @JoinColumn({ name: 'spare_part_id' })
  spare_part: SparePartTemplate;

  @Column()
  workshop_id: string;

  @ManyToOne(() => Workshop, { nullable: false })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column('int')
  quantity_to_add: number;

  @Column({ nullable: true })
  reason: string;

  @Column({
    type: 'enum',
    enum: StockUpdateStatus,
    default: StockUpdateStatus.PENDING,
  })
  status: StockUpdateStatus;

  @Column()
  requested_by_id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'requested_by_id' })
  requested_by: User;

  @Column({ nullable: true })
  approved_by_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approved_by: User;

  @Column({ nullable: true })
  rejection_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
