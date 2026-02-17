import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CompleteJobCartDto {
  @ApiPropertyOptional({
    description: 'Optional completion notes',
    example: 'Maintenance work completed, unit ready for inspection',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
