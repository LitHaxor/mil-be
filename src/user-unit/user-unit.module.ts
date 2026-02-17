import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserUnitService } from './user-unit.service';
import { UserUnitController } from './user-unit.controller';
import { UserUnit } from './entities/user-unit.entity';
import { LogBookModule } from '../log-book/log-book.module';
import { Entry } from '../entities/entry.entity';
import { Exit } from '../entities/exit.entity';
import { ConsumeRequest } from '../entities/consume-request.entity';
import { LogBook } from '../log-book/entities/log-book.entity';
import { JobCart } from '../entities/job-cart.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { Workshop } from '../workshop/entities/workshop.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserUnit,
      Entry,
      Exit,
      ConsumeRequest,
      LogBook,
      JobCart,
      ChatMessage,
      Workshop,
    ]),
    LogBookModule,
  ],
  controllers: [UserUnitController],
  providers: [UserUnitService],
  exports: [UserUnitService],
})
export class UserUnitModule {}
