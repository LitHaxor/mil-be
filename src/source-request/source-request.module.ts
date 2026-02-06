import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SourceRequestService } from './source-request.service';
import { SourceRequestController } from './source-request.controller';
import { SourceRequest } from './entities/source-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SourceRequest])],
  controllers: [SourceRequestController],
  providers: [SourceRequestService],
  exports: [SourceRequestService],
})
export class SourceRequestModule {}
