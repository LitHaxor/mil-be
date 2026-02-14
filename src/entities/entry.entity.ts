import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Workshop } from '../workshop/entities/workshop.entity';
import { UserUnit } from '../user-unit/entities/user-unit.entity';
import { User } from './user.entity';
import { Exit } from './exit.entity';

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workshop_id: string;

  @ManyToOne(() => Workshop, { nullable: false })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column()
  user_unit_id: string;

  @ManyToOne(() => UserUnit, { nullable: false })
  @JoinColumn({ name: 'user_unit_id' })
  user_unit: UserUnit;

  @Column()
  inspector_id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  // Metadata fields
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  odometer_km: number;

  @Column('text', { nullable: true })
  condition_notes: string;

  @Column('text', { nullable: true })
  reported_issues: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  entered_at: Date;

  // Relationships
  @OneToOne(() => Exit, (exit) => exit.entry, { nullable: true })
  exit: Exit;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
