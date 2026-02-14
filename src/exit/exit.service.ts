import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exit } from '../entities/exit.entity';
import { Entry } from '../entities/entry.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateExitDto } from './dto/create-exit.dto';
import { AutoLoggerService } from '../log-book/services/auto-logger.service';
import { LogType } from '../log-book/entities/log-book.entity';

@Injectable()
export class ExitService {
  constructor(
    @InjectRepository(Exit)
    private exitRepository: Repository<Exit>,
    @InjectRepository(Entry)
    private entryRepository: Repository<Entry>,
    private autoLogger: AutoLoggerService,
  ) {}

  async create(createExitDto: CreateExitDto, user: User): Promise<Exit> {
    // Verify user is inspector
    if (user.role !== UserRole.INSPECTOR_RI_AND_I) {
      throw new ForbiddenException('Only inspectors can create exits');
    }

    // Verify entry exists and load full details
    const entry = await this.entryRepository.findOne({
      where: { id: createExitDto.entry_id },
      relations: ['workshop', 'user_unit', 'exit'],
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Verify inspector is assigned to the workshop of this entry
    if (entry.workshop.inspector_id !== user.id) {
      throw new ForbiddenException(
        'You are not assigned as inspector for this workshop',
      );
    }

    // Check if entry already has an exit (1:1 relationship)
    if (entry.exit) {
      throw new BadRequestException(
        'This entry already has an exit. Each entry can only have one exit.',
      );
    }

    // Create exit
    const exit = this.exitRepository.create({
      ...createExitDto,
      inspector_id: user.id,
    });

    const savedExit = await this.exitRepository.save(exit);

    // Auto-log exit creation
    await this.autoLogger.log({
      logType: LogType.EXIT_CREATED,
      actorId: user.id,
      description: `Exit created for unit ${entry.user_unit.name} (${entry.user_unit.unit_number})`,
      workshopId: entry.workshop_id,
      userUnitId: entry.user_unit_id,
      entryId: entry.id,
      metadata: {
        odometer_km: createExitDto.odometer_km,
        work_performed: createExitDto.work_performed,
      },
    });

    return savedExit;
  }

  async findAll(
    user: User,
    filters?: {
      workshop_id?: string;
      entry_id?: string;
      user_unit_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: Exit[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.exitRepository
      .createQueryBuilder('exit')
      .leftJoinAndSelect('exit.entry', 'entry')
      .leftJoinAndSelect('entry.workshop', 'workshop')
      .leftJoinAndSelect('entry.user_unit', 'user_unit')
      .leftJoinAndSelect('exit.inspector', 'inspector');

    // Authorization: Inspector can only see exits from their workshop
    if (user.role === UserRole.INSPECTOR_RI_AND_I && user.workshop_id) {
      queryBuilder.andWhere('workshop.id = :workshopId', {
        workshopId: user.workshop_id,
      });
    }

    // Apply filters
    if (filters?.workshop_id) {
      queryBuilder.andWhere('workshop.id = :workshopId', {
        workshopId: filters.workshop_id,
      });
    }

    if (filters?.entry_id) {
      queryBuilder.andWhere('exit.entry_id = :entryId', {
        entryId: filters.entry_id,
      });
    }

    if (filters?.user_unit_id) {
      queryBuilder.andWhere('user_unit.id = :unitId', {
        unitId: filters.user_unit_id,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('exit.exited_at', 'DESC')
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

  async findOne(id: string): Promise<Exit> {
    const exit = await this.exitRepository.findOne({
      where: { id },
      relations: ['entry', 'entry.workshop', 'entry.user_unit', 'inspector'],
    });

    if (!exit) {
      throw new NotFoundException('Exit not found');
    }

    return exit;
  }
}
