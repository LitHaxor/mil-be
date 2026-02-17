import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JobCart, JobCartStatus } from '../entities/job-cart.entity';
import { Entry } from '../entities/entry.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { UserUnit, UnitStatus } from '../user-unit/entities/user-unit.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateJobCartDto } from './dto/create-job-cart.dto';
import { ApproveJobCartDto } from './dto/approve-job-cart.dto';
import { RejectJobCartDto } from './dto/reject-job-cart.dto';
import { IssueJobCartDto } from './dto/issue-job-cart.dto';
import { AutoLoggerService } from '../log-book/services/auto-logger.service';
import { LogType } from '../log-book/entities/log-book.entity';

@Injectable()
export class JobCartService {
  constructor(
    @InjectRepository(JobCart)
    private jobCartRepository: Repository<JobCart>,
    @InjectRepository(Entry)
    private entryRepository: Repository<Entry>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(UserUnit)
    private userUnitRepository: Repository<UserUnit>,
    private dataSource: DataSource,
    private autoLogger: AutoLoggerService,
  ) {}

  async create(
    createJobCartDto: CreateJobCartDto,
    user: User,
  ): Promise<JobCart> {
    // Verify user is inspector
    if (user.role !== UserRole.INSPECTOR_RI_AND_I) {
      throw new ForbiddenException('Only inspectors can create job carts');
    }

    // Verify entry exists and load full details
    const entry = await this.entryRepository.findOne({
      where: { id: createJobCartDto.entry_id },
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

    // Create job cart with ISSUED status (no approval needed)
    const jobCart = this.jobCartRepository.create({
      entry_id: createJobCartDto.entry_id,
      spare_part_id: createJobCartDto.spare_part_id,
      requested_quantity: createJobCartDto.requested_quantity || 0,
      notes: createJobCartDto.notes,
      user_unit_id: entry.user_unit_id,
      workshop_id: entry.workshop_id,
      inspector_id: user.id,
      status: JobCartStatus.ISSUED,
      issued_by_id: user.id,
      issued_at: new Date(),
    });

    const savedJobCart = await this.jobCartRepository.save(jobCart);

    // Update user_unit status to UNDER_MAINTENANCE
    await this.userUnitRepository.update(entry.user_unit_id, {
      status: UnitStatus.UNDER_MAINTENANCE,
    });

    // Auto-log creation and issuance
    await this.autoLogger.log({
      logType: LogType.JOB_CARD_ISSUED,
      actorId: user.id,
      description: `Job cart created and auto-issued${createJobCartDto.spare_part_id ? ` for ${createJobCartDto.requested_quantity || 0}x parts` : ''} - Unit status: UNDER MAINTENANCE`,
      workshopId: entry.workshop_id,
      userUnitId: entry.user_unit_id,
      entryId: entry.id,
      jobCardId: savedJobCart.id,
      metadata: {
        spare_part_id: createJobCartDto.spare_part_id,
        requested_quantity: createJobCartDto.requested_quantity,
        ba_no: entry.ba_no,
      },
    });

    return savedJobCart;
  }

  async findAll(
    user: User,
    filters?: {
      workshop_id?: string;
      entry_id?: string;
      user_unit_id?: string;
      status?: JobCartStatus;
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: JobCart[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.jobCartRepository
      .createQueryBuilder('job_cart')
      .leftJoinAndSelect('job_cart.entry', 'entry')
      .leftJoinAndSelect('entry.user_unit', 'entry_user_unit')
      .leftJoinAndSelect('job_cart.workshop', 'workshop')
      .leftJoinAndSelect('job_cart.user_unit', 'user_unit')
      .leftJoinAndSelect('job_cart.spare_part', 'spare_part')
      .leftJoinAndSelect('job_cart.inspector', 'inspector')
      .leftJoinAndSelect('job_cart.approved_by', 'approved_by')
      .leftJoinAndSelect('job_cart.rejected_by', 'rejected_by')
      .leftJoinAndSelect('job_cart.issued_by', 'issued_by');

    // Authorization based on role
    if (user.role === UserRole.INSPECTOR_RI_AND_I && user.workshop_id) {
      // Inspector: see job carts from their workshop
      queryBuilder.andWhere('job_cart.workshop_id = :workshopId', {
        workshopId: user.workshop_id,
      });
    } else if (user.role === UserRole.CAPTAIN && user.workshop_id) {
      // Captain: see ALL job carts from their workshop
      queryBuilder.andWhere('job_cart.workshop_id = :workshopId', {
        workshopId: user.workshop_id,
      });
    } else if (user.role === UserRole.OC && user.workshop_id) {
      // OC: see job carts from their workshop
      queryBuilder.andWhere('job_cart.workshop_id = :workshopId', {
        workshopId: user.workshop_id,
      });
    } else if (user.role === UserRole.STORE_MAN && user.workshop_id) {
      // Store_man: see ALL job carts from their workshop
      queryBuilder.andWhere('job_cart.workshop_id = :workshopId', {
        workshopId: user.workshop_id,
      });
    }

    // Apply filters
    if (filters?.workshop_id) {
      queryBuilder.andWhere('job_cart.workshop_id = :workshopId', {
        workshopId: filters.workshop_id,
      });
    }

    if (filters?.entry_id) {
      queryBuilder.andWhere('job_cart.entry_id = :entryId', {
        entryId: filters.entry_id,
      });
    }

    if (filters?.user_unit_id) {
      queryBuilder.andWhere('job_cart.user_unit_id = :unitId', {
        unitId: filters.user_unit_id,
      });
    }

    if (filters?.status && user.role !== UserRole.STORE_MAN) {
      queryBuilder.andWhere('job_cart.status = :status', {
        status: filters.status,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('job_cart.created_at', 'DESC')
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
    const jobCart = await this.jobCartRepository.findOne({
      where: { id },
      relations: [
        'entry',
        'entry.user_unit',
        'workshop',
        'user_unit',
        'spare_part',
        'inspector',
        'approved_by',
        'rejected_by',
        'issued_by',
      ],
    });

    if (!jobCart) {
      throw new NotFoundException('Job cart not found');
    }

    // Store_man can only view APPROVED job carts
    if (
      user &&
      user.role === UserRole.STORE_MAN &&
      jobCart.status !== JobCartStatus.APPROVED
    ) {
      throw new ForbiddenException(
        'Store managers can only view approved job carts',
      );
    }

    // Get current inventory for this part
    const inventory = await this.inventoryRepository.findOne({
      where: {
        workshop_id: jobCart.workshop_id,
        spare_part_id: jobCart.spare_part_id,
      },
    });

    return {
      ...jobCart,
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
    approveDto: ApproveJobCartDto,
    user: User,
  ): Promise<any> {
    // Verify user is captain or OC
    if (user.role !== UserRole.CAPTAIN && user.role !== UserRole.OC) {
      throw new ForbiddenException('Only captain or OC can approve job carts');
    }

    const jobCart = await this.jobCartRepository.findOne({
      where: { id },
      relations: ['workshop', 'spare_part', 'user_unit', 'entry'],
    });

    if (!jobCart) {
      throw new NotFoundException('Job cart not found');
    }

    // Verify user is assigned to the workshop
    if (
      user.role === UserRole.CAPTAIN &&
      jobCart.workshop.captain_id !== user.id
    ) {
      throw new ForbiddenException(
        'You are not assigned as captain for this workshop',
      );
    }

    if (user.role === UserRole.OC && jobCart.workshop.oc_id !== user.id) {
      throw new ForbiddenException(
        'You are not assigned as OC for this workshop',
      );
    }

    // Verify status is PENDING
    if (jobCart.status !== JobCartStatus.PENDING) {
      throw new BadRequestException(
        `Job cart must be PENDING to approve (current status: ${jobCart.status})`,
      );
    }

    // Get inventory
    const inventory = await this.inventoryRepository.findOne({
      where: {
        workshop_id: jobCart.workshop_id,
        spare_part_id: jobCart.spare_part_id,
      },
    });

    // Verify sufficient inventory
    if (!inventory || inventory.quantity < jobCart.requested_quantity) {
      throw new BadRequestException(
        `Insufficient inventory (requested: ${jobCart.requested_quantity}, available: ${inventory?.quantity || 0})`,
      );
    }

    // Execute in atomic transaction: approval + inventory deduction + logging
    const result = await this.dataSource.transaction(async (manager) => {
      // Update job cart
      await manager.update(JobCart, id, {
        status: JobCartStatus.APPROVED,
        approved_by_id: user.id,
        approved_at: new Date(),
      });

      // Deduct inventory
      await manager.decrement(
        Inventory,
        { id: inventory.id },
        'quantity',
        jobCart.requested_quantity,
      );

      const newStockLevel = inventory.quantity - jobCart.requested_quantity;

      // Create approval log
      await this.autoLogger.log(
        {
          logType: LogType.JOB_CARD_APPROVED,
          actorId: user.id,
          description: `Job cart approved by ${user.role}`,
          workshopId: jobCart.workshop_id,
          userUnitId: jobCart.user_unit_id,
          entryId: jobCart.entry_id,
          jobCardId: jobCart.id,
          metadata: {
            spare_part_id: jobCart.spare_part_id,
            requested_quantity: jobCart.requested_quantity,
          },
        },
        manager,
      );

      // Create inventory deduction log
      await this.autoLogger.log(
        {
          logType: LogType.INVENTORY_DEDUCTED,
          actorId: user.id,
          description: `Inventory deducted for approved job cart`,
          workshopId: jobCart.workshop_id,
          jobCardId: jobCart.id,
          metadata: {
            spare_part_id: jobCart.spare_part_id,
            quantity_deducted: jobCart.requested_quantity,
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

    // Return updated job cart with inventory info
    const updatedJobCart = await this.findOne(id);
    return {
      ...updatedJobCart,
      inventory_deducted: {
        spare_part_id: jobCart.spare_part_id,
        quantity_deducted: jobCart.requested_quantity,
        new_stock_level: result.newStockLevel,
      },
    };
  }

  async reject(
    id: string,
    rejectDto: RejectJobCartDto,
    user: User,
  ): Promise<JobCart> {
    // Verify user is captain or OC
    if (user.role !== UserRole.CAPTAIN && user.role !== UserRole.OC) {
      throw new ForbiddenException('Only captain or OC can reject job carts');
    }

    const jobCart = await this.jobCartRepository.findOne({
      where: { id },
      relations: ['workshop', 'user_unit', 'entry'],
    });

    if (!jobCart) {
      throw new NotFoundException('Job cart not found');
    }

    // Verify user is assigned to the workshop
    if (
      user.role === UserRole.CAPTAIN &&
      jobCart.workshop.captain_id !== user.id
    ) {
      throw new ForbiddenException(
        'You are not assigned as captain for this workshop',
      );
    }

    if (user.role === UserRole.OC && jobCart.workshop.oc_id !== user.id) {
      throw new ForbiddenException(
        'You are not assigned as OC for this workshop',
      );
    }

    // Verify status is PENDING
    if (jobCart.status !== JobCartStatus.PENDING) {
      throw new BadRequestException(
        `Job cart must be PENDING to reject (current status: ${jobCart.status})`,
      );
    }

    // Update job cart
    jobCart.status = JobCartStatus.REJECTED;
    jobCart.rejected_by_id = user.id;
    jobCart.rejected_at = new Date();
    jobCart.rejection_reason = rejectDto.rejection_reason;

    const savedJobCart = await this.jobCartRepository.save(jobCart);

    // Auto-log rejection
    await this.autoLogger.log({
      logType: LogType.JOB_CARD_REJECTED,
      actorId: user.id,
      description: `Job cart rejected by ${user.role}`,
      workshopId: jobCart.workshop_id,
      userUnitId: jobCart.user_unit_id,
      entryId: jobCart.entry_id,
      jobCardId: jobCart.id,
      metadata: {
        rejection_reason: rejectDto.rejection_reason,
      },
    });

    return savedJobCart;
  }

  async veto(
    id: string,
    rejectDto: RejectJobCartDto,
    user: User,
  ): Promise<any> {
    // ONLY OC can veto
    if (user.role !== UserRole.OC) {
      throw new ForbiddenException('Only OC can veto job carts');
    }

    const jobCart = await this.jobCartRepository.findOne({
      where: { id },
      relations: ['workshop', 'spare_part', 'user_unit', 'entry'],
    });

    if (!jobCart) {
      throw new NotFoundException('Job cart not found');
    }

    // Verify user is assigned to the workshop
    if (jobCart.workshop.oc_id !== user.id) {
      throw new ForbiddenException(
        'You are not assigned as OC for this workshop',
      );
    }

    // Verify status is APPROVED (not ISSUED)
    if (jobCart.status !== JobCartStatus.APPROVED) {
      throw new BadRequestException(
        `Can only veto APPROVED job carts. Current status: ${jobCart.status}`,
      );
    }

    // Get inventory
    const inventory = await this.inventoryRepository.findOne({
      where: {
        workshop_id: jobCart.workshop_id,
        spare_part_id: jobCart.spare_part_id,
      },
    });

    if (!inventory) {
      throw new BadRequestException('Inventory record not found');
    }

    // Execute in atomic transaction: veto + inventory restoration + logging
    const result = await this.dataSource.transaction(async (manager) => {
      // Update job cart
      await manager.update(JobCart, id, {
        status: JobCartStatus.OC_VETOED,
        rejected_by_id: user.id,
        rejected_at: new Date(),
        rejection_reason: rejectDto.rejection_reason,
      });

      // Restore inventory
      await manager.increment(
        Inventory,
        { id: inventory.id },
        'quantity',
        jobCart.requested_quantity,
      );

      const newStockLevel = inventory.quantity + jobCart.requested_quantity;

      // Create veto log
      await this.autoLogger.log(
        {
          logType: LogType.JOB_CARD_VETOED,
          actorId: user.id,
          description: 'Job cart vetoed by OC',
          workshopId: jobCart.workshop_id,
          userUnitId: jobCart.user_unit_id,
          entryId: jobCart.entry_id,
          jobCardId: jobCart.id,
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
          description: 'Inventory restored after job cart veto',
          workshopId: jobCart.workshop_id,
          jobCardId: jobCart.id,
          metadata: {
            spare_part_id: jobCart.spare_part_id,
            quantity_restored: jobCart.requested_quantity,
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

    // Return updated job cart with inventory info
    const updatedJobCart = await this.findOne(id);
    return {
      ...updatedJobCart,
      inventory_restored: {
        spare_part_id: jobCart.spare_part_id,
        quantity_restored: jobCart.requested_quantity,
        new_stock_level: result.newStockLevel,
      },
    };
  }

  async issue(
    id: string,
    issueDto: IssueJobCartDto,
    user: User,
  ): Promise<JobCart> {
    // Verify user is store_man
    if (user.role !== UserRole.STORE_MAN) {
      throw new ForbiddenException('Only store managers can issue job carts');
    }

    const jobCart = await this.jobCartRepository.findOne({
      where: { id },
      relations: ['workshop', 'user_unit', 'entry'],
    });

    if (!jobCart) {
      throw new NotFoundException('Job cart not found');
    }

    // Verify user is assigned to the workshop
    if (jobCart.workshop.store_man_id !== user.id) {
      throw new ForbiddenException(
        'You are not assigned as store manager for this workshop',
      );
    }

    // Verify status is APPROVED
    if (jobCart.status !== JobCartStatus.APPROVED) {
      throw new BadRequestException(
        `Can only issue APPROVED job carts. Current status: ${jobCart.status}`,
      );
    }

    // Update job cart
    jobCart.status = JobCartStatus.ISSUED;
    jobCart.issued_by_id = user.id;
    jobCart.issued_at = new Date();
    if (issueDto.notes) {
      jobCart.notes = issueDto.notes;
    }

    const savedJobCart = await this.jobCartRepository.save(jobCart);

    // Auto-log issuance
    await this.autoLogger.log({
      logType: LogType.JOB_CARD_ISSUED,
      actorId: user.id,
      description: 'Job cart marked as issued by store manager',
      workshopId: jobCart.workshop_id,
      userUnitId: jobCart.user_unit_id,
      entryId: jobCart.entry_id,
      jobCardId: jobCart.id,
      metadata: {
        notes: issueDto.notes,
      },
    });

    return savedJobCart;
  }
}
