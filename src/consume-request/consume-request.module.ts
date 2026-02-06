import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumeRequestService } from './consume-request.service';
import { ConsumeRequestController } from './consume-request.controller';
import { ConsumeRequest } from './entities/consume-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConsumeRequest])],
  controllers: [ConsumeRequestController],
  providers: [ConsumeRequestService],
  exports: [ConsumeRequestService],
})
export class ConsumeRequestModule {}
