import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import { Workshop } from '../../workshop/entities/workshop.entity';
import { LogBook } from '../../log-book/entities/log-book.entity';
import { ConsumeRequest } from '../../consume-request/entities/consume-request.entity';

export enum UnitType {
  WEAPON = 'weapon',
  VEHICLE = 'vehicle',
  OTHER = 'other',
}

export enum UnitStatus {
  IN_WORKSHOP = 'in_workshop',
  UNDER_MAINTENANCE = 'under_maintenance',
  COMPLETED = 'completed',
  EXITED = 'exited',
  AVAILABLE = 'available',
}

@Entity('user_units')
export class UserUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', generated: 'increment', nullable: true })
  ser: number;

  @Column({ type: 'integer', unique: true, nullable: true })
  ba_regt_no: number;

  @Column({ type: 'text', nullable: true })
  full_name_with_model: string;

  @Column({ type: 'text', nullable: true })
  country_of_origin: string;

  @Column({ type: 'timestamp', nullable: true })
  issue_date: Date;

  @Column({ type: 'integer', nullable: true })
  present_km: number;

  @Column({ type: 'text', nullable: true })
  present_age: string | null;

  @Column({ type: 'timestamp', nullable: true })
  overhauling_date: Date;

  @Column({ type: 'text', nullable: true })
  ci: string;

  @Column({ type: 'integer', nullable: true })
  auth: number;

  @Column({ type: 'integer', nullable: true })
  held: number;

  @Column({ type: 'text', nullable: true })
  unit: string;

  @Column({ type: 'text', nullable: true })
  maint_wksp: string;

  @Column({ type: 'text', nullable: true })
  rmk: string;

  @Column({
    type: 'enum',
    enum: UnitType,
  })
  unit_type: UnitType;

  @Column({
    type: 'enum',
    enum: UnitStatus,
    default: UnitStatus.AVAILABLE,
  })
  status: UnitStatus;

  // Root/Assigned workshop (permanent assignment)
  @Column({ nullable: true })
  workshop_id: string;

  @ManyToOne(() => Workshop, (workshop) => workshop.user_units)
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  // Currently active workshop (where vehicle is now)
  @Column({ nullable: true })
  active_workshop_id: string;

  @ManyToOne(() => Workshop)
  @JoinColumn({ name: 'active_workshop_id' })
  active_workshop: Workshop;

  // Workshop history - JSON array of {workshop_id, entered_at, exited_at}
  @Column({ type: 'jsonb', nullable: true, default: [] })
  workshop_history: Array<{
    workshop_id: string;
    workshop_name?: string;
    entry_id?: string;
    ba_no?: string;
    entered_at: Date;
    exited_at?: Date;
  }>;

  @OneToMany(() => LogBook, (log) => log.user_unit)
  log_books: LogBook[];

  @OneToMany(() => ConsumeRequest, (request) => request.user_unit)
  consume_requests: ConsumeRequest[];

  @Column({ type: 'timestamp', nullable: true })
  entered_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  exited_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_maintenance_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  /**
   * Calculate age from issue_date automatically
   */
  private calculateAge(): string | null {
    if (!this.issue_date) {
      return null;
    }

    const issueDate = new Date(this.issue_date);
    const currentDate = new Date();

    let years = currentDate.getFullYear() - issueDate.getFullYear();
    let months = currentDate.getMonth() - issueDate.getMonth();

    // Adjust if current month is before issue month
    if (months < 0) {
      years--;
      months += 12;
    }

    // Format: "06 Yr 11 Month" or "06 Yr 0 Month"
    return `${String(years).padStart(2, '0')} Yr ${months} Month`;
  }

  /**
   * Auto-calculate present_age before inserting
   */
  @BeforeInsert()
  setAgeBeforeInsert() {
    if (this.issue_date) {
      this.present_age = this.calculateAge();
    }
  }

  /**
   * Auto-calculate present_age before updating
   */
  @BeforeUpdate()
  setAgeBeforeUpdate() {
    if (this.issue_date) {
      this.present_age = this.calculateAge();
    }
  }

  /**
   * Auto-calculate present_age after loading from database
   */
  @AfterLoad()
  setAgeAfterLoad() {
    if (this.issue_date) {
      this.present_age = this.calculateAge();
    }
  }
}
