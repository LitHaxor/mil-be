import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveJobCartDto {
  @ApiPropertyOptional({
    description: 'Optional approval notes',
    example: 'Approved - part available in stock',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
