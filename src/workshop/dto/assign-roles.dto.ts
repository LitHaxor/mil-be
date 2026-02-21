import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, ValidateIf } from 'class-validator';

export class AssignRolesDto {
  @ApiPropertyOptional({
    description: 'Inspector (RI&I) user ID to assign to workshop, or null to unassign',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.inspector_id !== null)
  @IsUUID()
  inspector_id?: string | null;

  @ApiPropertyOptional({
    description: 'Store Man user ID to assign to workshop, or null to unassign',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.store_man_id !== null)
  @IsUUID()
  store_man_id?: string | null;

  @ApiPropertyOptional({
    description: 'Captain user ID to assign to workshop, or null to unassign',
    example: '123e4567-e89b-12d3-a456-426614174002',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.captain_id !== null)
  @IsUUID()
  captain_id?: string | null;

  @ApiPropertyOptional({
    description: 'OC user ID to assign to workshop, or null to unassign',
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.oc_id !== null)
  @IsUUID()
  oc_id?: string | null;
}
