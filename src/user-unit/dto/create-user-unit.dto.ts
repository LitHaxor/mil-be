import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UnitType } from '../entities/user-unit.entity';

export class CreateUserUnitDto {
  @ApiProperty({
    description: 'Type of unit',
    enum: UnitType,
    example: UnitType.WEAPON,
  })
  @IsEnum(UnitType)
  unit_type: UnitType;

  @ApiProperty({
    description: 'Workshop ID where the unit is located',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  workshop_id: string;

  @ApiProperty({
    description: 'BA/Regiment Number (unique identifier)',
    example: 26631,
    required: false,
  })
  @IsInt()
  @IsOptional()
  ba_regt_no?: number;

  @ApiProperty({
    description: 'Full name with make and model',
    example: 'Motor Cycle 125cc Runner Turbo',
    required: false,
  })
  @IsString()
  @IsOptional()
  full_name_with_model?: string;

  @ApiProperty({
    description: 'Country of Origin',
    example: 'Bangladesh',
    required: false,
  })
  @IsString()
  @IsOptional()
  country_of_origin?: string;

  @ApiProperty({
    description: 'Issue date',
    example: '2017-12-28',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  issue_date?: Date;

  @ApiProperty({
    description: 'Present kilometers',
    example: 25850,
    required: false,
  })
  @IsInt()
  @IsOptional()
  present_km?: number;

  @ApiProperty({
    description: 'Present age (year & month format)',
    example: '06 Yr 11 Month',
    required: false,
  })
  @IsString()
  @IsOptional()
  present_age?: string;

  @ApiProperty({
    description: 'Overhauling date',
    example: '2024-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  overhauling_date?: Date;

  @ApiProperty({
    description: 'CI (Classification/Identification)',
    example: 'CI-1A',
    required: false,
  })
  @IsString()
  @IsOptional()
  ci?: string;

  @ApiProperty({
    description: 'Auth (Authorized)',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  auth?: number;

  @ApiProperty({
    description: 'Held',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  held?: number;

  @ApiProperty({
    description: 'Unit',
    example: 'HQ 10 Inf Div',
    required: false,
  })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({
    description: 'Maintenance Workshop',
    example: 'Wdsp',
    required: false,
  })
  @IsString()
  @IsOptional()
  maint_wksp?: string;

  @ApiProperty({
    description: 'Remarks',
    example: '149',
    required: false,
  })
  @IsString()
  @IsOptional()
  rmk?: string;
}
