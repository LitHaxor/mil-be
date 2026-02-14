import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Entry } from './entry.entity';
import { User } from './user.entity';

@Entity('exits')
export class Exit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entry_id: string;

  @OneToOne(() => Entry, { nullable: false })
  @JoinColumn({ name: 'entry_id' })
  entry: Entry;

  @Column()
  inspector_id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  // Metadata fields
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  odometer_km: number;

  @Column('text', { nullable: true })
  work_performed: string;

  @Column('text', { nullable: true })
  exit_condition_notes: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  exited_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
