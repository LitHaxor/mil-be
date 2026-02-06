import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SparePartService } from './spare-part.service';
import { SparePartController } from './spare-part.controller';
import { SparePartTemplate } from './entities/spare-part-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SparePartTemplate])],
  controllers: [SparePartController],
  providers: [SparePartService],
  exports: [SparePartService],
})
export class SparePartModule {}
