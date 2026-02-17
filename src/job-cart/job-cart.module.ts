import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobCartService } from './job-cart.service';
import { JobCartController } from './job-cart.controller';
import { JobCart } from '../entities/job-cart.entity';
import { Entry } from '../entities/entry.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { UserUnit } from '../user-unit/entities/user-unit.entity';
import { ConsumeRequest } from '../consume-request/entities/consume-request.entity';
import { LogBookModule } from '../log-book/log-book.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobCart,
      Entry,
      Inventory,
      UserUnit,
      ConsumeRequest,
    ]),
    LogBookModule,
  ],
  controllers: [JobCartController],
  providers: [JobCartService],
  exports: [JobCartService],
})
export class JobCartModule {}
