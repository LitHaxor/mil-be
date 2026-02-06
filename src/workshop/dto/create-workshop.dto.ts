import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkshopDto {
  @ApiProperty({
    description: 'Workshop name',
    example: 'Central Armory Workshop',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Physical address of the workshop',
    example: '123 Military Base Rd, Fort Bragg, NC',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Military division or unit',
    example: '1st Infantry Division',
    required: false,
  })
  @IsString()
  @IsOptional()
  division?: string;

  @ApiProperty({
    description: 'Workshop description',
    example: 'Main maintenance facility for small arms',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
