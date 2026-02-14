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
  CAPTAIN = 'captain',
  INSPECTOR_RI_AND_I = 'inspector_ri&i',
  STORE_MAN = 'store_man',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  full_name?: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.INSPECTOR_RI_AND_I,
  })
  role!: UserRole;

  @Column({ nullable: true })
  workshop_id?: string;

  @ManyToOne(() => Workshop, { nullable: true })
  @JoinColumn({ name: 'workshop_id' })
  workshop?: Workshop;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
