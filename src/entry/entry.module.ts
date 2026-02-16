import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntryService } from './entry.service';
import { EntryController } from './entry.controller';
import { Entry } from '../entities/entry.entity';
import { Workshop } from '../workshop/entities/workshop.entity';
import { UserUnit } from '../user-unit/entities/user-unit.entity';
import { JobCart } from '../entities/job-cart.entity';
import { LogBookModule } from '../log-book/log-book.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entry, Workshop, UserUnit, JobCart]),
    LogBookModule,
  ],
  controllers: [EntryController],
  providers: [EntryService],
  exports: [EntryService],
})
export class EntryModule {}
