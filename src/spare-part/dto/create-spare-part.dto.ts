import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { EquipmentType } from '../entities/spare-part-template.entity';

export class CreateSparePartDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  part_number?: string;

  @IsEnum(EquipmentType)
  equipment_type: EquipmentType;

  @IsString()
  @IsOptional()
  compatible_models?: string;

  @IsOptional()
  specifications?: Record<string, any>;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsNumber()
  @IsOptional()
  unit_price?: number;
}
