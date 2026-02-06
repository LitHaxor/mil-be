import { IsUUID, IsNotEmpty, IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LogType } from '../entities/log-book.entity';

export class CreateLogBookDto {
  @ApiProperty({
    description: 'User unit ID this log entry is for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  user_unit_id: string;

  @ApiProperty({
    description: 'Type of log entry',
    enum: LogType,
    example: LogType.MAINTENANCE,
  })
  @IsEnum(LogType)
  log_type: LogType;

  @ApiProperty({
    description: 'Description of the log entry',
    example: 'Cleaned and lubricated barrel, replaced firing pin',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'User ID who performed the action',
    example: '770e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  performed_by_id?: string;

  @ApiProperty({
    description: 'Additional metadata',
    example: { parts_used: ['barrel_cleaner', 'lubricant'] },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
