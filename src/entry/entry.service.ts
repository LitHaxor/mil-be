import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entry } from '../entities/entry.entity';
import { Workshop } from '../workshop/entities/workshop.entity';
import { UserUnit } from '../user-unit/entities/user-unit.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { AutoLoggerService } from '../log-book/services/auto-logger.service';
import { LogType } from '../log-book/entities/log-book.entity';

@Injectable()
export class EntryService {
  constructor(
    @InjectRepository(Entry)
    private entryRepository: Repository<Entry>,
    @InjectRepository(Workshop)
    private workshopRepository: Repository<Workshop>,
    @InjectRepository(UserUnit)
    private userUnitRepository: Repository<UserUnit>,
    private autoLogger: AutoLoggerService,
  ) {}

  async create(createEntryDto: CreateEntryDto, user: User): Promise<Entry> {
    // Verify user is inspector
    if (user.role !== UserRole.INSPECTOR_RI_AND_I) {
      throw new ForbiddenException('Only inspectors can create entries');
    }

    // Verify workshop exists and get full details
    const workshop = await this.workshopRepository.findOne({
      where: { id: createEntryDto.workshop_id },
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    // Verify inspector is assigned to this workshop
    if (workshop.inspector_id !== user.id) {
      throw new ForbiddenException(
        'You are not assigned as inspector for this workshop',
      );
    }

    // Verify workshop has all 4 roles assigned (readiness check)
    if (
      !workshop.inspector_id ||
      !workshop.store_man_id ||
      !workshop.captain_id ||
      !workshop.oc_id
    ) {
      throw new BadRequestException(
        'Workshop must have all roles assigned (inspector, store_man, captain, OC) before creating entries',
      );
    }

    // Verify unit exists
    const unit = await this.userUnitRepository.findOne({
      where: { id: createEntryDto.user_unit_id },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Check if unit already has an active entry (no exit)
    const activeEntry = await this.entryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.exit', 'exit')
      .where('entry.user_unit_id = :unitId', {
        unitId: createEntryDto.user_unit_id,
      })
      .andWhere('exit.id IS NULL')
      .getOne();

    if (activeEntry) {
      throw new BadRequestException(
        'Unit already has an active entry. Please create an exit first.',
      );
    }

    // Create entry
    const entry = this.entryRepository.create({
      ...createEntryDto,
      inspector_id: user.id,
    });

    const savedEntry = await this.entryRepository.save(entry);

    // Auto-log entry creation
    await this.autoLogger.log({
      logType: LogType.ENTRY_CREATED,
      actorId: user.id,
      description: `Entry created for unit ${unit.name} (${unit.unit_number})`,
      workshopId: workshop.id,
      userUnitId: unit.id,
      entryId: savedEntry.id,
      metadata: {
        odometer_km: createEntryDto.odometer_km,
        reported_issues: createEntryDto.reported_issues,
      },
    });

    return savedEntry;
  }

  async findAll(
    user: User,
    filters?: {
      workshop_id?: string;
      user_unit_id?: string;
      has_exit?: boolean;
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: Entry[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.entryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.workshop', 'workshop')
      .leftJoinAndSelect('entry.user_unit', 'user_unit')
      .leftJoinAndSelect('entry.inspector', 'inspector')
      .leftJoinAndSelect('entry.exit', 'exit');

    // Authorization: Inspector can only see entries from their workshop
    if (user.role === UserRole.INSPECTOR_RI_AND_I && user.workshop_id) {
      queryBuilder.andWhere('entry.workshop_id = :workshopId', {
        workshopId: user.workshop_id,
      });
    }

    // Apply filters
    if (filters?.workshop_id) {
      queryBuilder.andWhere('entry.workshop_id = :workshopId', {
        workshopId: filters.workshop_id,
      });
    }

    if (filters?.user_unit_id) {
      queryBuilder.andWhere('entry.user_unit_id = :unitId', {
        unitId: filters.user_unit_id,
      });
    }

    if (filters?.has_exit !== undefined) {
      if (filters.has_exit === false) {
        queryBuilder.andWhere('exit.id IS NULL');
      } else {
        queryBuilder.andWhere('exit.id IS NOT NULL');
      }
    }

    const [data, total] = await queryBuilder
      .orderBy('entry.entered_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Entry> {
    const entry = await this.entryRepository.findOne({
      where: { id },
      relations: ['workshop', 'user_unit', 'inspector', 'exit'],
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    return entry;
  }

  async update(
    id: string,
    updateEntryDto: UpdateEntryDto,
    user: User,
  ): Promise<Entry> {
    const entry = await this.findOne(id);

    // Only the inspector who created it can update
    if (entry.inspector_id !== user.id) {
      throw new ForbiddenException('You can only update entries you created');
    }

    // Update entry
    Object.assign(entry, updateEntryDto);
    const updatedEntry = await this.entryRepository.save(entry);

    // Auto-log update
    await this.autoLogger.log({
      logType: LogType.ENTRY_UPDATED,
      actorId: user.id,
      description: `Entry updated for unit ${entry.user_unit.name}`,
      workshopId: entry.workshop_id,
      userUnitId: entry.user_unit_id,
      entryId: entry.id,
      metadata: updateEntryDto,
    });

    return updatedEntry;
  }
}
