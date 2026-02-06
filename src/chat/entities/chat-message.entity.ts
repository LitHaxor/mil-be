import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserUnit } from '../../user-unit/entities/user-unit.entity';
import { User } from '../../entities/user.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_unit_id: string;

  @ManyToOne(() => UserUnit)
  @JoinColumn({ name: 'user_unit_id' })
  user_unit: UserUnit;

  @Column()
  sender_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column('text')
  message: string;

  @Column({ default: false })
  is_read: boolean;

  @Column('uuid', { array: true, default: [] })
  seen_by: string[];

  @CreateDateColumn()
  created_at: Date;
}
