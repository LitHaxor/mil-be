import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class UpdateEntryDto {
  @ApiPropertyOptional({
    description: 'Updated odometer or hour meter reading (in KM)',
    example: 125100,
  })
  @IsOptional()
  @IsNumber()
  odometer_km?: number;

  @ApiPropertyOptional({
    description: 'Updated physical condition notes',
    example: 'Additional damage found on chassis',
  })
  @IsOptional()
  @IsString()
  condition_notes?: string;

  @ApiPropertyOptional({
    description: 'Updated reported issues',
    example: 'Also needs transmission fluid replacement',
  })
  @IsOptional()
  @IsString()
  reported_issues?: string;
}
