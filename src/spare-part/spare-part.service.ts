import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { SparePartTemplate } from './entities/spare-part-template.entity';

@Injectable()
export class SparePartService {
  constructor(
    @InjectRepository(SparePartTemplate)
    private sparePartRepository: Repository<SparePartTemplate>,
  ) {}

  async create(createSparePartDto: CreateSparePartDto): Promise<SparePartTemplate> {
    const sparePart = this.sparePartRepository.create(createSparePartDto);
    return await this.sparePartRepository.save(sparePart);
  }

  async findAll(equipmentType?: string): Promise<SparePartTemplate[]> {
    const where: any = {};
    if (equipmentType) {
      where.equipment_type = equipmentType;
    }
    return await this.sparePartRepository.find({ where });
  }

  async findOne(id: string): Promise<SparePartTemplate> {
    const sparePart = await this.sparePartRepository.findOne({ where: { id } });
    if (!sparePart) {
      throw new NotFoundException(`SparePart with ID ${id} not found`);
    }
    return sparePart;
  }

  async update(id: string, updateSparePartDto: UpdateSparePartDto): Promise<SparePartTemplate> {
    const sparePart = await this.findOne(id);
    Object.assign(sparePart, updateSparePartDto);
    return await this.sparePartRepository.save(sparePart);
  }

  async remove(id: string): Promise<void> {
    await this.sparePartRepository.delete(id);
  }

  async searchByName(name: string): Promise<SparePartTemplate[]> {
    return await this.sparePartRepository
      .createQueryBuilder('spare_part')
      .where('spare_part.name ILIKE :name', { name: `%${name}%` })
      .getMany();
  }
}
