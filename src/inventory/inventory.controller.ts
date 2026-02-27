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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateStockUpdateRequestDto } from './dto/create-stock-update-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { StockUpdateStatus } from './entities/stock-update-request.entity';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create inventory item',
    description: 'Add a new inventory item to a workshop. OC/Admin only.',
  })
  @ApiResponse({
    status: 201,
    description: 'Inventory item created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.OC,
    UserRole.INSPECTOR_RI_AND_I,
    UserRole.STORE_MAN,
  )
  @ApiOperation({
    summary: 'Get all inventory items',
    description:
      'Retrieve all inventory items, optionally filtered by workshop',
  })
  @ApiQuery({
    name: 'workshopId',
    required: false,
    description: 'Filter by workshop ID',
  })
  @ApiResponse({ status: 200, description: 'Returns list of inventory items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query('workshopId') workshopId?: string) {
    return this.inventoryService.findAll(workshopId);
  }

  @Get('low-stock/:workshopId')
  @Roles(UserRole.ADMIN, UserRole.OC)
  @ApiOperation({
    summary: 'Get low stock items',
    description: 'Get inventory items below minimum quantity threshold',
  })
  @ApiParam({ name: 'workshopId', description: 'Workshop ID' })
  @ApiResponse({ status: 200, description: 'Returns list of low stock items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getLowStock(@Param('workshopId') workshopId: string) {
    return this.inventoryService.getLowStock(workshopId);
  }

  // ─── Stock Update Request Routes (must be before :id param routes) ─────────

  @Post('stock-update-requests')
  @Roles(UserRole.STORE_MAN, UserRole.OC, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Request stock level increase',
    description:
      'Store Man creates a pending request to increase stock. ' +
      'The actual inventory quantity does NOT change until OC approves.',
  })
  @ApiQuery({
    name: 'inventoryId',
    required: true,
    description: 'Inventory item ID to update',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock update request created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Store Man, OC, or Admin only',
  })
  createStockUpdateRequest(
    @Query('inventoryId') inventoryId: string,
    @Body() dto: CreateStockUpdateRequestDto,
    @Request() req,
  ) {
    return this.inventoryService.createStockUpdateRequest(
      inventoryId,
      dto,
      req.user,
    );
  }

  @Get('stock-update-requests')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.STORE_MAN)
  @ApiOperation({
    summary: 'List stock update requests',
    description:
      'OC/Admin: see all requests for a workshop. Store Man: see only their own requests.',
  })
  @ApiQuery({
    name: 'workshopId',
    required: false,
    description: 'Filter by workshop ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: StockUpdateStatus,
    description: 'Filter by status',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of stock update requests',
  })
  getStockUpdateRequests(
    @Query('workshopId') workshopId?: string,
    @Query('status') status?: StockUpdateStatus,
    @Request() req?: any,
  ) {
    // Store Man can only see their own requests
    const requestedById =
      req?.user?.role === UserRole.STORE_MAN ? req.user.id : undefined;
    return this.inventoryService.getStockUpdateRequests(
      workshopId,
      status,
      requestedById,
    );
  }

  @Patch('stock-update-requests/:requestId/approve')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Approve stock update request',
    description:
      'OC approves a pending stock update request — inventory quantity increases immediately.',
  })
  @ApiParam({ name: 'requestId', description: 'Stock update request ID' })
  @ApiResponse({
    status: 200,
    description: 'Request approved, stock level increased',
  })
  @ApiResponse({ status: 400, description: 'Request is not in PENDING status' })
  @ApiResponse({ status: 403, description: 'Forbidden - OC or Admin only' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  approveStockUpdateRequest(
    @Param('requestId') requestId: string,
    @Request() req,
  ) {
    return this.inventoryService.approveStockUpdateRequest(requestId, req.user);
  }

  @Patch('stock-update-requests/:requestId/reject')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reject stock update request',
    description:
      'OC rejects a pending stock update request — inventory is unchanged.',
  })
  @ApiParam({ name: 'requestId', description: 'Stock update request ID' })
  @ApiBody({ schema: { properties: { rejection_reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Request rejected' })
  @ApiResponse({ status: 403, description: 'Forbidden - OC or Admin only' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  rejectStockUpdateRequest(
    @Param('requestId') requestId: string,
    @Body('rejection_reason') rejectionReason: string,
    @Request() req,
  ) {
    return this.inventoryService.rejectStockUpdateRequest(
      requestId,
      rejectionReason,
      req.user,
    );
  }

  // ─── Standard Item Routes ───────────────────────────────────────────────────

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.OC,
    UserRole.INSPECTOR_RI_AND_I,
    UserRole.STORE_MAN,
  )
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiParam({ name: 'id', description: 'Inventory item ID' })
  @ApiResponse({ status: 200, description: 'Returns the inventory item' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update inventory item (OC/Admin direct update)',
    description:
      'Directly update an inventory item. For store_man use /stock-update-requests instead.',
  })
  @ApiParam({ name: 'id', description: 'Inventory item ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - OC or Admin only' })
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Patch(':id/consume')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Consume stock (direct, OC/Admin only)',
    description: 'Reduce inventory quantity by specified amount',
  })
  @ApiParam({ name: 'id', description: 'Inventory item ID' })
  @ApiBody({
    schema: { properties: { quantity: { type: 'number', example: 5 } } },
  })
  @ApiResponse({ status: 200, description: 'Stock consumed successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - OC or Admin only' })
  consumeStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.inventoryService.consumeStock(id, quantity);
  }

  @Patch(':id/add')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Add stock (direct OC/Admin). Store Man must use /stock-update-requests.',
    description: 'Increase inventory quantity directly. OC/Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Inventory item ID' })
  @ApiBody({
    schema: { properties: { quantity: { type: 'number', example: 20 } } },
  })
  @ApiResponse({ status: 200, description: 'Stock added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - OC or Admin only' })
  addStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.inventoryService.addStock(id, quantity);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete inventory item',
    description: 'Delete an inventory item by ID',
  })
  @ApiParam({ name: 'id', description: 'Inventory item ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
