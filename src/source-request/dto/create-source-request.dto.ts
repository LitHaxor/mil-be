import { IsUUID, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSourceRequestDto {
  @IsUUID()
  @IsNotEmpty()
  workshop_id: string;

  @IsUUID()
  @IsNotEmpty()
  spare_part_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsUUID()
  @IsNotEmpty()
  requested_by_id: string;

  @IsString()
  @IsOptional()
  supplier_name?: string;

  @IsNumber()
  @IsOptional()
  total_cost?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
