import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const inventory = this.inventoryRepository.create(createInventoryDto);
    return await this.inventoryRepository.save(inventory);
  }

  async findAll(workshopId?: string): Promise<Inventory[]> {
    const where: any = {};
    if (workshopId) {
      where.workshop_id = workshopId;
    }
    return await this.inventoryRepository.find({
      where,
      relations: ['workshop', 'spare_part'],
    });
  }

  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['workshop', 'spare_part'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return inventory;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    const inventory = await this.findOne(id);
    Object.assign(inventory, updateInventoryDto);
    return await this.inventoryRepository.save(inventory);
  }

  async remove(id: string): Promise<void> {
    await this.inventoryRepository.delete(id);
  }

  async adjustStock(id: string, quantity: number): Promise<Inventory> {
    const inventory = await this.findOne(id);
    inventory.quantity += quantity;

    if (inventory.quantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    return await this.inventoryRepository.save(inventory);
  }

  async getLowStock(workshopId: string): Promise<Inventory[]> {
    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.spare_part', 'spare_part')
      .where('inventory.workshop_id = :workshopId', { workshopId })
      .andWhere('inventory.quantity <= inventory.min_quantity')
      .getMany();
  }

  async consumeStock(id: string, quantity: number): Promise<Inventory> {
    return await this.adjustStock(id, -quantity);
  }

  async addStock(id: string, quantity: number): Promise<Inventory> {
    return await this.adjustStock(id, quantity);
  }
}
