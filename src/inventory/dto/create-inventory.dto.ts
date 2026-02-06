import { IsUUID, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({
    description: 'Workshop ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  workshop_id: string;

  @ApiProperty({
    description: 'Spare part ID',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  spare_part_id: string;

  @ApiProperty({
    description: 'Current quantity in stock',
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Minimum quantity threshold for alerts',
    example: 10,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  min_quantity?: number;

  @ApiProperty({
    description: 'Storage location within the workshop',
    example: 'Shelf A-3, Bin 12',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Additional notes about this inventory item',
    example: 'Recently restocked',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
