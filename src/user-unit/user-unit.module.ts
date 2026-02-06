import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserUnitService } from './user-unit.service';
import { UserUnitController } from './user-unit.controller';
import { UserUnit } from './entities/user-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserUnit])],
  controllers: [UserUnitController],
  providers: [UserUnitService],
  exports: [UserUnitService],
})
export class UserUnitModule {}
