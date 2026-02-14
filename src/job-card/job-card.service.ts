import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JobCard, JobCardStatus } from '../entities/job-card.entity';
import { Entry } from '../entities/entry.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateJobCardDto } from './dto/create-job-card.dto';
import { ApproveJobCardDto } from './dto/approve-job-card.dto';
import { RejectJobCardDto } from './dto/reject-job-card.dto';
import { IssueJobCardDto } from './dto/issue-job-card.dto';
import { AutoLoggerService } from '../log-book/services/auto-logger.service';
import { LogType } from '../log-book/entities/log-book.entity';

@Injectable()
export class JobCardService {
  constructor(
    @InjectRepository(JobCard)
    private jobCardRepository: Repository<JobCard>,
    @InjectRepository(Entry)
    private entryRepository: Repository<Entry>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private dataSource: DataSource,
    private autoLogger: AutoLoggerService,
  ) {}

  async create(
    createJobCardDto: CreateJobCardDto,
    user: User,
  ): Promise<JobCard> {
    // Verify user is inspector
    if (user.role !== UserRole.INSPECTOR_RI_AND_I) {
      throw new ForbiddenException('Only inspectors can create job cards');
    }

    // Verify entry exists and load full details
    const entry = await this.entryRepository.findOne({
      where: { id: createJobCardDto.entry_id },
      relations: ['workshop', 'user_unit'],
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Verify inspector is assigned to the workshop
    if (entry.workshop.inspector_id !== user.id) {
      throw new ForbiddenException(
        'You are not assigned as inspector for this workshop',
      );
    }

    // Create job card
    const jobCard = this.jobCardRepository.create({
      ...createJobCardDto,
      user_unit_id: entry.user_unit_id,
      workshop_id: entry.workshop_id,
      inspector_id: user.id,
      status: JobCardStatus.PENDING,
    });

    const savedJobCard = await this.jobCardRepository.save(jobCard);

    // Auto-log creation
    await this.autoLogger.log({
      logType: LogType.JOB_CARD_CREATED,
      actorId: user.id,
      description: `Job card created for ${createJobCardDto.requested_quantity}x parts`,
      workshopId: entry.workshop_id,
      userUnitId: entry.user_unit_id,
      entryId: entry.id,
      jobCardId: savedJobCard.id,
      metadata: {
        spare_part_id: createJobCardDto.spare_part_id,
        requested_quantity: createJobCardDto.requested_quantity,
      },
    });

    return savedJobCard;
  }

  async findAll(
    user: User,
    filters?: {
      workshop_id?: string;
      entry_id?: string;
      user_unit_id?: string;
      status?: JobCardStatus;
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: JobCard[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.jobCardRepository
      .createQueryBuilder('job_card')
      .leftJoinAndSelect('job_card.entry', 'entry')
      .leftJoinAndSelect('job_card.workshop', 'workshop')
      .leftJoinAndSelect('job_card.user_unit', 'user_unit')
      .leftJoinAndSelect('job_card.spare_part', 'spare_part')
      .leftJoinAndSelect('job_card.inspector', 'inspector')
      .leftJoinAndSelect('job_card.approved_by', 'approved_by')
      .leftJoinAndSelect('job_card.rejected_by', 'rejected_by')
      .leftJoinAndSelect('job_card.issued_by', 'issued_by');

    // Authorization based on role
    if (user.role === UserRole.INSPECTOR_RI_AND_I && user.workshop_id) {
      // Inspector: see job cards from their workshop
      queryBuilder.andWhere('job_card.workshop_id = :workshopId', {
        workshopId: user.workshop_id,
      });
    } else if (user.role === UserRole.CAPTAIN && user.workshop_id) {
      // Captain: see job cards from their workshop
      queryBuilder.andWhere('job_card.workshop_id = :workshopId', {
        workshopId: user.workshop_id,
      });
    } else if (user.role === UserRole.OC && user.workshop_id) {
      // OC: see job cards from their workshop
      queryBuilder.andWhere('job_card.workshop_id = :workshopId', {
        workshopId: user.workshop_id,
      });
    } else if (user.role === UserRole.STORE_MAN && user.workshop_id) {
      // Store_man: ONLY see APPROVED job cards from their workshop
      queryBuilder
        .andWhere('job_card.workshop_id = :workshopId', {
          workshopId: user.workshop_id,
        })
        .andWhere('job_card.status = :status', {
          status: JobCardStatus.APPROVED,
        });
    }

    // Apply filters
    if (filters?.workshop_id) {
      queryBuilder.andWhere('job_card.workshop_id = :workshopId', {
        workshopId: filters.workshop_id,
      });
    }

    if (filters?.entry_id) {
      queryBuilder.andWhere('job_card.entry_id = :entryId', {
        entryId: filters.entry_id,
      });
    }

    if (filters?.user_unit_id) {
      queryBuilder.andWhere('job_card.user_unit_id = :unitId', {
        unitId: filters.user_unit_id,
      });
    }

    if (filters?.status && user.role !== UserRole.STORE_MAN) {
      queryBuilder.andWhere('job_card.status = :status', {
        status: filters.status,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('job_card.created_at', 'DESC')
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

  async findOne(id: string, user?: User): Promise<any> {
    const jobCard = await this.jobCardRepository.findOne({
      where: { id },
      relations: [
        'entry',
        'workshop',
        'user_unit',
        'spare_part',
        'inspector',
        'approved_by',
        'rejected_by',
        'issued_by',
      ],
    });

    if (!jobCard) {
      throw new NotFoundException('Job card not found');
    }

    // Store_man can only view APPROVED job cards
    if (
      user &&
      user.role === UserRole.STORE_MAN &&
      jobCard.status !== JobCardStatus.APPROVED
    ) {
      throw new ForbiddenException(
        'Store managers can only view approved job cards',
      );
    }

    // Get current inventory for this part
    const inventory = await this.inventoryRepository.findOne({
      where: {
        workshop_id: jobCard.workshop_id,
        spare_part_id: jobCard.spare_part_id,
      },
    });

    return {
      ...jobCard,
      current_inventory: inventory
        ? {
            quantity: inventory.quantity,
            min_quantity: inventory.min_quantity,
          }
        : null,
    };
  }

  async approve(
    id: string,
    approveDto: ApproveJobCardDto,
    user: User,
  ): Promise<any> {
    // Verify user is captain or OC
    if (user.role !== UserRole.CAPTAIN && user.role !== UserRole.OC) {
      throw new ForbiddenException('Only captain or OC can approve job cards');
    }

    const jobCard = await this.jobCardRepository.findOne({
      where: { id },
      relations: ['workshop', 'spare_part', 'user_unit', 'entry'],
    });

    if (!jobCard) {
      throw new NotFoundException('Job card not found');
    }

    // Verify user is assigned to the workshop
    if (
      user.role === UserRole.CAPTAIN &&
      jobCard.workshop.captain_id !== user.id
    ) {
      throw new ForbiddenException(
        'You are not assigned as captain for this workshop',
      );
    }

    if (user.role === UserRole.OC && jobCard.workshop.oc_id !== user.id) {
      throw new ForbiddenException(
        'You are not assigned as OC for this workshop',
      );
    }

    // Verify status is PENDING
    if (jobCard.status !== JobCardStatus.PENDING) {
      throw new BadRequestException(
        `Job card must be PENDING to approve (current status: ${jobCard.status})`,
      );
    }

    // Get inventory
    const inventory = await this.inventoryRepository.findOne({
      where: {
        workshop_id: jobCard.workshop_id,
        spare_part_id: jobCard.spare_part_id,
      },
    });

    // Verify sufficient inventory
    if (!inventory || inventory.quantity < jobCard.requested_quantity) {
      throw new BadRequestException(
        `Insufficient inventory (requested: ${jobCard.requested_quantity}, available: ${inventory?.quantity || 0})`,
      );
    }

    // Execute in atomic transaction: approval + inventory deduction + logging
    const result = await this.dataSource.transaction(async (manager) => {
      // Update job card
      await manager.update(JobCard, id, {
        status: JobCardStatus.APPROVED,
        approved_by_id: user.id,
        approved_at: new Date(),
      });

      // Deduct inventory
      await manager.decrement(
        Inventory,
        { id: inventory.id },
        'quantity',
        jobCard.requested_quantity,
      );

      const newStockLevel = inventory.quantity - jobCard.requested_quantity;

      // Create approval log
      await this.autoLogger.log(
        {
          logType: LogType.JOB_CARD_APPROVED,
          actorId: user.id,
          description: `Job card approved by ${user.role}`,
          workshopId: jobCard.workshop_id,
          userUnitId: jobCard.user_unit_id,
          entryId: jobCard.entry_id,
          jobCardId: jobCard.id,
          metadata: {
            spare_part_id: jobCard.spare_part_id,
            requested_quantity: jobCard.requested_quantity,
          },
        },
        manager,
      );

      // Create inventory deduction log
      await this.autoLogger.log(
        {
          logType: LogType.INVENTORY_DEDUCTED,
          actorId: user.id,
          description: `Inventory deducted for approved job card`,
          workshopId: jobCard.workshop_id,
          jobCardId: jobCard.id,
          metadata: {
            spare_part_id: jobCard.spare_part_id,
            quantity_deducted: jobCard.requested_quantity,
            previous_stock: inventory.quantity,
            new_stock: newStockLevel,
          },
        },
        manager,
      );

      return {
        newStockLevel,
      };
    });

    // Return updated job card with inventory info
    const updatedJobCard = await this.findOne(id);
    return {
      ...updatedJobCard,
      inventory_deducted: {
        spare_part_id: jobCard.spare_part_id,
        quantity_deducted: jobCard.requested_quantity,
        new_stock_level: result.newStockLevel,
      },
    };
  }

  async reject(
    id: string,
    rejectDto: RejectJobCardDto,
    user: User,
  ): Promise<JobCard> {
    // Verify user is captain or OC
    if (user.role !== UserRole.CAPTAIN && user.role !== UserRole.OC) {
      throw new ForbiddenException('Only captain or OC can reject job cards');
    }

    const jobCard = await this.jobCardRepository.findOne({
      where: { id },
      relations: ['workshop', 'user_unit', 'entry'],
    });

    if (!jobCard) {
      throw new NotFoundException('Job card not found');
    }

    // Verify user is assigned to the workshop
    if (
      user.role === UserRole.CAPTAIN &&
      jobCard.workshop.captain_id !== user.id
    ) {
      throw new ForbiddenException(
        'You are not assigned as captain for this workshop',
      );
    }

    if (user.role === UserRole.OC && jobCard.workshop.oc_id !== user.id) {
      throw new ForbiddenException(
        'You are not assigned as OC for this workshop',
      );
    }

    // Verify status is PENDING
    if (jobCard.status !== JobCardStatus.PENDING) {
      throw new BadRequestException(
        `Job card must be PENDING to reject (current status: ${jobCard.status})`,
      );
    }

    // Update job card
    jobCard.status = JobCardStatus.REJECTED;
    jobCard.rejected_by_id = user.id;
    jobCard.rejected_at = new Date();
    jobCard.rejection_reason = rejectDto.rejection_reason;

    const savedJobCard = await this.jobCardRepository.save(jobCard);

    // Auto-log rejection
    await this.autoLogger.log({
      logType: LogType.JOB_CARD_REJECTED,
      actorId: user.id,
      description: `Job card rejected by ${user.role}`,
      workshopId: jobCard.workshop_id,
      userUnitId: jobCard.user_unit_id,
      entryId: jobCard.entry_id,
      jobCardId: jobCard.id,
      metadata: {
        rejection_reason: rejectDto.rejection_reason,
      },
    });

    return savedJobCard;
  }

  async veto(
    id: string,
    rejectDto: RejectJobCardDto,
    user: User,
  ): Promise<any> {
    // ONLY OC can veto
    if (user.role !== UserRole.OC) {
      throw new ForbiddenException('Only OC can veto job cards');
    }

    const jobCard = await this.jobCardRepository.findOne({
      where: { id },
      relations: ['workshop', 'spare_part', 'user_unit', 'entry'],
    });

    if (!jobCard) {
      throw new NotFoundException('Job card not found');
    }

    // Verify user is assigned to the workshop
    if (jobCard.workshop.oc_id !== user.id) {
      throw new ForbiddenException(
        'You are not assigned as OC for this workshop',
      );
    }

    // Verify status is APPROVED (not ISSUED)
    if (jobCard.status !== JobCardStatus.APPROVED) {
      throw new BadRequestException(
        `Can only veto APPROVED job cards. Current status: ${jobCard.status}`,
      );
    }

    // Get inventory
    const inventory = await this.inventoryRepository.findOne({
      where: {
        workshop_id: jobCard.workshop_id,
        spare_part_id: jobCard.spare_part_id,
      },
    });

    if (!inventory) {
      throw new BadRequestException('Inventory record not found');
    }

    // Execute in atomic transaction: veto + inventory restoration + logging
    const result = await this.dataSource.transaction(async (manager) => {
      // Update job card
      await manager.update(JobCard, id, {
        status: JobCardStatus.OC_VETOED,
        rejected_by_id: user.id,
        rejected_at: new Date(),
        rejection_reason: rejectDto.rejection_reason,
      });

      // Restore inventory
      await manager.increment(
        Inventory,
        { id: inventory.id },
        'quantity',
        jobCard.requested_quantity,
      );

      const newStockLevel = inventory.quantity + jobCard.requested_quantity;

      // Create veto log
      await this.autoLogger.log(
        {
          logType: LogType.JOB_CARD_VETOED,
          actorId: user.id,
          description: 'Job card vetoed by OC',
          workshopId: jobCard.workshop_id,
          userUnitId: jobCard.user_unit_id,
          entryId: jobCard.entry_id,
          jobCardId: jobCard.id,
          metadata: {
            rejection_reason: rejectDto.rejection_reason,
          },
        },
        manager,
      );

      // Create inventory restoration log
      await this.autoLogger.log(
        {
          logType: LogType.INVENTORY_RESTORED,
          actorId: user.id,
          description: 'Inventory restored after job card veto',
          workshopId: jobCard.workshop_id,
          jobCardId: jobCard.id,
          metadata: {
            spare_part_id: jobCard.spare_part_id,
            quantity_restored: jobCard.requested_quantity,
            previous_stock: inventory.quantity,
            new_stock: newStockLevel,
          },
        },
        manager,
      );

      return {
        newStockLevel,
      };
    });

    // Return updated job card with inventory info
    const updatedJobCard = await this.findOne(id);
    return {
      ...updatedJobCard,
      inventory_restored: {
        spare_part_id: jobCard.spare_part_id,
        quantity_restored: jobCard.requested_quantity,
        new_stock_level: result.newStockLevel,
      },
    };
  }

  async issue(
    id: string,
    issueDto: IssueJobCardDto,
    user: User,
  ): Promise<JobCard> {
    // Verify user is store_man
    if (user.role !== UserRole.STORE_MAN) {
      throw new ForbiddenException('Only store managers can issue job cards');
    }

    const jobCard = await this.jobCardRepository.findOne({
      where: { id },
      relations: ['workshop', 'user_unit', 'entry'],
    });

    if (!jobCard) {
      throw new NotFoundException('Job card not found');
    }

    // Verify user is assigned to the workshop
    if (jobCard.workshop.store_man_id !== user.id) {
      throw new ForbiddenException(
        'You are not assigned as store manager for this workshop',
      );
    }

    // Verify status is APPROVED
    if (jobCard.status !== JobCardStatus.APPROVED) {
      throw new BadRequestException(
        `Can only issue APPROVED job cards. Current status: ${jobCard.status}`,
      );
    }

    // Update job card
    jobCard.status = JobCardStatus.ISSUED;
    jobCard.issued_by_id = user.id;
    jobCard.issued_at = new Date();
    if (issueDto.notes) {
      jobCard.notes = issueDto.notes;
    }

    const savedJobCard = await this.jobCardRepository.save(jobCard);

    // Auto-log issuance
    await this.autoLogger.log({
      logType: LogType.JOB_CARD_ISSUED,
      actorId: user.id,
      description: 'Job card marked as issued by store manager',
      workshopId: jobCard.workshop_id,
      userUnitId: jobCard.user_unit_id,
      entryId: jobCard.entry_id,
      jobCardId: jobCard.id,
      metadata: {
        notes: issueDto.notes,
      },
    });

    return savedJobCard;
  }
}
