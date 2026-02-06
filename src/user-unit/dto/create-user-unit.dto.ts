import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UnitType } from '../entities/user-unit.entity';

export class CreateUserUnitDto {
  @ApiProperty({
    description: 'Name or designation of the unit',
    example: 'Alpha Squad M16 #5',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Unique unit identification number',
    example: 'W-12345-A',
  })
  @IsString()
  @IsNotEmpty()
  unit_number: string;

  @ApiProperty({
    description: 'Type of unit',
    enum: UnitType,
    example: UnitType.WEAPON,
  })
  @IsEnum(UnitType)
  unit_type: UnitType;

  @ApiProperty({
    description: 'Model name',
    example: 'M16A4',
    required: false,
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({
    description: 'Manufacturer name',
    example: 'Colt',
    required: false,
  })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({
    description: 'Technical specifications',
    example: { caliber: '5.56mm', barrel_length: '508mm' },
    required: false,
  })
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiProperty({
    description: 'Workshop ID where the unit is located',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  workshop_id: string;
}
