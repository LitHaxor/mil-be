import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UnitType } from '../entities/user-unit.entity';

export class CreateUserUnitDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  unit_number: string;

  @IsEnum(UnitType)
  unit_type: UnitType;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsOptional()
  specifications?: Record<string, any>;

  @IsUUID()
  @IsNotEmpty()
  workshop_id: string;
}
