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
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { JobCartService } from './job-cart.service';
import { CreateJobCartDto } from './dto/create-job-cart.dto';
import { ApproveJobCartDto } from './dto/approve-job-cart.dto';
import { RejectJobCartDto } from './dto/reject-job-cart.dto';
import { IssueJobCartDto } from './dto/issue-job-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { JobCartStatus } from '../entities/job-cart.entity';

@ApiTags('Job Carts')
@ApiBearerAuth()
@Controller('job-carts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobCartController {
  constructor(private readonly jobCartService: JobCartService) {}

  @Post()
  @Roles(UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({
    summary: 'Create job cart',
    description:
      'Create a job cart for parts needed for a unit. Only assigned inspector can create.',
  })
  @ApiResponse({ status: 201, description: 'Job cart created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid entry or data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not assigned to this workshop',
  })
  create(@Body() createJobCartDto: CreateJobCartDto, @Request() req) {
    return this.jobCartService.create(createJobCartDto, req.user);
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
    summary: 'Get all job carts',
    description:
      'Retrieve job carts with filters. Store managers see only APPROVED carts from their workshop.',
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
    enum: JobCartStatus,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of job carts',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('workshop_id') workshop_id?: string,
    @Query('entry_id') entry_id?: string,
    @Query('user_unit_id') user_unit_id?: string,
    @Query('status') status?: JobCartStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Request() req?,
  ) {
    return this.jobCartService.findAll(req.user, {
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
    summary: 'Get job cart by ID',
    description:
      'Retrieve a specific job cart with current inventory info. Store managers can only view APPROVED carts.',
  })
  @ApiParam({ name: 'id', description: 'Job cart ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the job cart with current inventory level',
  })
  @ApiResponse({ status: 404, description: 'Job cart not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Store managers can only view APPROVED carts',
  })
  findOne(@Param('id') id: string, @Request() req) {
    return this.jobCartService.findOne(id, req.user);
  }

  @ApiExcludeEndpoint()
  @Post(':id/approve')
  @Roles(UserRole.CAPTAIN, UserRole.OC)
  @ApiOperation({
    summary: 'Approve job cart',
    description:
      'Approve a PENDING job cart. Automatically deducts inventory in atomic transaction. Either captain OR oc can approve.',
  })
  @ApiParam({ name: 'id', description: 'Job cart ID' })
  @ApiResponse({
    status: 200,
    description:
      'Job cart approved and inventory deducted successfully. Returns updated job cart with inventory info.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Job cart not PENDING, or insufficient inventory',
  })
  @ApiResponse({ status: 404, description: 'Job cart not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not assigned to this workshop',
  })
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveJobCartDto,
    @Request() req,
  ) {
    return this.jobCartService.approve(id, approveDto, req.user);
  }

  @ApiExcludeEndpoint()
  @Post(':id/reject')
  @Roles(UserRole.CAPTAIN, UserRole.OC)
  @ApiOperation({
    summary: 'Reject job cart',
    description: 'Reject a PENDING job cart. Either captain OR oc can reject.',
  })
  @ApiParam({ name: 'id', description: 'Job cart ID' })
  @ApiResponse({ status: 200, description: 'Job cart rejected successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Job cart not PENDING',
  })
  @ApiResponse({ status: 404, description: 'Job cart not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not assigned to this workshop',
  })
  reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectJobCartDto,
    @Request() req,
  ) {
    return this.jobCartService.reject(id, rejectDto, req.user);
  }

  @ApiExcludeEndpoint()
  @Post(':id/veto')
  @Roles(UserRole.OC)
  @ApiOperation({
    summary: 'Veto job cart (OC only)',
    description:
      'OC can veto an APPROVED job cart (before ISSUED). Automatically restores inventory in atomic transaction.',
  })
  @ApiParam({ name: 'id', description: 'Job cart ID' })
  @ApiResponse({
    status: 200,
    description:
      'Job cart vetoed and inventory restored successfully. Returns updated job cart with inventory info.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Can only veto APPROVED carts (not ISSUED or other states)',
  })
  @ApiResponse({ status: 404, description: 'Job cart not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only OC can veto, or not assigned to workshop',
  })
  veto(
    @Param('id') id: string,
    @Body() rejectDto: RejectJobCartDto,
    @Request() req,
  ) {
    return this.jobCartService.veto(id, rejectDto, req.user);
  }

  @ApiExcludeEndpoint()
  @Post(':id/issue')
  @Roles(UserRole.STORE_MAN)
  @ApiOperation({
    summary: 'Mark job cart as issued',
    description:
      'Store manager confirms physical delivery of parts. Can only issue APPROVED carts. After issued, cart becomes terminal (no further changes).',
  })
  @ApiParam({ name: 'id', description: 'Job cart ID' })
  @ApiResponse({ status: 200, description: 'Job cart marked as issued' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Can only issue APPROVED carts',
  })
  @ApiResponse({ status: 404, description: 'Job cart not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not assigned as store manager for this workshop',
  })
  issue(
    @Param('id') id: string,
    @Body() issueDto: IssueJobCartDto,
    @Request() req,
  ) {
    return this.jobCartService.issue(id, issueDto, req.user);
  }
}
