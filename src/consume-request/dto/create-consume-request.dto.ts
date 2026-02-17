import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConsumeRequestDto {
  @ApiProperty({
    description: 'User unit ID that needs the spare part',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  user_unit_id: string;

  @ApiProperty({
    description: 'Spare part ID being requested',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  spare_part_id: string;

  @ApiProperty({
    description: 'Quantity requested',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  requested_quantity: number;

  @ApiProperty({
    description: 'User ID who is making the request',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  requested_by_id: string;

  @ApiProperty({
    description: 'Job cart ID this request is related to (optional)',
    example: '880e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  job_cart_id?: string;

  @ApiProperty({
    description: 'Additional notes about the request',
    example: 'Urgent replacement needed',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
