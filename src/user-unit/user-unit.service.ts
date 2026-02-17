import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateUserUnitDto } from './dto/create-user-unit.dto';
import { UpdateUserUnitDto } from './dto/update-user-unit.dto';
import { UserUnit, UnitStatus } from './entities/user-unit.entity';
import { LogBookService } from '../log-book/log-book.service';
import { LogType } from '../log-book/entities/log-book.entity';
import { Entry } from '../entities/entry.entity';
import { Exit } from '../entities/exit.entity';
import { ConsumeRequest } from '../entities/consume-request.entity';
import { LogBook } from '../log-book/entities/log-book.entity';
import { JobCart } from '../entities/job-cart.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { Workshop } from '../workshop/entities/workshop.entity';

@Injectable()
export class UserUnitService {
  constructor(
    @InjectRepository(UserUnit)
    private userUnitRepository: Repository<UserUnit>,
    @InjectRepository(Entry)
    private entryRepository: Repository<Entry>,
    @InjectRepository(Exit)
    private exitRepository: Repository<Exit>,
    @InjectRepository(ConsumeRequest)
    private consumeRequestRepository: Repository<ConsumeRequest>,
    @InjectRepository(LogBook)
    private logBookRepository: Repository<LogBook>,
    @InjectRepository(JobCart)
    private jobCartRepository: Repository<JobCart>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(Workshop)
    private workshopRepository: Repository<Workshop>,
    private readonly logBookService: LogBookService,
    private dataSource: DataSource,
  ) {}

  async create(createUserUnitDto: CreateUserUnitDto): Promise<UserUnit> {
    const userUnit = this.userUnitRepository.create({
      ...createUserUnitDto,
      entered_at: new Date(),
      status: UnitStatus.IN_WORKSHOP,
    });
    const saved = await this.userUnitRepository.save(userUnit);

    // Fetch workshop name if workshop_id is provided
    let workshopInfo = '';
    if (saved.workshop_id) {
      const workshop = await this.workshopRepository.findOne({
        where: { id: saved.workshop_id },
      });
      if (workshop) {
        workshopInfo = ` at Workshop: ${workshop.name}`;
      }
    }

    // Auto-log entry
    await this.logBookService.create({
      user_unit_id: saved.id,
      log_type: LogType.ENTRY,
      description: `Unit "${saved.full_name_with_model}" (BA/Regt: ${saved.ba_regt_no}) entered workshop${workshopInfo}`,
    });

    return saved;
  }

