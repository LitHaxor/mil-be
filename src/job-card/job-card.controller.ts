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
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JobCardService } from './job-card.service';
import { CreateJobCardDto } from './dto/create-job-card.dto';
import { ApproveJobCardDto } from './dto/approve-job-card.dto';
import { RejectJobCardDto } from './dto/reject-job-card.dto';
import { IssueJobCardDto } from './dto/issue-job-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { JobCardStatus } from '../entities/job-card.entity';

@ApiTags('Job Cards')
@ApiBearerAuth()
@Controller('job-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobCardController {
  constructor(private readonly jobCardService: JobCardService) {}

  @Post()
  @Roles(UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({
    summary: 'Create job card',
    description:
      'Create a job card for parts needed for a unit. Only assigned inspector can create.',
  })
  @ApiResponse({ status: 201, description: 'Job card created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid entry or data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not assigned to this workshop',
  })
  create(@Body() createJobCardDto: CreateJobCardDto, @Request() req) {
    return this.jobCardService.create(createJobCardDto, req.user);
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
    summary: 'Get all job cards',
    description:
      'Retrieve job cards with filters. Store managers see only APPROVED cards from their workshop.',
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
  @ApiQuery({
    name: 'status',
    required: false,
    enum: JobCardStatus,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of job cards',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('workshop_id') workshop_id?: string,
    @Query('entry_id') entry_id?: string,
    @Query('user_unit_id') user_unit_id?: string,
    @Query('status') status?: JobCardStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Request() req?,
  ) {
    return this.jobCardService.findAll(req.user, {
      workshop_id,
      entry_id,
      user_unit_id,
      status,
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
    summary: 'Get job card by ID',
    description:
      'Retrieve a specific job card with current inventory info. Store managers can only view APPROVED cards.',
  })
  @ApiParam({ name: 'id', description: 'Job card ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the job card with current inventory level',
  })
  @ApiResponse({ status: 404, description: 'Job card not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Store managers can only view APPROVED cards',
  })
  findOne(@Param('id') id: string, @Request() req) {
    return this.jobCardService.findOne(id, req.user);
  }

  @Post(':id/approve')
  @Roles(UserRole.CAPTAIN, UserRole.OC)
  @ApiOperation({
    summary: 'Approve job card',
    description:
      'Approve a PENDING job card. Automatically deducts inventory in atomic transaction. Either captain OR oc can approve.',
  })
  @ApiParam({ name: 'id', description: 'Job card ID' })
  @ApiResponse({
    status: 200,
    description:
      'Job card approved and inventory deducted successfully. Returns updated job card with inventory info.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Job card not PENDING, or insufficient inventory',
  })
  @ApiResponse({ status: 404, description: 'Job card not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not assigned to this workshop',
  })
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveJobCardDto,
    @Request() req,
  ) {
    return this.jobCardService.approve(id, approveDto, req.user);
  }

  @Post(':id/reject')
  @Roles(UserRole.CAPTAIN, UserRole.OC)
  @ApiOperation({
    summary: 'Reject job card',
    description:
      'Reject a PENDING job card. Either captain OR oc can reject.',
  })
  @ApiParam({ name: 'id', description: 'Job card ID' })
  @ApiResponse({ status: 200, description: 'Job card rejected successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Job card not PENDING',
  })
  @ApiResponse({ status: 404, description: 'Job card not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not assigned to this workshop',
  })
  reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectJobCardDto,
    @Request() req,
  ) {
    return this.jobCardService.reject(id, rejectDto, req.user);
  }

  @Post(':id/veto')
  @Roles(UserRole.OC)
  @ApiOperation({
    summary: 'Veto job card (OC only)',
    description:
      'OC can veto an APPROVED job card (before ISSUED). Automatically restores inventory in atomic transaction.',
  })
  @ApiParam({ name: 'id', description: 'Job card ID' })
  @ApiResponse({
    status: 200,
    description:
      'Job card vetoed and inventory restored successfully. Returns updated job card with inventory info.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Can only veto APPROVED cards (not ISSUED or other states)',
  })
  @ApiResponse({ status: 404, description: 'Job card not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only OC can veto, or not assigned to workshop',
  })
  veto(
    @Param('id') id: string,
    @Body() rejectDto: RejectJobCardDto,
    @Request() req,
  ) {
    return this.jobCardService.veto(id, rejectDto, req.user);
  }

  @Post(':id/issue')
  @Roles(UserRole.STORE_MAN)
  @ApiOperation({
    summary: 'Mark job card as issued',
    description:
      'Store manager confirms physical delivery of parts. Can only issue APPROVED cards. After issued, card becomes terminal (no further changes).',
  })
  @ApiParam({ name: 'id', description: 'Job card ID' })
  @ApiResponse({ status: 200, description: 'Job card marked as issued' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Can only issue APPROVED cards',
  })
  @ApiResponse({ status: 404, description: 'Job card not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not assigned as store manager for this workshop',
  })
  issue(
    @Param('id') id: string,
    @Body() issueDto: IssueJobCardDto,
    @Request() req,
  ) {
    return this.jobCardService.issue(id, issueDto, req.user);
  }
}
