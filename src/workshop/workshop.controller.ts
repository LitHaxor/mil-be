import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { WorkshopService } from './workshop.service';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('workshops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createWorkshopDto: CreateWorkshopDto, @Request() req) {
    return this.workshopService.create(createWorkshopDto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC)
  findAll() {
    return this.workshopService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findOne(@Param('id') id: string) {
    return this.workshopService.findOne(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN, UserRole.OC)
  getStats(@Param('id') id: string) {
    return this.workshopService.getWorkshopStats(id);
  }

  @Get(':id/users')
  @Roles(UserRole.ADMIN, UserRole.OC)
  getUsers(@Param('id') id: string) {
    return this.workshopService.getWorkshopUsers(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OC)
  update(@Param('id') id: string, @Body() updateWorkshopDto: UpdateWorkshopDto) {
    return this.workshopService.update(id, updateWorkshopDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.workshopService.remove(id);
  }
}
