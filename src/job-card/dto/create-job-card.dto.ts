import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateJobCardDto {
  @ApiProperty({
    description: 'Entry ID for which this job card is created',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  entry_id: string;

  @ApiProperty({
    description: 'Spare part ID needed for repair',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  spare_part_id: string;

  @ApiProperty({
    description: 'Quantity of spare parts requested',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  requested_quantity: number;

  @ApiPropertyOptional({
    description: 'Additional notes or justification for the request',
    example: 'Engine oil replacement - vehicle has covered 5000km since last service',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
