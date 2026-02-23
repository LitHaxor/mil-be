import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateStockUpdateRequestDto {
  @ApiProperty({
    description: 'Quantity to add to the current stock level',
    example: 50,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity_to_add: number;

  @ApiPropertyOptional({
    description: 'Reason for the stock increase request',
    example: 'Received new shipment from supplier',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
