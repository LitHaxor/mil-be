import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EquipmentType } from '../entities/spare-part-template.entity';

export class CreateSparePartDto {
  @ApiProperty({
    description: 'Name of the spare part',
    example: 'M16 Barrel',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Part number or SKU',
    example: 'SP-001-M16',
    required: false,
  })
  @IsString()
  @IsOptional()
  part_number?: string;

  @ApiProperty({
    description: 'Type of equipment this part is for',
    enum: EquipmentType,
    example: EquipmentType.WEAPON,
  })
  @IsEnum(EquipmentType)
  equipment_type: EquipmentType;

  @ApiProperty({
    description: 'Compatible models for this part',
    example: 'M16A1, M16A2, M16A4',
    required: false,
  })
  @IsString()
  @IsOptional()
  compatible_models?: string;

  @ApiProperty({
    description: 'Technical specifications',
    example: { caliber: '5.56mm', length: '508mm' },
    required: false,
  })
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiProperty({
    description: 'Detailed description of the spare part',
    example: 'Standard barrel for M16 rifle',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Manufacturer name',
    example: 'Colt Manufacturing',
    required: false,
  })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({
    description: 'Unit price in USD',
    example: 250.00,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  unit_price?: number;
}