  async findAll(workshopId?: string): Promise<UserUnit[]> {
    const where: any = {};
    if (workshopId) {
      where.workshop_id = workshopId;
    }

    return await this.userUnitRepository.find({
      where,
      relations: ['workshop', 'log_books', 'consume_requests'],
      order: { entered_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<UserUnit> {
    const userUnit = await this.userUnitRepository.findOne({
      where: { id },
      relations: ['workshop', 'log_books', 'consume_requests'],
    });

    if (!userUnit) {
      throw new NotFoundException(`UserUnit with ID ${id} not found`);
    }

    return userUnit;
  }

  async update(
    id: string,
    updateUserUnitDto: UpdateUserUnitDto,
  ): Promise<UserUnit> {
    const userUnit = await this.findOne(id);
    const previousStatus = userUnit.status;

    // Handle status-related timestamps
    if (
      updateUserUnitDto.status &&
      updateUserUnitDto.status !== userUnit.status
    ) {
      if (updateUserUnitDto.status === UnitStatus.EXITED) {
        userUnit.exited_at = new Date();
      } else if (updateUserUnitDto.status === UnitStatus.UNDER_MAINTENANCE) {
        userUnit.last_maintenance_at = new Date();
      }
    }

    Object.assign(userUnit, updateUserUnitDto);
    const saved = await this.userUnitRepository.save(userUnit);

    // Auto-log status changes
    if (
      updateUserUnitDto.status &&
      updateUserUnitDto.status !== previousStatus
    ) {
      await this.autoLogStatusChange(saved, updateUserUnitDto.status);
    }

    return saved;
  }

  async updateStatus(id: string, status: UnitStatus): Promise<UserUnit> {
    const userUnit = await this.findOne(id);
    const previousStatus = userUnit.status;
    userUnit.status = status;

    if (status === UnitStatus.EXITED) {
      userUnit.exited_at = new Date();
    } else if (status === UnitStatus.UNDER_MAINTENANCE) {
      userUnit.last_maintenance_at = new Date();
    }

    const saved = await this.userUnitRepository.save(userUnit);

    // Auto-log status changes
    if (status !== previousStatus) {
      await this.autoLogStatusChange(saved, status);
    }

    return saved;
  }

  private async autoLogStatusChange(
    userUnit: UserUnit,
    newStatus: UnitStatus,
  ): Promise<void> {
    let logType: LogType;
    let description: string;

    switch (newStatus) {
      case UnitStatus.EXITED:
        logType = LogType.EXIT;
        description = `Unit "${userUnit.full_name_with_model}" (BA/Regt: ${userUnit.ba_regt_no}) exited workshop`;
        break;
      case UnitStatus.UNDER_MAINTENANCE:
        logType = LogType.MAINTENANCE;
        description = `Unit "${userUnit.full_name_with_model}" (BA/Regt: ${userUnit.ba_regt_no}) placed under maintenance`;
        break;
      case UnitStatus.IN_WORKSHOP:
        logType = LogType.ENTRY;
        description = `Unit "${userUnit.full_name_with_model}" (BA/Regt: ${userUnit.ba_regt_no}) status changed to in workshop`;
        break;
      case UnitStatus.COMPLETED:
        logType = LogType.COMMENT;
        description = `Unit "${userUnit.full_name_with_model}" (BA/Regt: ${userUnit.ba_regt_no}) marked as completed`;
        break;
      default:
        return;
    }

    await this.logBookService.create({
      user_unit_id: userUnit.id,
      log_type: logType,
      description,
    });
  }

  async remove(id: string): Promise<void> {
    // Check if user unit exists
    const userUnit = await this.userUnitRepository.findOne({
      where: { id },
    });

    if (!userUnit) {
      throw new NotFoundException(`UserUnit with ID ${id} not found`);
    }

    // Get all entry IDs for this user_unit (needed to delete exits)
    const entries = await this.entryRepository.find({
      where: { user_unit_id: id },
      select: ['id'],
    });
    const entryIds = entries.map((entry) => entry.id);

    // Use transaction to delete ALL related records and the user unit
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Delete exits (for all entries of this user_unit)
      if (entryIds.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(Exit)
          .where('entry_id IN (:...entryIds)', { entryIds })
          .execute();
      }

      // 2. Delete job carts
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(JobCart)
        .where('user_unit_id = :id', { id })
        .execute();

      // 3. Delete entries
      if (entryIds.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(Entry)
          .where('user_unit_id = :id', { id })
          .execute();
      }

      // 4. Delete chat messages
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(ChatMessage)
        .where('user_unit_id = :id', { id })
        .execute();

      // 5. Delete consume requests
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(ConsumeRequest)
        .where('user_unit_id = :id', { id })
        .execute();

      // 6. Delete log books
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(LogBook)
        .where('user_unit_id = :id', { id })
        .execute();

      // 7. Finally delete the user unit
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(UserUnit)
        .where('id = :id', { id })
        .execute();

      // Commit transaction
      await queryRunner.commitTransaction();
    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async getByWorkshop(workshopId: string): Promise<UserUnit[]> {
    return await this.userUnitRepository.find({
      where: { workshop_id: workshopId },
      relations: ['log_books', 'consume_requests'],
    });
  }

  async getInWorkshop(workshopId: string): Promise<UserUnit[]> {
    return await this.userUnitRepository.find({
      where: {
        workshop_id: workshopId,
        status: UnitStatus.IN_WORKSHOP,
      },
    });
  }

  async markAsCompleted(id: string, userId: string): Promise<UserUnit> {
    const userUnit = await this.findOne(id);

    if (userUnit.status !== UnitStatus.UNDER_MAINTENANCE) {
      throw new NotFoundException(
        'Unit must be UNDER_MAINTENANCE to mark as COMPLETED',
      );
    }

    userUnit.status = UnitStatus.COMPLETED;
    const saved = await this.userUnitRepository.save(userUnit);

    // Auto-log status change
    await this.logBookService.create({
      user_unit_id: saved.id,
      log_type: LogType.COMMENT,
      description: `Unit "${saved.full_name_with_model}" (BA/Regt: ${saved.ba_regt_no}) marked as COMPLETED by store man`,
      performed_by_id: userId,
    });

    return saved;
  }

  async moveToInWorkshop(id: string, userId: string): Promise<UserUnit> {
    const userUnit = await this.findOne(id);

    if (userUnit.status !== UnitStatus.COMPLETED) {
      throw new NotFoundException(
        'Unit must be COMPLETED to move to IN_WORKSHOP',
      );
    }

    userUnit.status = UnitStatus.IN_WORKSHOP;
    const saved = await this.userUnitRepository.save(userUnit);

    // Auto-log status change
    await this.logBookService.create({
      user_unit_id: saved.id,
      log_type: LogType.ENTRY,
      description: `Unit "${saved.full_name_with_model}" (BA/Regt: ${saved.ba_regt_no}) moved to IN_WORKSHOP by inspector`,
      performed_by_id: userId,
    });

    return saved;
  }
}
