import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UserUnitService } from './user-unit.service';
import { CreateUserUnitDto } from './dto/create-user-unit.dto';
import { UpdateUserUnitDto } from './dto/update-user-unit.dto';
import { UnitStatus } from './entities/user-unit.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('User Units')
@ApiBearerAuth()
@Controller('user-unit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserUnitController {
  constructor(private readonly userUnitService: UserUnitService) {}

  @Post()
  @Roles(UserRole.INSPECTOR, UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create user unit', description: 'Register a new user unit (weapon/vehicle)' })
  @ApiResponse({ status: 201, description: 'User unit created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createUserUnitDto: CreateUserUnitDto) {
    return this.userUnitService.create(createUserUnitDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Get all user units', description: 'Retrieve all user units, optionally filtered by workshop' })
  @ApiQuery({ name: 'workshopId', required: false, description: 'Filter by workshop ID' })
  @ApiResponse({ status: 200, description: 'Returns list of user units' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query('workshopId') workshopId?: string) {
    return this.userUnitService.findAll(workshopId);
  }

  @Get('workshop/:workshopId/in-workshop')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Get units in workshop', description: 'Get all units currently in a specific workshop' })
  @ApiParam({ name: 'workshopId', description: 'Workshop ID' })
  @ApiResponse({ status: 200, description: 'Returns list of units in workshop' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getInWorkshop(@Param('workshopId') workshopId: string) {
    return this.userUnitService.getInWorkshop(workshopId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Get user unit by ID', description: 'Retrieve a specific user unit by ID' })
  @ApiParam({ name: 'id', description: 'User unit ID' })
  @ApiResponse({ status: 200, description: 'Returns the user unit' })
  @ApiResponse({ status: 404, description: 'User unit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.userUnitService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user unit', description: 'Update a user unit by ID' })
  @ApiParam({ name: 'id', description: 'User unit ID' })
  @ApiResponse({ status: 200, description: 'User unit updated successfully' })
  @ApiResponse({ status: 404, description: 'User unit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  update(@Param('id') id: string, @Body() updateUserUnitDto: UpdateUserUnitDto) {
    return this.userUnitService.update(id, updateUserUnitDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update unit status', description: 'Update the status of a user unit' })
  @ApiParam({ name: 'id', description: 'User unit ID' })
  @ApiBody({ schema: { properties: { status: { type: 'string', enum: Object.values(UnitStatus) } } } })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'User unit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  updateStatus(@Param('id') id: string, @Body('status') status: UnitStatus) {
    return this.userUnitService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user unit', description: 'Delete a user unit by ID' })
  @ApiParam({ name: 'id', description: 'User unit ID' })
  @ApiResponse({ status: 200, description: 'User unit deleted successfully' })
  @ApiResponse({ status: 404, description: 'User unit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  remove(@Param('id') id: string) {
    return this.userUnitService.remove(id);
  }
}
