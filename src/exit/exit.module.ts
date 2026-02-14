import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExitService } from './exit.service';
import { ExitController } from './exit.controller';
import { Exit } from '../entities/exit.entity';
import { Entry } from '../entities/entry.entity';
import { LogBookModule } from '../log-book/log-book.module';

@Module({
  imports: [TypeOrmModule.forFeature([Exit, Entry]), LogBookModule],
  controllers: [ExitController],
  providers: [ExitService],
  exports: [ExitService],
})
export class ExitModule {}
