import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LogBookService } from './log-book.service';
import { CreateLogBookDto } from './dto/create-log-book.dto';
import { UpdateLogBookDto } from './dto/update-log-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('Log Book')
@ApiBearerAuth()
@Controller('log-book')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogBookController {
  constructor(private readonly logBookService: LogBookService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({
    summary: 'Create log entry',
    description: 'Create a new log entry for a user unit',
  })
  @ApiResponse({ status: 201, description: 'Log entry created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  create(@Body() createLogBookDto: CreateLogBookDto) {
    return this.logBookService.create(createLogBookDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({
    summary: 'Get all log entries',
    description: 'Retrieve all log entries, optionally filtered by user unit',
  })
  @ApiQuery({
    name: 'userUnitId',
    required: false,
    description: 'Filter by user unit ID',
  })
  @ApiResponse({ status: 200, description: 'Returns list of log entries' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query('userUnitId') userUnitId?: string) {
    return this.logBookService.findAll(userUnitId);
  }

  @Get('user-unit/:userUnitId')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({
    summary: 'Get logs by user unit',
    description: 'Get all log entries for a specific user unit',
  })
  @ApiParam({ name: 'userUnitId', description: 'User unit ID' })
  @ApiResponse({ status: 200, description: 'Returns list of log entries' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getLogsByUserUnit(@Param('userUnitId') userUnitId: string) {
    return this.logBookService.getLogsByUserUnit(userUnitId);
  }

  @Get('user-unit/:userUnitId/workshop-history')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({
    summary: 'Get workshop history',
    description: 'Get workshop visit history for a specific user unit',
  })
  @ApiParam({ name: 'userUnitId', description: 'User unit ID' })
  @ApiResponse({ status: 200, description: 'Returns workshop history' })
  @ApiResponse({ status: 404, description: 'User unit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getWorkshopHistory(@Param('userUnitId') userUnitId: string) {
    return this.logBookService.getWorkshopHistory(userUnitId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({
    summary: 'Get log entry by ID',
    description: 'Retrieve a specific log entry by ID',
  })
  @ApiParam({ name: 'id', description: 'Log entry ID' })
  @ApiResponse({ status: 200, description: 'Returns the log entry' })
  @ApiResponse({ status: 404, description: 'Log entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.logBookService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update log entry',
    description: 'Update a log entry by ID',
  })
  @ApiParam({ name: 'id', description: 'Log entry ID' })
  @ApiResponse({ status: 200, description: 'Log entry updated successfully' })
  @ApiResponse({ status: 404, description: 'Log entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  update(@Param('id') id: string, @Body() updateLogBookDto: UpdateLogBookDto) {
    return this.logBookService.update(id, updateLogBookDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete log entry',
    description: 'Delete a log entry by ID',
  })
  @ApiParam({ name: 'id', description: 'Log entry ID' })
  @ApiResponse({ status: 200, description: 'Log entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Log entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  remove(@Param('id') id: string) {
    return this.logBookService.remove(id);
  }
}
