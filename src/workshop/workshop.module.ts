import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopService } from './workshop.service';
import { WorkshopController } from './workshop.controller';
import { Workshop } from './entities/workshop.entity';
import { ConsumeRequest } from '../consume-request/entities/consume-request.entity';
import { UserUnit } from '../user-unit/entities/user-unit.entity';
import { User } from '../entities/user.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { LogBookModule } from '../log-book/log-book.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workshop,
      ConsumeRequest,
      UserUnit,
      User,
      Inventory,
    ]),
    LogBookModule,
  ],
  controllers: [WorkshopController],
  providers: [WorkshopService],
  exports: [WorkshopService],
})
export class WorkshopModule {}
