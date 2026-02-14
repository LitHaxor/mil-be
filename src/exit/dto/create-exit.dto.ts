import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateExitDto {
  @ApiProperty({
    description: 'Entry ID for which this exit is being created',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  entry_id: string;

  @ApiPropertyOptional({
    description: 'Odometer or hour meter reading at exit (in KM)',
    example: 125500,
  })
  @IsOptional()
  @IsNumber()
  odometer_km?: number;

  @ApiPropertyOptional({
    description: 'Summary of work performed during workshop stay',
    example: 'Oil change completed, gear box replaced, brake pads serviced',
  })
  @IsOptional()
  @IsString()
  work_performed?: string;

  @ApiPropertyOptional({
    description: 'Vehicle condition notes at exit',
    example: 'All systems operational, test drive completed successfully',
  })
  @IsOptional()
  @IsString()
  exit_condition_notes?: string;
}
