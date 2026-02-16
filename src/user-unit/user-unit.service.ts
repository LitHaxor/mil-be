import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserUnitDto } from './dto/create-user-unit.dto';
import { UpdateUserUnitDto } from './dto/update-user-unit.dto';
import { UserUnit, UnitStatus } from './entities/user-unit.entity';
import { LogBookService } from '../log-book/log-book.service';
import { LogType } from '../log-book/entities/log-book.entity';

@Injectable()
export class UserUnitService {
  constructor(
    @InjectRepository(UserUnit)
    private userUnitRepository: Repository<UserUnit>,
    private readonly logBookService: LogBookService,
  ) {}

  async create(createUserUnitDto: CreateUserUnitDto): Promise<UserUnit> {
    const userUnit = this.userUnitRepository.create({
      ...createUserUnitDto,
      entered_at: new Date(),
      status: UnitStatus.IN_WORKSHOP,
    });
    const saved = await this.userUnitRepository.save(userUnit);

    // Auto-log entry
    await this.logBookService.create({
      user_unit_id: saved.id,
      log_type: LogType.ENTRY,
      description: `Unit "${saved.full_name_with_model}" (BA/Regt: ${saved.ba_regt_no}) entered workshop`,
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
    await this.userUnitRepository.delete(id);
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
}
