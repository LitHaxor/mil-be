import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ConsumeRequestService } from './consume-request.service';
import { CreateConsumeRequestDto } from './dto/create-consume-request.dto';
import { UpdateConsumeRequestDto } from './dto/update-consume-request.dto';
import { RequestStatus } from './entities/consume-request.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('consume-request')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsumeRequestController {
  constructor(private readonly consumeRequestService: ConsumeRequestService) {}

  @Post()
  @Roles(UserRole.INSPECTOR, UserRole.OC, UserRole.ADMIN)
  create(@Body() createConsumeRequestDto: CreateConsumeRequestDto) {
    return this.consumeRequestService.create(createConsumeRequestDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findAll(
    @Query('userUnitId') userUnitId?: string,
    @Query('status') status?: RequestStatus,
  ) {
    return this.consumeRequestService.findAll(userUnitId, status);
  }

  @Get('pending/:workshopId')
  @Roles(UserRole.ADMIN, UserRole.OC)
  getPendingRequests(@Param('workshopId') workshopId: string) {
    return this.consumeRequestService.getPendingRequests(workshopId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findOne(@Param('id') id: string) {
    return this.consumeRequestService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateConsumeRequestDto: UpdateConsumeRequestDto) {
    return this.consumeRequestService.update(id, updateConsumeRequestDto);
  }

  @Patch(':id/approve')
  @Roles(UserRole.OC, UserRole.ADMIN)
  approve(@Param('id') id: string, @Body('approvedById') approvedById: string) {
    return this.consumeRequestService.approve(id, approvedById);
  }

  @Patch(':id/reject')
  @Roles(UserRole.OC, UserRole.ADMIN)
  reject(
    @Param('id') id: string,
    @Body('approvedById') approvedById: string,
    @Body('reason') reason: string,
  ) {
    return this.consumeRequestService.reject(id, approvedById, reason);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.consumeRequestService.remove(id);
  }
}
