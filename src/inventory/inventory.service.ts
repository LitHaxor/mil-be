import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateStockUpdateRequestDto } from './dto/create-stock-update-request.dto';
import { Inventory } from './entities/inventory.entity';
import {
  StockUpdateRequest,
  StockUpdateStatus,
} from './entities/stock-update-request.entity';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(StockUpdateRequest)
    private stockUpdateRequestRepository: Repository<StockUpdateRequest>,
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

  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory> {
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

  // ─── Stock Update Request Flow (Store Man → OC approval) ──────────────────

  /**
   * Store Man submits a request to increase stock level.
   * The actual inventory quantity does NOT change until OC approves.
   */
  async createStockUpdateRequest(
    inventoryId: string,
    dto: CreateStockUpdateRequestDto,
    user: User,
  ): Promise<StockUpdateRequest> {
    if (
      user.role !== UserRole.STORE_MAN &&
      user.role !== UserRole.OC &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only store managers, OC, or admins can create stock update requests',
      );
    }

    const inventory = await this.findOne(inventoryId);

    const request = this.stockUpdateRequestRepository.create({
      inventory_id: inventoryId,
      spare_part_id: inventory.spare_part_id,
      workshop_id: inventory.workshop_id,
      quantity_to_add: dto.quantity_to_add,
      reason: dto.reason,
      requested_by_id: user.id,
      status: StockUpdateStatus.PENDING,
    });

    return await this.stockUpdateRequestRepository.save(request);
  }

  /**
   * List stock update requests. OC/Admin see all in their workshop; Store Man sees their own.
   */
  async getStockUpdateRequests(
    workshopId?: string,
    status?: StockUpdateStatus,
    requestedById?: string,
  ): Promise<StockUpdateRequest[]> {
    const where: any = {};
    if (workshopId) where.workshop_id = workshopId;
    if (status) where.status = status;
    if (requestedById) where.requested_by_id = requestedById;

    return await this.stockUpdateRequestRepository.find({
      where,
      relations: ['inventory', 'spare_part', 'requested_by', 'approved_by'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * OC or Admin approves a stock update request — inventory quantity increases.
   */
  async approveStockUpdateRequest(
    requestId: string,
    user: User,
  ): Promise<StockUpdateRequest> {
    if (user.role !== UserRole.OC && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only OC or Admin can approve stock update requests',
      );
    }

    const request = await this.stockUpdateRequestRepository.findOne({
      where: { id: requestId },
      relations: ['inventory'],
    });

    if (!request) {
      throw new NotFoundException(
        `Stock update request with ID ${requestId} not found`,
      );
    }

    if (request.status !== StockUpdateStatus.PENDING) {
      throw new BadRequestException(
        `Only pending requests can be approved. Current status: ${request.status}`,
      );
    }

    // Update inventory quantity
    await this.inventoryRepository.increment(
      { id: request.inventory_id },
      'quantity',
      request.quantity_to_add,
    );

    // Mark request as approved
    request.status = StockUpdateStatus.APPROVED;
    request.approved_by_id = user.id;
    request.approved_at = new Date();

    return await this.stockUpdateRequestRepository.save(request);
  }

  /**
   * OC or Admin rejects a stock update request — inventory is unchanged.
   */
  async rejectStockUpdateRequest(
    requestId: string,
    rejectionReason: string,
    user: User,
  ): Promise<StockUpdateRequest> {
    if (user.role !== UserRole.OC && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only OC or Admin can reject stock update requests',
      );
    }

    const request = await this.stockUpdateRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(
        `Stock update request with ID ${requestId} not found`,
      );
    }

    if (request.status !== StockUpdateStatus.PENDING) {
      throw new BadRequestException(
        `Only pending requests can be rejected. Current status: ${request.status}`,
      );
    }

    request.status = StockUpdateStatus.REJECTED;
    request.approved_by_id = user.id;
    request.rejection_reason = rejectionReason;

    return await this.stockUpdateRequestRepository.save(request);
  }
}
