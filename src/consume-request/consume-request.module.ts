import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumeRequestService } from './consume-request.service';
import { ConsumeRequestController } from './consume-request.controller';
import { ConsumeRequest } from './entities/consume-request.entity';
import { LogBookModule } from '../log-book/log-book.module';

@Module({
  imports: [TypeOrmModule.forFeature([ConsumeRequest]), LogBookModule],
  controllers: [ConsumeRequestController],
  providers: [ConsumeRequestService],
  exports: [ConsumeRequestService],
})
export class ConsumeRequestModule {}
