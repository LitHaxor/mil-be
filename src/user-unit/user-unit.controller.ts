import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { UserUnitService } from './user-unit.service';
import { CreateUserUnitDto } from './dto/create-user-unit.dto';
import { UpdateUserUnitDto } from './dto/update-user-unit.dto';
import { UnitStatus } from './entities/user-unit.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('user-unit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserUnitController {
  constructor(private readonly userUnitService: UserUnitService) {}

  @Post()
  @Roles(UserRole.INSPECTOR, UserRole.OC, UserRole.ADMIN)
  create(@Body() createUserUnitDto: CreateUserUnitDto) {
    return this.userUnitService.create(createUserUnitDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findAll(@Query('workshopId') workshopId?: string) {
    return this.userUnitService.findAll(workshopId);
  }

  @Get('workshop/:workshopId/in-workshop')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  getInWorkshop(@Param('workshopId') workshopId: string) {
    return this.userUnitService.getInWorkshop(workshopId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findOne(@Param('id') id: string) {
    return this.userUnitService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserUnitDto: UpdateUserUnitDto) {
    return this.userUnitService.update(id, updateUserUnitDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.OC, UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: UnitStatus) {
    return this.userUnitService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.userUnitService.remove(id);
  }
}
