import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConsumeRequestDto } from './dto/create-consume-request.dto';
import { UpdateConsumeRequestDto } from './dto/update-consume-request.dto';
import { ConsumeRequest, RequestStatus } from './entities/consume-request.entity';

@Injectable()
export class ConsumeRequestService {
  constructor(
    @InjectRepository(ConsumeRequest)
    private consumeRequestRepository: Repository<ConsumeRequest>,
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

    request.status = RequestStatus.APPROVED;
    request.approved_by_id = approvedById;
    request.approved_at = new Date();

    return await this.consumeRequestRepository.save(request);
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
