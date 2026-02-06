import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLogBookDto } from './dto/create-log-book.dto';
import { UpdateLogBookDto } from './dto/update-log-book.dto';
import { LogBook } from './entities/log-book.entity';

@Injectable()
export class LogBookService {
  constructor(
    @InjectRepository(LogBook)
    private logBookRepository: Repository<LogBook>,
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

  async update(id: string, updateLogBookDto: UpdateLogBookDto): Promise<LogBook> {
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
}
