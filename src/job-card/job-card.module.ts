import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobCardService } from './job-card.service';
import { JobCardController } from './job-card.controller';
import { JobCard } from '../entities/job-card.entity';
import { Entry } from '../entities/entry.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { LogBookModule } from '../log-book/log-book.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobCard, Entry, Inventory]),
    LogBookModule,
  ],
  controllers: [JobCardController],
  providers: [JobCardService],
  exports: [JobCardService],
})
export class JobCardModule {}
