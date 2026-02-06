import { IsUUID, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSourceRequestDto {
  @ApiProperty({
    description: 'Workshop ID requesting the parts',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  workshop_id: string;

  @ApiProperty({
    description: 'Spare part ID to be sourced',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  spare_part_id: string;

  @ApiProperty({
    description: 'Quantity to be sourced',
    example: 25,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'User ID who is making the request',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  requested_by_id: string;

  @ApiProperty({
    description: 'Name of the supplier',
    example: 'Defense Supply Co.',
    required: false,
  })
  @IsString()
  @IsOptional()
  supplier_name?: string;

  @ApiProperty({
    description: 'Total cost of the sourcing request',
    example: 5000.00,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  total_cost?: number;

  @ApiProperty({
    description: 'Additional notes about the request',
    example: 'Needed for upcoming deployment',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
