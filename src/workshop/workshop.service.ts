import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { Workshop } from './entities/workshop.entity';

@Injectable()
export class WorkshopService {
  constructor(
    @InjectRepository(Workshop)
    private workshopRepository: Repository<Workshop>,
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
      .loadRelationCountAndMap('workshop._count.users', 'workshop.users')
      .loadRelationCountAndMap('workshop._count.units', 'workshop.user_units')
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
      _count: workshop._count || { users: 0, units: 0 },
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
}
