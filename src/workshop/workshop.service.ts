import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { Workshop } from './entities/workshop.entity';
import { ConsumeRequest } from '../consume-request/entities/consume-request.entity';
import { UserUnit } from '../user-unit/entities/user-unit.entity';
import { User, UserRole } from '../entities/user.entity';

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
  ) {}

  async create(createWorkshopDto: CreateWorkshopDto, createdById?: string): Promise<Workshop> {
    const workshop = this.workshopRepository.create({
      ...createWorkshopDto,
      created_by_id: createdById,
    });
    return await this.workshopRepository.save(workshop);
  }

  async findAll(userId?: string, userRole?: string): Promise<any[]> {
    const queryBuilder = this.workshopRepository
      .createQueryBuilder('workshop')
      .leftJoinAndSelect('workshop.owner', 'owner')
      .loadRelationCountAndMap('workshop.usersCount', 'workshop.users')
      .loadRelationCountAndMap('workshop.unitsCount', 'workshop.user_units')
      .where('workshop.is_active = :isActive', { isActive: true });

    // If user is an inspector, only show workshops they're assigned to
    if (userRole === 'inspector' && userId) {
      queryBuilder
        .innerJoin('workshop.users', 'user')
        .andWhere('user.id = :userId', { userId });
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
      owner: workshop.owner ? {
        id: workshop.owner.id,
        email: workshop.owner.email,
        full_name: workshop.owner.full_name,
      } : null,
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

  async update(id: string, updateWorkshopDto: UpdateWorkshopDto): Promise<Workshop> {
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

    return workshop.users?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    })) || [];
  }

  async getDashboardAnalytics(workshopId: string) {
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
      .addSelect(`SUM(CASE WHEN cr.status = 'approved' THEN 1 ELSE 0 END)`, 'approved')
      .addSelect(`SUM(CASE WHEN cr.status = 'rejected' THEN 1 ELSE 0 END)`, 'rejected')
      .addSelect(`SUM(CASE WHEN cr.status = 'pending' THEN 1 ELSE 0 END)`, 'pending')
      .innerJoin('cr.user_unit', 'unit')
      .where('unit.workshop_id = :workshopId', { workshopId })
      .andWhere('cr.created_at >= NOW() - INTERVAL \'6 months\'')
      .groupBy(`TO_CHAR(cr.created_at, 'YYYY-MM')`)
      .orderBy('month', 'ASC')
      .getRawMany();

    // 4. Active inspectors assigned to this workshop
    const inspectors = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.full_name', 'user.email', 'user.is_active', 'user.updated_at'])
      .where('user.workshop_id = :workshopId', { workshopId })
      .andWhere('user.role = :role', { role: UserRole.INSPECTOR })
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
      topConsumed: topConsumed.map(item => ({
        spare_part_id: item.spare_part_id,
        name: item.name,
        part_number: item.part_number,
        total_consumed: Number(item.total_consumed),
        request_count: Number(item.request_count),
      })),
      maintenanceStats: maintenanceStats.map(item => ({
        unit_type: item.unit_type,
        total_units: Number(item.total_units),
        avg_days: Math.round(Number(item.avg_days) * 10) / 10,
      })),
      monthlyTrends: monthlyTrends.map(item => ({
        month: item.month,
        total_requests: Number(item.total_requests),
        approved: Number(item.approved),
        rejected: Number(item.rejected),
        pending: Number(item.pending),
      })),
      inspectors: inspectors.map(i => ({
        id: i.id,
        full_name: i.full_name,
        email: i.email,
        is_active: i.is_active,
      })),
      unitStatusBreakdown: unitStatusBreakdown.map(item => ({
        status: item.status || 'unknown',
        count: Number(item.count),
      })),
    };
  }
}
