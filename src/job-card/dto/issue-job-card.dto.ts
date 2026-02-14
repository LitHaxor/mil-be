import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class IssueJobCardDto {
  @ApiPropertyOptional({
    description: 'Optional delivery/issue notes',
    example: 'Parts handed over to mechanic, signed receipt received',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
