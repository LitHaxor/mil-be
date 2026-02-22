import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Exit } from '../entities/exit.entity';
import { Entry } from '../entities/entry.entity';
import { UserUnit, UnitStatus } from '../user-unit/entities/user-unit.entity';
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
    @InjectRepository(UserUnit)
    private userUnitRepository: Repository<UserUnit>,
    private autoLogger: AutoLoggerService,
    private dataSource: DataSource,
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

    // Use transaction to ensure atomicity - all operations succeed or all fail
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create exit within transaction
      const exit = this.exitRepository.create({
        ...createExitDto,
        inspector_id: user.id,
      });

      const savedExit = await queryRunner.manager.save(exit);

      // Get current user_unit with workshop_history
      const userUnit = await queryRunner.manager.findOne(UserUnit, {
        where: { id: entry.user_unit_id },
      });

      // Update workshop_history with exit time
      const workshopHistory = userUnit?.workshop_history || [];
      const lastHistory = workshopHistory[workshopHistory.length - 1];
      if (lastHistory && lastHistory.entry_id === entry.id) {
        lastHistory.exited_at = new Date();
      }

      // Update user_unit: clear active_workshop, set status to EXITED, update history
      const userUnitUpdate: any = {
        status: UnitStatus.EXITED,
        active_workshop_id: () => 'NULL',
        exited_at: new Date(),
        workshop_history: workshopHistory,
      };
      if (createExitDto.unit) {
        userUnitUpdate.unit = createExitDto.unit;
      }
      await queryRunner.manager
        .createQueryBuilder()
        .update(UserUnit)
        .set(userUnitUpdate)
        .where('id = :id', { id: entry.user_unit_id })
        .execute();

      // Verify the exit was created and linked properly
      const verifyEntry = await queryRunner.manager.findOne(Entry, {
        where: { id: createExitDto.entry_id },
        relations: ['exit'],
      });

      if (!verifyEntry?.exit) {
        throw new InternalServerErrorException(
          'Failed to establish entry-exit relationship',
        );
      }

      // Verify user_unit status was updated
      const verifyUserUnit = await queryRunner.manager.findOne(UserUnit, {
        where: { id: entry.user_unit_id },
      });

      if (verifyUserUnit?.status !== UnitStatus.EXITED) {
        throw new InternalServerErrorException(
          'Failed to update user_unit status to EXITED',
        );
      }

      if (verifyUserUnit?.active_workshop_id !== null) {
        throw new InternalServerErrorException(
          'Failed to clear active_workshop_id',
        );
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Auto-log exit creation (after transaction succeeds)
      await this.autoLogger.log({
        logType: LogType.EXIT_CREATED,
        actorId: user.id,
        description: `Exit created for unit ${entry.user_unit.full_name_with_model} (BA/Regt: ${entry.user_unit.ba_regt_no}) from Workshop: ${entry.workshop.name} - Unit: ${createExitDto.unit} - Status: EXITED`,
        workshopId: entry.workshop_id,
        userUnitId: entry.user_unit_id,
        entryId: entry.id,
        metadata: {
          workshop_name: entry.workshop.name,
          unit: createExitDto.unit,
          odometer_km: createExitDto.odometer_km,
          work_performed: createExitDto.work_performed,
          exit_condition_notes: createExitDto.exit_condition_notes,
          exited_at: savedExit.exited_at,
        },
      });

      // Return the saved exit with full relations
      const exitWithRelations = await this.exitRepository.findOne({
        where: { id: savedExit.id },
        relations: ['entry', 'entry.workshop', 'entry.user_unit', 'inspector'],
      });

      if (!exitWithRelations) {
        throw new InternalServerErrorException(
          'Failed to retrieve created exit',
        );
      }

      return exitWithRelations;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
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
