import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { SparePartTemplate } from './entities/spare-part-template.entity';

@Injectable()
export class SparePartService {
  constructor(
    @InjectRepository(SparePartTemplate)
    private sparePartRepository: Repository<SparePartTemplate>,
    private dataSource: DataSource,
  ) {}

  async create(
    createSparePartDto: CreateSparePartDto,
  ): Promise<SparePartTemplate> {
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

  async update(
    id: string,
    updateSparePartDto: UpdateSparePartDto,
  ): Promise<SparePartTemplate> {
    const sparePart = await this.findOne(id);
    Object.assign(sparePart, updateSparePartDto);
    return await this.sparePartRepository.save(sparePart);
  }

  async remove(id: string): Promise<void> {
    // Verify exists first
    await this.findOne(id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Nullify spare_part_id in job_carts (preserve historical job records)
      await queryRunner.query(
        `UPDATE "job_carts" SET "spare_part_id" = NULL WHERE "spare_part_id" = $1`,
        [id],
      );

      // Nullify spare_part_id in consume_requests (preserve historical request records)
      await queryRunner.query(
        `UPDATE "consume_requests" SET "spare_part_id" = NULL WHERE "spare_part_id" = $1`,
        [id],
      );

      // Nullify spare_part_id in source_requests (preserve historical sourcing records)
      await queryRunner.query(
        `UPDATE "source_requests" SET "spare_part_id" = NULL WHERE "spare_part_id" = $1`,
        [id],
      );

      // Delete inventory rows for this spare part (inventory without a part is meaningless)
      await queryRunner.query(
        `DELETE FROM "inventory" WHERE "spare_part_id" = $1`,
        [id],
      );

      // Delete the spare part template using raw SQL (avoids TypeORM DeleteQueryBuilder bug)
      await queryRunner.query(
        `DELETE FROM "spare_part_templates" WHERE "id" = $1`,
        [id],
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async searchByName(name: string): Promise<SparePartTemplate[]> {
    return await this.sparePartRepository
      .createQueryBuilder('spare_part')
      .where('spare_part.name ILIKE :name', { name: `%${name}%` })
      .getMany();
  }
}
