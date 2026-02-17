import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLogBookDto } from './dto/create-log-book.dto';
import { UpdateLogBookDto } from './dto/update-log-book.dto';
import { LogBook } from './entities/log-book.entity';
import { UserUnit } from '../user-unit/entities/user-unit.entity';
import { Workshop } from '../workshop/entities/workshop.entity';

@Injectable()
export class LogBookService {
  constructor(
    @InjectRepository(LogBook)
    private logBookRepository: Repository<LogBook>,
    @InjectRepository(UserUnit)
    private userUnitRepository: Repository<UserUnit>,
    @InjectRepository(Workshop)
    private workshopRepository: Repository<Workshop>,
  ) {}

  async create(createLogBookDto: CreateLogBookDto): Promise<LogBook> {
    const log = this.logBookRepository.create(createLogBookDto);
    return await this.logBookRepository.save(log);
  }

  async findAll(userUnitId?: string): Promise<LogBook[]> {
    const where: any = {};
    if (userUnitId) where.user_unit_id = userUnitId;

    return await this.logBookRepository.find({
      where,
      relations: ['user_unit', 'performed_by'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LogBook> {
    const log = await this.logBookRepository.findOne({
      where: { id },
      relations: ['user_unit', 'performed_by'],
    });

    if (!log) {
      throw new NotFoundException(`LogBook entry with ID ${id} not found`);
    }

    return log;
  }

  async update(
    id: string,
    updateLogBookDto: UpdateLogBookDto,
  ): Promise<LogBook> {
    const log = await this.findOne(id);
    Object.assign(log, updateLogBookDto);
    return await this.logBookRepository.save(log);
  }

  async remove(id: string): Promise<void> {
    await this.logBookRepository.delete(id);
  }

  async getLogsByUserUnit(userUnitId: string): Promise<LogBook[]> {
    return await this.findAll(userUnitId);
  }

  async getWorkshopHistory(userUnitId: string): Promise<any> {
    const userUnit = await this.userUnitRepository.findOne({
      where: { id: userUnitId },
      select: ['workshop_history', 'id'],
    });

    if (!userUnit) {
      throw new NotFoundException(`UserUnit with ID ${userUnitId} not found`);
    }

    const workshopHistory = userUnit.workshop_history || [];

    // Enrich workshop history with workshop names if not already present
    const enrichedHistory = await Promise.all(
      workshopHistory.map(async (history) => {
        if (!history.workshop_name && history.workshop_id) {
          const workshop = await this.workshopRepository.findOne({
            where: { id: history.workshop_id },
            select: ['name', 'id'],
          });
          if (workshop) {
            history.workshop_name = workshop.name;
          }
        }
        return history;
      }),
    );

    return enrichedHistory;
  }
}
