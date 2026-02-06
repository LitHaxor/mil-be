import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SparePartService } from './spare-part.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('Spare Parts')
@ApiBearerAuth()
@Controller('spare-part')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SparePartController {
  constructor(private readonly sparePartService: SparePartService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OC)
  @ApiOperation({ summary: 'Create spare part', description: 'Create a new spare part template' })
  @ApiResponse({ status: 201, description: 'Spare part created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createSparePartDto: CreateSparePartDto) {
    return this.sparePartService.create(createSparePartDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Get all spare parts', description: 'Retrieve all spare parts, optionally filtered by equipment type' })
  @ApiQuery({ name: 'equipmentType', required: false, description: 'Filter by equipment type' })
  @ApiResponse({ status: 200, description: 'Returns list of spare parts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query('equipmentType') equipmentType?: string) {
    return this.sparePartService.findAll(equipmentType);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Search spare parts', description: 'Search spare parts by name' })
  @ApiQuery({ name: 'name', required: true, description: 'Search term for spare part name' })
  @ApiResponse({ status: 200, description: 'Returns matching spare parts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  search(@Query('name') name: string) {
    return this.sparePartService.searchByName(name);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Get spare part by ID', description: 'Retrieve a specific spare part by ID' })
  @ApiParam({ name: 'id', description: 'Spare part ID' })
  @ApiResponse({ status: 200, description: 'Returns the spare part' })
  @ApiResponse({ status: 404, description: 'Spare part not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.sparePartService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OC)
  @ApiOperation({ summary: 'Update spare part', description: 'Update a spare part by ID' })
  @ApiParam({ name: 'id', description: 'Spare part ID' })
  @ApiResponse({ status: 200, description: 'Spare part updated successfully' })
  @ApiResponse({ status: 404, description: 'Spare part not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  update(@Param('id') id: string, @Body() updateSparePartDto: UpdateSparePartDto) {
    return this.sparePartService.update(id, updateSparePartDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete spare part', description: 'Delete a spare part by ID' })
  @ApiParam({ name: 'id', description: 'Spare part ID' })
  @ApiResponse({ status: 200, description: 'Spare part deleted successfully' })
  @ApiResponse({ status: 404, description: 'Spare part not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  remove(@Param('id') id: string) {
    return this.sparePartService.remove(id);
  }
}
