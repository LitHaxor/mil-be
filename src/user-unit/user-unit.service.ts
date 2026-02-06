import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserUnitDto } from './dto/create-user-unit.dto';
import { UpdateUserUnitDto } from './dto/update-user-unit.dto';
import { UserUnit, UnitStatus } from './entities/user-unit.entity';

@Injectable()
export class UserUnitService {
  constructor(
    @InjectRepository(UserUnit)
    private userUnitRepository: Repository<UserUnit>,
  ) {}

  async create(createUserUnitDto: CreateUserUnitDto): Promise<UserUnit> {
    const userUnit = this.userUnitRepository.create({
      ...createUserUnitDto,
      entered_at: new Date(),
      status: UnitStatus.IN_WORKSHOP,
    });
    return await this.userUnitRepository.save(userUnit);
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

  async update(id: string, updateUserUnitDto: UpdateUserUnitDto): Promise<UserUnit> {
    const userUnit = await this.findOne(id);

    // Handle status-related timestamps
    if (updateUserUnitDto.status && updateUserUnitDto.status !== userUnit.status) {
      if (updateUserUnitDto.status === UnitStatus.EXITED) {
        userUnit.exited_at = new Date();
      } else if (updateUserUnitDto.status === UnitStatus.UNDER_MAINTENANCE) {
        userUnit.last_maintenance_at = new Date();
      }
    }

    Object.assign(userUnit, updateUserUnitDto);
    return await this.userUnitRepository.save(userUnit);
  }

  async updateStatus(id: string, status: UnitStatus): Promise<UserUnit> {
    const userUnit = await this.findOne(id);
    userUnit.status = status;

    if (status === UnitStatus.EXITED) {
      userUnit.exited_at = new Date();
    } else if (status === UnitStatus.UNDER_MAINTENANCE) {
      userUnit.last_maintenance_at = new Date();
    }

    return await this.userUnitRepository.save(userUnit);
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
