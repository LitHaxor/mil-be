import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class AssignRolesDto {
  @ApiPropertyOptional({
    description: 'Inspector (RI&I) user ID to assign to workshop',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  inspector_id?: string;

  @ApiPropertyOptional({
    description: 'Store Man user ID to assign to workshop',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  store_man_id?: string;

  @ApiPropertyOptional({
    description: 'Captain user ID to assign to workshop',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  captain_id?: string;

  @ApiPropertyOptional({
    description: 'OC user ID to assign to workshop',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsUUID()
  oc_id?: string;
}
