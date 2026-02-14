import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectJobCardDto {
  @ApiProperty({
    description: 'Rejection reason (required)',
    example: 'Part not essential for current repair, unnecessary expense',
  })
  @IsString()
  @IsNotEmpty()
  rejection_reason: string;
}
