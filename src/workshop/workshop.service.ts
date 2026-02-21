import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { Workshop } from './entities/workshop.entity';
import { ConsumeRequest } from '../consume-request/entities/consume-request.entity';
import { UserUnit } from '../user-unit/entities/user-unit.entity';
import { User, UserRole } from '../entities/user.entity';
import { AutoLoggerService } from '../log-book/services/auto-logger.service';
import { LogType } from '../log-book/entities/log-book.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

@Injectable()
export class WorkshopService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopRepository: Repository<Workshop>,
    @InjectRepository(ConsumeRequest)
    private readonly consumeRequestRepository: Repository<ConsumeRequest>,
    @InjectRepository(UserUnit)
    private readonly userUnitRepository: Repository<UserUnit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly dataSource: DataSource,
    private readonly autoLogger: AutoLoggerService,
  ) { }

  async create(
    createWorkshopDto: CreateWorkshopDto,
    createdById?: string,
  ): Promise<Workshop> {
    const workshopData = {
      ...createWorkshopDto,
      ...(createdById && { created_by_id: createdById }),
    };
    const workshop = this.workshopRepository.create(workshopData);
    return await this.workshopRepository.save(workshop);
  }

  async findAll(userId?: string, userRole?: string): Promise<any[]> {
    const queryBuilder = this.workshopRepository
      .createQueryBuilder('workshop')
      .leftJoinAndSelect('workshop.owner', 'owner')
      .loadRelationCountAndMap('workshop.usersCount', 'workshop.users')
      .loadRelationCountAndMap('workshop.unitsCount', 'workshop.user_units')
      .where('workshop.is_active = :isActive', { isActive: true });

    // Non-admin, non-captain roles: only show the workshop they're assigned to
    const restrictedRoles = [
      UserRole.OC,
      UserRole.INSPECTOR_RI_AND_I,
      UserRole.STORE_MAN,
    ];
    if (restrictedRoles.includes(userRole as UserRole) && userId) {
      // Filter to only the workshop where this user's workshop_id matches
      queryBuilder.innerJoin(
        'workshop.users',
        'assignedUser',
        'assignedUser.id = :userId',
        { userId },
      );
    }

    const workshops = await queryBuilder.getMany();

    return workshops.map((workshop: any) => ({
      id: workshop.id,
      name: workshop.name,
      address: workshop.address,
      division: workshop.division,
      description: workshop.description,
      created_by_id: workshop.created_by_id,
      created_at: workshop.created_at,
      updated_at: workshop.updated_at,
      owner: workshop.owner
        ? {
          id: workshop.owner.id,
          email: workshop.owner.email,
          full_name: workshop.owner.full_name,
        }
        : null,
      _count: {
        users: workshop.usersCount || 0,
        units: workshop.unitsCount || 0,
      },
    }));
  }

  async findOne(id: string): Promise<Workshop> {
    const workshop = await this.workshopRepository.findOne({
      where: { id, is_active: true },
      relations: ['users', 'user_units', 'inventory_items'],
    });

    if (!workshop) {
      throw new NotFoundException(`Workshop with ID ${id} not found`);
    }

    return workshop;
  }

  async update(
    id: string,
    updateWorkshopDto: UpdateWorkshopDto,
  ): Promise<Workshop> {
    const workshop = await this.findOne(id);
    Object.assign(workshop, updateWorkshopDto);
    return await this.workshopRepository.save(workshop);
  }

  async remove(id: string): Promise<void> {
    const workshop = await this.findOne(id);
    workshop.is_active = false;
    await this.workshopRepository.save(workshop);
  }

  async getWorkshopStats(id: string) {
    const workshop = await this.findOne(id);

    return {
      workshop,
      stats: {
        total_units: workshop.user_units?.length || 0,
        total_inventory: workshop.inventory_items?.length || 0,
        total_users: workshop.users?.length || 0,
      },
    };
  }

  async getWorkshopUsers(id: string) {
    const workshop = await this.workshopRepository
      .createQueryBuilder('workshop')
      .leftJoinAndSelect('workshop.users', 'users')
      .where('workshop.id = :id', { id })
      .andWhere('workshop.is_active = :isActive', { isActive: true })
      .getOne();

    if (!workshop) {
      throw new NotFoundException(`Workshop with ID ${id} not found`);
    }

    return (
      workshop.users?.map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
      })) || []
    );
  }

  async getDashboardAnalytics(workshopId: string) {
    // 0. Stat card counts
    const activeUnits = await this.userUnitRepository
      .createQueryBuilder('unit')
      .where('unit.workshop_id = :workshopId', { workshopId })
      .andWhere('unit.status IN (:...statuses)', {
        statuses: ['in_workshop', 'under_maintenance'],
      })
      .getCount();

    const inventoryCount = await this.inventoryRepository
      .createQueryBuilder('inv')
      .where('inv.workshop_id = :workshopId', { workshopId })
      .getCount();

    const lowStockCount = await this.inventoryRepository
      .createQueryBuilder('inv')
      .where('inv.workshop_id = :workshopId', { workshopId })
      .andWhere('inv.quantity <= inv.min_quantity')
      .getCount();

    const pendingRequests = await this.consumeRequestRepository
      .createQueryBuilder('cr')
      .innerJoin('cr.user_unit', 'unit')
      .where('unit.workshop_id = :workshopId', { workshopId })
      .andWhere('cr.status = :status', { status: 'pending' })
      .getCount();

    // 1. Top consumed spare parts (by approved consume requests)
    const topConsumed = await this.consumeRequestRepository
      .createQueryBuilder('cr')
      .select('cr.spare_part_id', 'spare_part_id')
      .addSelect('sp.name', 'name')
      .addSelect('sp.part_number', 'part_number')
      .addSelect('SUM(cr.requested_quantity)', 'total_consumed')
      .addSelect('COUNT(cr.id)', 'request_count')
      .innerJoin('cr.spare_part', 'sp')
      .innerJoin('cr.user_unit', 'unit')
      .where('unit.workshop_id = :workshopId', { workshopId })
      .andWhere('cr.status = :status', { status: 'approved' })
      .groupBy('cr.spare_part_id')
      .addGroupBy('sp.name')
      .addGroupBy('sp.part_number')
      .orderBy('total_consumed', 'DESC')
      .limit(6)
      .getRawMany();

    // 2. Unit maintenance stats (avg time in workshop for completed units)
    const maintenanceStats = await this.userUnitRepository
      .createQueryBuilder('unit')
      .select('unit.unit_type', 'unit_type')
      .addSelect('COUNT(unit.id)', 'total_units')
      .addSelect(
        `AVG(EXTRACT(EPOCH FROM (COALESCE(unit.exited_at, NOW()) - unit.entered_at)) / 86400)`,
        'avg_days',
      )
      .where('unit.workshop_id = :workshopId', { workshopId })
      .andWhere('unit.entered_at IS NOT NULL')
      .groupBy('unit.unit_type')
      .getRawMany();

    // 3. Monthly consume request trends (last 6 months)
    const monthlyTrends = await this.consumeRequestRepository
      .createQueryBuilder('cr')
      .select(`TO_CHAR(cr.created_at, 'YYYY-MM')`, 'month')
      .addSelect('COUNT(cr.id)', 'total_requests')
      .addSelect(
        `SUM(CASE WHEN cr.status = 'approved' THEN 1 ELSE 0 END)`,
        'approved',
      )
      .addSelect(
        `SUM(CASE WHEN cr.status = 'rejected' THEN 1 ELSE 0 END)`,
        'rejected',
      )
      .addSelect(
        `SUM(CASE WHEN cr.status = 'pending' THEN 1 ELSE 0 END)`,
        'pending',
      )
      .innerJoin('cr.user_unit', 'unit')
      .where('unit.workshop_id = :workshopId', { workshopId })
      .andWhere("cr.created_at >= NOW() - INTERVAL '6 months'")
      .groupBy(`TO_CHAR(cr.created_at, 'YYYY-MM')`)
      .orderBy('month', 'ASC')
      .getRawMany();

    // 4. Active inspectors assigned to this workshop
    const inspectors = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.full_name',
        'user.email',
        'user.is_active',
        'user.updated_at',
      ])
      .where('user.workshop_id = :workshopId', { workshopId })
      .andWhere('user.role = :role', { role: UserRole.INSPECTOR_RI_AND_I })
      .andWhere('user.is_active = :isActive', { isActive: true })
      .getMany();

    // 5. Unit status breakdown
    const unitStatusBreakdown = await this.userUnitRepository
      .createQueryBuilder('unit')
      .select('unit.status', 'status')
      .addSelect('COUNT(unit.id)', 'count')
      .where('unit.workshop_id = :workshopId', { workshopId })
      .groupBy('unit.status')
      .getRawMany();

    return {
      // Stat card counts
      activeUnits,
      inventoryCount,
      pendingRequests,
      lowStockCount,
      // Chart data
      topConsumed: topConsumed.map((item) => ({
        spare_part_id: item.spare_part_id,
        name: item.name,
        part_number: item.part_number,
        total_consumed: Number(item.total_consumed),
        request_count: Number(item.request_count),
      })),
      maintenanceStats: maintenanceStats.map((item) => ({
        unit_type: item.unit_type,
        total_units: Number(item.total_units),
        avg_days: Math.round(Number(item.avg_days) * 10) / 10,
      })),
      monthlyTrends: monthlyTrends.map((item) => ({
        month: item.month,
        total_requests: Number(item.total_requests),
        approved: Number(item.approved),
        rejected: Number(item.rejected),
        pending: Number(item.pending),
      })),
      inspectors: inspectors.map((i) => ({
        id: i.id,
        full_name: i.full_name,
        email: i.email,
        is_active: i.is_active,
      })),
      unitStatusBreakdown: unitStatusBreakdown.map((item) => ({
        status: item.status || 'unknown',
        count: Number(item.count),
      })),
    };
  }

  async assignRoles(
    workshopId: string,
    assignRolesDto: AssignRolesDto,
    actorId: string,
  ): Promise<Workshop> {
    const workshop = await this.workshopRepository.findOne({
      where: { id: workshopId },
    });

    if (!workshop) {
      throw new NotFoundException(`Workshop with ID ${workshopId} not found`);
    }

    // Track previous assignments for logging
    const previousAssignments = {
      inspector_id: workshop.inspector_id,
      store_man_id: workshop.store_man_id,
      captain_id: workshop.captain_id,
      oc_id: workshop.oc_id,
    };

    // Validate and prepare role assignments in a transaction
    await this.dataSource.transaction(async (manager) => {
      const logs: Array<{ logType: LogType; description: string }> = [];

      // Helper: clear a role — nulls the workshop's role field AND the old user's workshop_id
      const clearRole = async (
        oldUserId: string | null | undefined,
        roleField: keyof typeof previousAssignments,
      ) => {
        if (oldUserId) {
          // Clear old user's workshop_id
          await manager.update(User, oldUserId, { workshop_id: null as any });
        }
        // Null out the workshop's role slot
        (workshop as any)[roleField] = null;
      };

      // ── INSPECTOR ──────────────────────────────────────────────────────
      if (Object.prototype.hasOwnProperty.call(assignRolesDto, 'inspector_id')) {
        if (assignRolesDto.inspector_id === null) {
          // Explicitly unassigning
          await clearRole(previousAssignments.inspector_id, 'inspector_id');
          logs.push({
            logType: LogType.WORKSHOP_ASSIGNED_INSPECTOR,
            description: `Inspector unassigned (was ${previousAssignments.inspector_id || 'none'})`,
          });
        } else {
          // Assigning a new inspector
          const inspector = await manager.findOne(User, {
            where: { id: assignRolesDto.inspector_id },
          });

          if (!inspector) {
            throw new NotFoundException(
              `Inspector with ID ${assignRolesDto.inspector_id} not found`,
            );
          }

          if (inspector.role !== UserRole.INSPECTOR_RI_AND_I) {
            throw new BadRequestException(
              'User must have INSPECTOR_RI_AND_I role to be assigned as inspector',
            );
          }

          // Clear previous inspector's workshop_id
          if (
            previousAssignments.inspector_id &&
            previousAssignments.inspector_id !== assignRolesDto.inspector_id
          ) {
            await manager.update(User, previousAssignments.inspector_id, {
              workshop_id: null as any,
            });
          }

          workshop.inspector_id = assignRolesDto.inspector_id!;
          await manager.update(User, assignRolesDto.inspector_id!, {
            workshop_id: workshopId,
          });

          logs.push({
            logType: LogType.WORKSHOP_ASSIGNED_INSPECTOR,
            description: `Inspector reassigned from ${previousAssignments.inspector_id || 'none'} to ${assignRolesDto.inspector_id}`,
          });
        }
      }

      // ── STORE MAN ──────────────────────────────────────────────────────
      if (Object.prototype.hasOwnProperty.call(assignRolesDto, 'store_man_id')) {
        if (assignRolesDto.store_man_id === null) {
          await clearRole(previousAssignments.store_man_id, 'store_man_id');
          logs.push({
            logType: LogType.WORKSHOP_ASSIGNED_STORE_MAN,
            description: `Store Man unassigned (was ${previousAssignments.store_man_id || 'none'})`,
          });
        } else {
          const storeMan = await manager.findOne(User, {
            where: { id: assignRolesDto.store_man_id },
          });

          if (!storeMan) {
            throw new NotFoundException(
              `Store Man with ID ${assignRolesDto.store_man_id} not found`,
            );
          }

          if (storeMan.role !== UserRole.STORE_MAN) {
            throw new BadRequestException(
              'User must have STORE_MAN role to be assigned as store manager',
            );
          }

          // Clear previous store_man's workshop_id
          if (
            previousAssignments.store_man_id &&
            previousAssignments.store_man_id !== assignRolesDto.store_man_id
          ) {
            await manager.update(User, previousAssignments.store_man_id, {
              workshop_id: null as any,
            });
          }

          workshop.store_man_id = assignRolesDto.store_man_id!;
          await manager.update(User, assignRolesDto.store_man_id!, {
            workshop_id: workshopId,
          });

          logs.push({
            logType: LogType.WORKSHOP_ASSIGNED_STORE_MAN,
            description: `Store Man reassigned from ${previousAssignments.store_man_id || 'none'} to ${assignRolesDto.store_man_id}`,
          });
        }
      }

      // ── CAPTAIN ────────────────────────────────────────────────────────
      if (Object.prototype.hasOwnProperty.call(assignRolesDto, 'captain_id')) {
        if (assignRolesDto.captain_id === null) {
          await clearRole(previousAssignments.captain_id, 'captain_id');
          logs.push({
            logType: LogType.WORKSHOP_ASSIGNED_CAPTAIN,
            description: `Captain unassigned (was ${previousAssignments.captain_id || 'none'})`,
          });
        } else {
          const captain = await manager.findOne(User, {
            where: { id: assignRolesDto.captain_id },
          });

          if (!captain) {
            throw new NotFoundException(
              `Captain with ID ${assignRolesDto.captain_id} not found`,
            );
          }

          if (captain.role !== UserRole.CAPTAIN) {
            throw new BadRequestException(
              'User must have CAPTAIN role to be assigned as captain',
            );
          }

          // Clear previous captain's workshop_id
          if (
            previousAssignments.captain_id &&
            previousAssignments.captain_id !== assignRolesDto.captain_id
          ) {
            await manager.update(User, previousAssignments.captain_id, {
              workshop_id: null as any,
            });
          }

          workshop.captain_id = assignRolesDto.captain_id!;
          await manager.update(User, assignRolesDto.captain_id!, {
            workshop_id: workshopId,
          });

          logs.push({
            logType: LogType.WORKSHOP_ASSIGNED_CAPTAIN,
            description: `Captain reassigned from ${previousAssignments.captain_id || 'none'} to ${assignRolesDto.captain_id}`,
          });
        }
      }

      // ── OC ─────────────────────────────────────────────────────────────
      if (Object.prototype.hasOwnProperty.call(assignRolesDto, 'oc_id')) {
        if (assignRolesDto.oc_id === null) {
          await clearRole(previousAssignments.oc_id, 'oc_id');
          logs.push({
            logType: LogType.WORKSHOP_ASSIGNED_OC,
            description: `OC unassigned (was ${previousAssignments.oc_id || 'none'})`,
          });
        } else {
          const oc = await manager.findOne(User, {
            where: { id: assignRolesDto.oc_id },
          });

          if (!oc) {
            throw new NotFoundException(
              `OC with ID ${assignRolesDto.oc_id} not found`,
            );
          }

          if (oc.role !== UserRole.OC) {
            throw new BadRequestException(
              'User must have OC role to be assigned as OC',
            );
          }

          // Clear previous OC's workshop_id
          if (
            previousAssignments.oc_id &&
            previousAssignments.oc_id !== assignRolesDto.oc_id
          ) {
            await manager.update(User, previousAssignments.oc_id, {
              workshop_id: null as any,
            });
          }

          workshop.oc_id = assignRolesDto.oc_id!;
          await manager.update(User, assignRolesDto.oc_id!, {
            workshop_id: workshopId,
          });

          logs.push({
            logType: LogType.WORKSHOP_ASSIGNED_OC,
            description: `OC reassigned from ${previousAssignments.oc_id || 'none'} to ${assignRolesDto.oc_id}`,
          });
        }
      }

      // Save workshop
      await manager.save(Workshop, workshop);

      // Create logs for all assignments
      for (const log of logs) {
        await this.autoLogger.log(
          {
            logType: log.logType,
            actorId,
            description: log.description,
            workshopId,
          },
          manager,
        );
      }
    });

    // Return updated workshop with relationships
    const updatedWorkshop = await this.workshopRepository.findOne({
      where: { id: workshopId },
      relations: ['inspector', 'store_man', 'captain', 'oc'],
    });

    if (!updatedWorkshop) {
      throw new NotFoundException(`Workshop with ID ${workshopId} not found`);
    }

    return updatedWorkshop;
  }

  async assignUser(
    workshopId: string,
    userId: string,
    actorId: string,
  ): Promise<{ message: string }> {
    const workshop = await this.workshopRepository.findOne({
      where: { id: workshopId },
    });
    if (!workshop) {
      throw new NotFoundException(`Workshop with ID ${workshopId} not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Map user role → workshop role field
    const roleToField: Partial<Record<UserRole, string>> = {
      [UserRole.INSPECTOR_RI_AND_I]: 'inspector_id',
      [UserRole.STORE_MAN]: 'store_man_id',
      [UserRole.CAPTAIN]: 'captain_id',
      [UserRole.OC]: 'oc_id',
    };
    const roleField = roleToField[user.role];

    await this.dataSource.transaction(async (manager) => {
      // If this role slot is occupied by a DIFFERENT user, clear their workshop_id
      if (roleField) {
        const previousUserId = (workshop as any)[roleField];
        if (previousUserId && previousUserId !== userId) {
          await manager.update(User, previousUserId, {
            workshop_id: null as any,
          });
        }
        // Set role slot on workshop
        (workshop as any)[roleField] = userId;
        await manager.save(Workshop, workshop);
      }

      // Set user's workshop_id
      await manager.update(User, userId, { workshop_id: workshopId });
    });

    return { message: 'User assigned successfully' };
  }

  async unassignRole(
    workshopId: string,
    userId: string,
    actorId: string,
  ): Promise<{ message: string }> {
    const workshop = await this.workshopRepository.findOne({
      where: { id: workshopId },
    });

    if (!workshop) {
      throw new NotFoundException(`Workshop with ID ${workshopId} not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Determine which role field this user occupies and clear it
    const roleFieldMap: Record<string, string> = {
      inspector_id: 'inspector_id',
      store_man_id: 'store_man_id',
      captain_id: 'captain_id',
      oc_id: 'oc_id',
    };

    let clearedRole: string | null = null;
    for (const field of Object.keys(roleFieldMap)) {
      if ((workshop as any)[field] === userId) {
        (workshop as any)[field] = null;
        clearedRole = field;
        break;
      }
    }

    await this.dataSource.transaction(async (manager) => {
      // Clear user's workshop_id
      await manager.update(User, userId, { workshop_id: null as any });

      // Save workshop with cleared role slot
      await manager.save(Workshop, workshop);

      if (clearedRole) {
        await this.autoLogger.log(
          {
            logType: LogType.WORKSHOP_ASSIGNED_INSPECTOR,
            actorId,
            description: `User ${userId} unassigned from ${clearedRole} in workshop ${workshopId}`,
            workshopId,
          },
          manager,
        );
      }
    });

    return { message: 'User unassigned successfully' };
  }

  async getWorkshopReadiness(workshopId: string): Promise<any> {
    const workshop = await this.workshopRepository.findOne({
      where: { id: workshopId },
      relations: ['inspector', 'store_man', 'captain', 'oc'],
    });

    if (!workshop) {
      throw new NotFoundException(`Workshop with ID ${workshopId} not found`);
    }

    const missingRoles: string[] = [];
    if (!workshop.inspector_id) missingRoles.push('inspector');
    if (!workshop.store_man_id) missingRoles.push('store_man');
    if (!workshop.captain_id) missingRoles.push('captain');
    if (!workshop.oc_id) missingRoles.push('oc');

    const isReady = missingRoles.length === 0;

    return {
      workshop_id: workshopId,
      is_ready: isReady,
      assigned_roles: {
        inspector: workshop.inspector
          ? { id: workshop.inspector.id, name: workshop.inspector.full_name }
          : null,
        store_man: workshop.store_man
          ? { id: workshop.store_man.id, name: workshop.store_man.full_name }
          : null,
        captain: workshop.captain
          ? { id: workshop.captain.id, name: workshop.captain.full_name }
          : null,
        oc: workshop.oc
          ? { id: workshop.oc.id, name: workshop.oc.full_name }
          : null,
      },
      missing_roles: missingRoles,
    };
  }
}
