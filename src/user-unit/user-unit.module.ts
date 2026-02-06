import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserUnitService } from './user-unit.service';
import { UserUnitController } from './user-unit.controller';
import { UserUnit } from './entities/user-unit.entity';
import { LogBookModule } from '../log-book/log-book.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserUnit]), LogBookModule],
  controllers: [UserUnitController],
  providers: [UserUnitService],
  exports: [UserUnitService],
})
export class UserUnitModule {}
