import { IsUUID, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsUUID()
  @IsNotEmpty()
  workshop_id: string;

  @IsUUID()
  @IsNotEmpty()
  spare_part_id: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  min_quantity?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
