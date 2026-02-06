import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogBookService } from './log-book.service';
import { LogBookController } from './log-book.controller';
import { LogBook } from './entities/log-book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogBook])],
  controllers: [LogBookController],
  providers: [LogBookService],
  exports: [LogBookService],
})
export class LogBookModule {}
