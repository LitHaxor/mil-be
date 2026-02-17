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
  ApiBody,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

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
    description: 'Add a new inventory item to a workshop',
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

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.OC,
    UserRole.INSPECTOR_RI_AND_I,
    UserRole.STORE_MAN,
  )
  @ApiOperation({
    summary: 'Get inventory item by ID',
    description: 'Retrieve a specific inventory item by ID',
  })
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
    summary: 'Update inventory item',
    description: 'Update an inventory item by ID',
  })
  @ApiParam({ name: 'id', description: 'Inventory item ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Patch(':id/consume')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Consume stock',
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  consumeStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.inventoryService.consumeStock(id, quantity);
  }

  @Patch(':id/add')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Add stock',
    description: 'Increase inventory quantity by specified amount',
  })
  @ApiParam({ name: 'id', description: 'Inventory item ID' })
  @ApiBody({
    schema: { properties: { quantity: { type: 'number', example: 20 } } },
  })
  @ApiResponse({ status: 200, description: 'Stock added successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
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
