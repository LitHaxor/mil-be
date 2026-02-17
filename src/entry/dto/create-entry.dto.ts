import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateEntryDto {
  @ApiProperty({
    description: 'Workshop ID where the unit is entering',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  workshop_id: string;

  @ApiProperty({
    description: 'Unit ID (vehicle/weapon) entering the workshop',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  user_unit_id: string;

  @ApiPropertyOptional({
    description: 'BA Number (Book Authorization Number)',
    example: '21040',
  })
  @IsOptional()
  @IsString()
  ba_no?: string;

  @ApiPropertyOptional({
    description: 'Unit/Battalion name (e.g., 149F6 Wscp Coy, 1Fd, CM1)',
    example: '149F6 Wscp Coy',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Odometer or hour meter reading at entry (in KM)',
    example: 125000,
  })
  @IsOptional()
  @IsNumber()
  odometer_km?: number;

  @ApiPropertyOptional({
    description: 'Physical condition notes at entry',
    example: 'Engine making unusual noise, visible wear on tires',
  })
  @IsOptional()
  @IsString()
  condition_notes?: string;

  @ApiPropertyOptional({
    description: 'Reported issues/defects that need repair',
    example: 'Oil leak detected, brake pads worn',
  })
  @IsOptional()
  @IsString()
  reported_issues?: string;
}
