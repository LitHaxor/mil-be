import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workshop } from '../workshop/entities/workshop.entity';

export enum UserRole {
  ADMIN = 'admin',
  OC = 'oc',
  INSPECTOR = 'inspector',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.INSPECTOR,
  })
  role: UserRole;

  @Column({ nullable: true })
  workshop_id: string;

  @ManyToOne(() => Workshop, { nullable: true })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
