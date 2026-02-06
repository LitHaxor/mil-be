import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workshop } from '../../workshop/entities/workshop.entity';
import { SparePartTemplate } from '../../spare-part/entities/spare-part-template.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workshop_id: string;

  @ManyToOne(() => Workshop, (workshop) => workshop.inventory_items)
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column()
  spare_part_id: string;

  @ManyToOne(() => SparePartTemplate)
  @JoinColumn({ name: 'spare_part_id' })
  spare_part: SparePartTemplate;

  @Column('int', { default: 0 })
  quantity: number;

  @Column('int', { default: 0 })
  min_quantity: number;

  @Column({ nullable: true })
  location: string; // Location within workshop

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
