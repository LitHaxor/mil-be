import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ExitService } from './exit.service';
import { CreateExitDto } from './dto/create-exit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('Exits')
@ApiBearerAuth()
@Controller('exits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExitController {
  constructor(private readonly exitService: ExitService) {}

  @Post()
  @Roles(UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({
    summary: 'Create exit',
    description:
      'Create an exit when a unit leaves the workshop. Only the assigned inspector can create exits.',
  })
  @ApiResponse({ status: 201, description: 'Exit created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Entry already has exit or entry not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not assigned to this workshop',
  })
  create(@Body() createExitDto: CreateExitDto, @Request() req) {
    return this.exitService.create(createExitDto, req.user);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.OC,
    UserRole.CAPTAIN,
    UserRole.INSPECTOR_RI_AND_I,
  )
  @ApiOperation({
    summary: 'Get all exits',
    description:
      'Retrieve exits with filters. Inspectors see only their workshop exits.',
  })
  @ApiQuery({
    name: 'workshop_id',
    required: false,
    description: 'Filter by workshop',
  })
  @ApiQuery({
    name: 'entry_id',
    required: false,
    description: 'Filter by entry',
  })
  @ApiQuery({
    name: 'user_unit_id',
    required: false,
    description: 'Filter by unit',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of exits' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('workshop_id') workshop_id?: string,
    @Query('entry_id') entry_id?: string,
    @Query('user_unit_id') user_unit_id?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Request() req?,
  ) {
    return this.exitService.findAll(req.user, {
      workshop_id,
      entry_id,
      user_unit_id,
      page,
      limit,
    });
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.OC,
    UserRole.CAPTAIN,
    UserRole.INSPECTOR_RI_AND_I,
    UserRole.STORE_MAN,
  )
  @ApiOperation({
    summary: 'Get exit by ID',
    description: 'Retrieve a specific exit with full details',
  })
  @ApiParam({ name: 'id', description: 'Exit ID' })
  @ApiResponse({ status: 200, description: 'Returns the exit' })
  @ApiResponse({ status: 404, description: 'Exit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.exitService.findOne(id);
  }
}
