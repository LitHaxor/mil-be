import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SparePartService } from './spare-part.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('spare-part')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SparePartController {
  constructor(private readonly sparePartService: SparePartService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OC)
  create(@Body() createSparePartDto: CreateSparePartDto) {
    return this.sparePartService.create(createSparePartDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findAll(@Query('equipmentType') equipmentType?: string) {
    return this.sparePartService.findAll(equipmentType);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  search(@Query('name') name: string) {
    return this.sparePartService.searchByName(name);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findOne(@Param('id') id: string) {
    return this.sparePartService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OC)
  update(@Param('id') id: string, @Body() updateSparePartDto: UpdateSparePartDto) {
    return this.sparePartService.update(id, updateSparePartDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.sparePartService.remove(id);
  }
}
