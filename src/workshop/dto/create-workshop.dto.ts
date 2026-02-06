import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateWorkshopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  division?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
