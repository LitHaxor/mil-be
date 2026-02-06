import { IsUUID, IsNotEmpty, IsEnum, IsString, IsOptional } from 'class-validator';
import { LogType } from '../entities/log-book.entity';

export class CreateLogBookDto {
  @IsUUID()
  @IsNotEmpty()
  user_unit_id: string;

  @IsEnum(LogType)
  log_type: LogType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID()
  @IsOptional()
  performed_by_id?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
