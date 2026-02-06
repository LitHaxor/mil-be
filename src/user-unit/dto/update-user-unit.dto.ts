import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateUserUnitDto } from './create-user-unit.dto';
import { UnitStatus } from '../entities/user-unit.entity';

export class UpdateUserUnitDto extends PartialType(CreateUserUnitDto) {
  @ApiProperty({
    description: 'Current status of the unit',
    enum: UnitStatus,
    required: false,
  })
  @IsEnum(UnitStatus)
  @IsOptional()
  status?: UnitStatus;
}
