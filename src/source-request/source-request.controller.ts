import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SourceRequestService } from './source-request.service';
import { CreateSourceRequestDto } from './dto/create-source-request.dto';
import { UpdateSourceRequestDto } from './dto/update-source-request.dto';
import { SourceStatus } from './entities/source-request.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('Source Requests')
@ApiBearerAuth()
@Controller('source-request')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SourceRequestController {
  constructor(private readonly sourceRequestService: SourceRequestService) {}

  @Post()
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create source request', description: 'Create a request to source spare parts from external suppliers' })
  @ApiResponse({ status: 201, description: 'Source request created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createSourceRequestDto: CreateSourceRequestDto) {
    return this.sourceRequestService.create(createSourceRequestDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC)
  @ApiOperation({ summary: 'Get all source requests', description: 'Retrieve all source requests with optional filters' })
  @ApiQuery({ name: 'workshopId', required: false, description: 'Filter by workshop ID' })
  @ApiQuery({ name: 'status', required: false, enum: SourceStatus, description: 'Filter by request status' })
  @ApiResponse({ status: 200, description: 'Returns list of source requests' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('workshopId') workshopId?: string,
    @Query('status') status?: SourceStatus,
  ) {
    return this.sourceRequestService.findAll(workshopId, status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC)
  @ApiOperation({ summary: 'Get source request by ID', description: 'Retrieve a specific source request by ID' })
  @ApiParam({ name: 'id', description: 'Source request ID' })
  @ApiResponse({ status: 200, description: 'Returns the source request' })
  @ApiResponse({ status: 404, description: 'Source request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.sourceRequestService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update source request', description: 'Update a source request by ID' })
  @ApiParam({ name: 'id', description: 'Source request ID' })
  @ApiResponse({ status: 200, description: 'Source request updated successfully' })
  @ApiResponse({ status: 404, description: 'Source request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  update(@Param('id') id: string, @Body() updateSourceRequestDto: UpdateSourceRequestDto) {
    return this.sourceRequestService.update(id, updateSourceRequestDto);
  }

  @Patch(':id/approve')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve source request', description: 'Approve a source request for procurement' })
  @ApiParam({ name: 'id', description: 'Source request ID' })
  @ApiResponse({ status: 200, description: 'Request approved successfully' })
  @ApiResponse({ status: 404, description: 'Source request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  approve(@Param('id') id: string) {
    return this.sourceRequestService.approve(id);
  }

  @Patch(':id/sourced')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark as sourced', description: 'Mark a source request as sourced with supplier details' })
  @ApiParam({ name: 'id', description: 'Source request ID' })
  @ApiBody({
    schema: {
      properties: {
        supplierName: { type: 'string', example: 'Defense Supply Co.' },
        totalCost: { type: 'number', example: 5000.00 }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Marked as sourced successfully' })
  @ApiResponse({ status: 404, description: 'Source request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  markAsSourced(
    @Param('id') id: string,
    @Body('supplierName') supplierName?: string,
    @Body('totalCost') totalCost?: number,
  ) {
    return this.sourceRequestService.markAsSourced(id, supplierName, totalCost);
  }

  @Patch(':id/reject')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject source request', description: 'Reject a source request with a reason' })
  @ApiParam({ name: 'id', description: 'Source request ID' })
  @ApiBody({ schema: { properties: { reason: { type: 'string', example: 'Budget constraints' } } } })
  @ApiResponse({ status: 200, description: 'Request rejected successfully' })
  @ApiResponse({ status: 404, description: 'Source request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.sourceRequestService.reject(id, reason);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete source request', description: 'Delete a source request by ID' })
  @ApiParam({ name: 'id', description: 'Source request ID' })
  @ApiResponse({ status: 200, description: 'Source request deleted successfully' })
  @ApiResponse({ status: 404, description: 'Source request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  remove(@Param('id') id: string) {
    return this.sourceRequestService.remove(id);
  }
}
