import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSourceRequestDto } from './dto/create-source-request.dto';
import { UpdateSourceRequestDto } from './dto/update-source-request.dto';
import { SourceRequest, SourceStatus } from './entities/source-request.entity';

@Injectable()
export class SourceRequestService {
  constructor(
    @InjectRepository(SourceRequest)
    private sourceRequestRepository: Repository<SourceRequest>,
  ) {}

  async create(createSourceRequestDto: CreateSourceRequestDto): Promise<SourceRequest> {
    const request = this.sourceRequestRepository.create(createSourceRequestDto);
    return await this.sourceRequestRepository.save(request);
  }

  async findAll(workshopId?: string, status?: SourceStatus): Promise<SourceRequest[]> {
    const where: any = {};
    if (workshopId) where.workshop_id = workshopId;
    if (status) where.status = status;

    return await this.sourceRequestRepository.find({
      where,
      relations: ['workshop', 'spare_part', 'requested_by'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SourceRequest> {
    const request = await this.sourceRequestRepository.findOne({
      where: { id },
      relations: ['workshop', 'spare_part', 'requested_by'],
    });

    if (!request) {
      throw new NotFoundException(`SourceRequest with ID ${id} not found`);
    }

    return request;
  }

  async update(id: string, updateSourceRequestDto: UpdateSourceRequestDto): Promise<SourceRequest> {
    const request = await this.findOne(id);
    Object.assign(request, updateSourceRequestDto);
    return await this.sourceRequestRepository.save(request);
  }

  async approve(id: string): Promise<SourceRequest> {
    const request = await this.findOne(id);

    if (request.status !== SourceStatus.REQUESTED) {
      throw new BadRequestException('Only requested items can be approved');
    }

    request.status = SourceStatus.APPROVED;
    return await this.sourceRequestRepository.save(request);
  }

  async markAsSourced(id: string, supplierName?: string, totalCost?: number): Promise<SourceRequest> {
    const request = await this.findOne(id);

    if (request.status !== SourceStatus.APPROVED) {
      throw new BadRequestException('Only approved requests can be marked as sourced');
    }

    request.status = SourceStatus.SOURCED;
    request.sourced_at = new Date();
    if (supplierName) request.supplier_name = supplierName;
    if (totalCost) request.total_cost = totalCost;

    return await this.sourceRequestRepository.save(request);
  }

  async reject(id: string, reason: string): Promise<SourceRequest> {
    const request = await this.findOne(id);

    if (request.status !== SourceStatus.REQUESTED) {
      throw new BadRequestException('Only requested items can be rejected');
    }

    request.status = SourceStatus.REJECTED;
    request.rejection_reason = reason;

    return await this.sourceRequestRepository.save(request);
  }

  async remove(id: string): Promise<void> {
    await this.sourceRequestRepository.delete(id);
  }
}
