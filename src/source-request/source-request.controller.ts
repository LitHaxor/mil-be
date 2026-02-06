import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SourceRequestService } from './source-request.service';
import { CreateSourceRequestDto } from './dto/create-source-request.dto';
import { UpdateSourceRequestDto } from './dto/update-source-request.dto';
import { SourceStatus } from './entities/source-request.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('source-request')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SourceRequestController {
  constructor(private readonly sourceRequestService: SourceRequestService) {}

  @Post()
  @Roles(UserRole.OC, UserRole.ADMIN)
  create(@Body() createSourceRequestDto: CreateSourceRequestDto) {
    return this.sourceRequestService.create(createSourceRequestDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC)
  findAll(
    @Query('workshopId') workshopId?: string,
    @Query('status') status?: SourceStatus,
  ) {
    return this.sourceRequestService.findAll(workshopId, status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC)
  findOne(@Param('id') id: string) {
    return this.sourceRequestService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateSourceRequestDto: UpdateSourceRequestDto) {
    return this.sourceRequestService.update(id, updateSourceRequestDto);
  }

  @Patch(':id/approve')
  @Roles(UserRole.OC, UserRole.ADMIN)
  approve(@Param('id') id: string) {
    return this.sourceRequestService.approve(id);
  }

  @Patch(':id/sourced')
  @Roles(UserRole.OC, UserRole.ADMIN)
  markAsSourced(
    @Param('id') id: string,
    @Body('supplierName') supplierName?: string,
    @Body('totalCost') totalCost?: number,
  ) {
    return this.sourceRequestService.markAsSourced(id, supplierName, totalCost);
  }

  @Patch(':id/reject')
  @Roles(UserRole.OC, UserRole.ADMIN)
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.sourceRequestService.reject(id, reason);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.sourceRequestService.remove(id);
  }
}
