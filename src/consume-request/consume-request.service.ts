import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConsumeRequestDto } from './dto/create-consume-request.dto';
import { UpdateConsumeRequestDto } from './dto/update-consume-request.dto';
import { ConsumeRequest, RequestStatus } from './entities/consume-request.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { LogBookService } from '../log-book/log-book.service';
import { LogType } from '../log-book/entities/log-book.entity';

@Injectable()
export class ConsumeRequestService {
  constructor(
    @InjectRepository(ConsumeRequest)
    private consumeRequestRepository: Repository<ConsumeRequest>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private readonly logBookService: LogBookService,
  ) {}

  async create(createConsumeRequestDto: CreateConsumeRequestDto): Promise<ConsumeRequest> {
    const request = this.consumeRequestRepository.create(createConsumeRequestDto);
    return await this.consumeRequestRepository.save(request);
  }

  async findAll(userUnitId?: string, status?: RequestStatus): Promise<ConsumeRequest[]> {
    const where: any = {};
    if (userUnitId) where.user_unit_id = userUnitId;
    if (status) where.status = status;

    return await this.consumeRequestRepository.find({
      where,
      relations: ['user_unit', 'spare_part', 'requested_by', 'approved_by'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ConsumeRequest> {
    const request = await this.consumeRequestRepository.findOne({
      where: { id },
      relations: ['user_unit', 'spare_part', 'requested_by', 'approved_by'],
    });

    if (!request) {
      throw new NotFoundException(`ConsumeRequest with ID ${id} not found`);
    }

    return request;
  }

  async update(id: string, updateConsumeRequestDto: UpdateConsumeRequestDto): Promise<ConsumeRequest> {
    const request = await this.findOne(id);
    Object.assign(request, updateConsumeRequestDto);
    return await this.consumeRequestRepository.save(request);
  }

  async approve(id: string, approvedById: string): Promise<ConsumeRequest> {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    // Find the inventory item for this spare part in the unit's workshop
    const workshopId = request.user_unit?.workshop_id;
    if (!workshopId) {
      throw new BadRequestException('Cannot determine workshop for this unit');
    }

    const inventoryItem = await this.inventoryRepository.findOne({
      where: {
        workshop_id: workshopId,
        spare_part_id: request.spare_part_id,
      },
    });

    if (!inventoryItem) {
      throw new BadRequestException('No inventory found for this spare part in the workshop');
    }

    if (inventoryItem.quantity < request.requested_quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${inventoryItem.quantity}, Requested: ${request.requested_quantity}`,
      );
    }

    // Decrement inventory
    inventoryItem.quantity -= request.requested_quantity;
    await this.inventoryRepository.save(inventoryItem);

    // Approve the request
    request.status = RequestStatus.APPROVED;
    request.approved_by_id = approvedById;
    request.approved_at = new Date();

    const saved = await this.consumeRequestRepository.save(request);

    // Auto-log inventory consumed
    const sparePartName = request.spare_part?.name || 'Unknown part';
    await this.logBookService.create({
      user_unit_id: request.user_unit_id,
      log_type: LogType.INVENTORY_CONSUMED,
      description: `Consumed ${request.requested_quantity}x "${sparePartName}" (request approved). Stock: ${inventoryItem.quantity + request.requested_quantity} → ${inventoryItem.quantity}`,
      performed_by_id: approvedById,
      metadata: {
        consume_request_id: request.id,
        spare_part_id: request.spare_part_id,
        spare_part_name: sparePartName,
        quantity: request.requested_quantity,
        stock_before: inventoryItem.quantity + request.requested_quantity,
        stock_after: inventoryItem.quantity,
      },
    });

    return saved;
  }

  async reject(id: string, approvedById: string, reason: string): Promise<ConsumeRequest> {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    request.status = RequestStatus.REJECTED;
    request.approved_by_id = approvedById;
    request.rejection_reason = reason;

    return await this.consumeRequestRepository.save(request);
  }

  async remove(id: string): Promise<void> {
    await this.consumeRequestRepository.delete(id);
  }

  async getPendingRequests(workshopId: string): Promise<ConsumeRequest[]> {
    return await this.consumeRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user_unit', 'user_unit')
      .leftJoinAndSelect('request.spare_part', 'spare_part')
      .leftJoinAndSelect('request.requested_by', 'requested_by')
      .where('user_unit.workshop_id = :workshopId', { workshopId })
      .andWhere('request.status = :status', { status: RequestStatus.PENDING })
      .getMany();
  }
}
