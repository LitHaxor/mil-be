import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EquipmentType {
  WEAPON = 'weapon',
  VEHICLE = 'vehicle',
  OTHER = 'other',
}

@Entity('spare_part_templates')
export class SparePartTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  part_number: string;

  @Column({
    type: 'enum',
    enum: EquipmentType,
  })
  equipment_type: EquipmentType;

  @Column({ nullable: true })
  compatible_models: string; // JSON string of compatible models

  @Column('jsonb', { nullable: true })
  specifications: Record<string, any>;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  unit_price: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
