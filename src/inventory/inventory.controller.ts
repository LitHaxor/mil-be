import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.OC, UserRole.ADMIN)
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findAll(@Query('workshopId') workshopId?: string) {
    return this.inventoryService.findAll(workshopId);
  }

  @Get('low-stock/:workshopId')
  @Roles(UserRole.ADMIN, UserRole.OC)
  getLowStock(@Param('workshopId') workshopId: string) {
    return this.inventoryService.getLowStock(workshopId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Patch(':id/consume')
  @Roles(UserRole.OC, UserRole.ADMIN)
  consumeStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.inventoryService.consumeStock(id, quantity);
  }

  @Patch(':id/add')
  @Roles(UserRole.OC, UserRole.ADMIN)
  addStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.inventoryService.addStock(id, quantity);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
