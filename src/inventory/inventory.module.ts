import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory } from './entities/inventory.entity';
import { StockUpdateRequest } from './entities/stock-update-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, StockUpdateRequest])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
