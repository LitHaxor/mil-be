import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ConsumeRequestService } from './consume-request.service';
import { CreateConsumeRequestDto } from './dto/create-consume-request.dto';
import { UpdateConsumeRequestDto } from './dto/update-consume-request.dto';
import { RequestStatus } from './entities/consume-request.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('Consume Requests')
@ApiBearerAuth()
@Controller('consume-request')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsumeRequestController {
  constructor(private readonly consumeRequestService: ConsumeRequestService) {}

  @Post()
  @Roles(UserRole.INSPECTOR_RI_AND_I, UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create consume request', description: 'Create a request to consume spare parts for a unit' })
  @ApiResponse({ status: 201, description: 'Consume request created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createConsumeRequestDto: CreateConsumeRequestDto) {
    return this.consumeRequestService.create(createConsumeRequestDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({ summary: 'Get all consume requests', description: 'Retrieve all consume requests with optional filters' })
  @ApiQuery({ name: 'userUnitId', required: false, description: 'Filter by user unit ID' })
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus, description: 'Filter by request status' })
  @ApiResponse({ status: 200, description: 'Returns list of consume requests' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('userUnitId') userUnitId?: string,
    @Query('status') status?: RequestStatus,
  ) {
    return this.consumeRequestService.findAll(userUnitId, status);
  }

  @Get('pending/:workshopId')
  @Roles(UserRole.ADMIN, UserRole.OC)
  @ApiOperation({ summary: 'Get pending requests', description: 'Get all pending consume requests for a workshop' })
  @ApiParam({ name: 'workshopId', description: 'Workshop ID' })
  @ApiResponse({ status: 200, description: 'Returns list of pending requests' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPendingRequests(@Param('workshopId') workshopId: string) {
    return this.consumeRequestService.getPendingRequests(workshopId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({ summary: 'Get consume request by ID', description: 'Retrieve a specific consume request by ID' })
  @ApiParam({ name: 'id', description: 'Consume request ID' })
  @ApiResponse({ status: 200, description: 'Returns the consume request' })
  @ApiResponse({ status: 404, description: 'Consume request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.consumeRequestService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update consume request', description: 'Update a consume request by ID' })
  @ApiParam({ name: 'id', description: 'Consume request ID' })
  @ApiResponse({ status: 200, description: 'Consume request updated successfully' })
  @ApiResponse({ status: 404, description: 'Consume request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  update(@Param('id') id: string, @Body() updateConsumeRequestDto: UpdateConsumeRequestDto) {
    return this.consumeRequestService.update(id, updateConsumeRequestDto);
  }

  @Patch(':id/approve')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve consume request', description: 'Approve a consume request and consume the inventory' })
  @ApiParam({ name: 'id', description: 'Consume request ID' })
  @ApiBody({ schema: { properties: { approvedById: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' } } } })
  @ApiResponse({ status: 200, description: 'Request approved successfully' })
  @ApiResponse({ status: 404, description: 'Consume request not found' })
  @ApiResponse({ status: 400, description: 'Insufficient inventory' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  approve(@Param('id') id: string, @Body('approvedById') approvedById: string) {
    return this.consumeRequestService.approve(id, approvedById);
  }

  @Patch(':id/reject')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject consume request', description: 'Reject a consume request with a reason' })
  @ApiParam({ name: 'id', description: 'Consume request ID' })
  @ApiBody({
    schema: {
      properties: {
        approvedById: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        reason: { type: 'string', example: 'Insufficient stock available' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Request rejected successfully' })
  @ApiResponse({ status: 404, description: 'Consume request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  reject(
    @Param('id') id: string,
    @Body('approvedById') approvedById: string,
    @Body('reason') reason: string,
  ) {
    return this.consumeRequestService.reject(id, approvedById, reason);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete consume request', description: 'Delete a consume request by ID' })
  @ApiParam({ name: 'id', description: 'Consume request ID' })
  @ApiResponse({ status: 200, description: 'Consume request deleted successfully' })
  @ApiResponse({ status: 404, description: 'Consume request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  remove(@Param('id') id: string) {
    return this.consumeRequestService.remove(id);
  }
}
