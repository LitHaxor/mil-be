import { IsUUID, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateConsumeRequestDto {
  @IsUUID()
  @IsNotEmpty()
  user_unit_id: string;

  @IsUUID()
  @IsNotEmpty()
  spare_part_id: string;

  @IsNumber()
  @Min(1)
  requested_quantity: number;

  @IsUUID()
  @IsNotEmpty()
  requested_by_id: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
