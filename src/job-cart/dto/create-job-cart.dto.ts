import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateJobCartDto {
  @ApiProperty({
    description: 'Entry ID for which this job cart is created',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  entry_id: string;

  @ApiPropertyOptional({
    description: 'Spare part ID needed for repair (optional)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  spare_part_id?: string;

  @ApiPropertyOptional({
    description: 'Quantity of spare parts requested',
    example: 2,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  requested_quantity?: number;

  @ApiPropertyOptional({
    description: 'Additional notes or justification for the request',
    example:
      'Engine oil replacement - vehicle has covered 5000km since last service',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
