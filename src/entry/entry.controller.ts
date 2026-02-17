import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  ParseBoolPipe,
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
import { EntryService } from './entry.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('Entries')
@ApiBearerAuth()
@Controller('entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EntryController {
  constructor(private readonly entryService: EntryService) {}

  @Post()
  @Roles(UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({
    summary: 'Create entry',
    description:
      'Create a new entry when a unit enters the workshop. Only assigned inspector can create entries.',
  })
  @ApiResponse({ status: 201, description: 'Entry created successfully' })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Unit already has active entry or workshop not ready',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not assigned to this workshop',
  })
  create(@Body() createEntryDto: CreateEntryDto, @Request() req) {
    return this.entryService.create(createEntryDto, req.user);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.OC,
    UserRole.CAPTAIN,
    UserRole.INSPECTOR_RI_AND_I,
    UserRole.STORE_MAN,
  )
  @ApiOperation({
    summary: 'Get all entries',
    description:
      'Retrieve entries with filters. Inspectors see only their workshop entries.',
  })
  @ApiQuery({
    name: 'workshop_id',
    required: false,
    description: 'Filter by workshop',
  })
  @ApiQuery({
    name: 'user_unit_id',
    required: false,
    description: 'Filter by unit',
  })
  @ApiQuery({
    name: 'has_exit',
    required: false,
    description: 'Filter by exit status (false = active entries)',
    type: Boolean,
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of entries',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('workshop_id') workshop_id?: string,
    @Query('user_unit_id') user_unit_id?: string,
    @Query('has_exit') has_exit?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Request() req?,
  ) {
    return this.entryService.findAll(req.user, {
      workshop_id,
      user_unit_id,
      has_exit: has_exit !== undefined ? has_exit === 'true' : undefined,
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
    summary: 'Get entry by ID',
    description: 'Retrieve a specific entry with full details',
  })
  @ApiParam({ name: 'id', description: 'Entry ID' })
  @ApiResponse({ status: 200, description: 'Returns the entry' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.entryService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({
    summary: 'Update entry',
    description: 'Update entry metadata. Only the creator can update.',
  })
  @ApiParam({ name: 'id', description: 'Entry ID' })
  @ApiResponse({ status: 200, description: 'Entry updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your entry' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateEntryDto: UpdateEntryDto,
    @Request() req,
  ) {
    return this.entryService.update(id, updateEntryDto, req.user);
  }
}
