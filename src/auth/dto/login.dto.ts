import {
  IsEmail,
  IsString,
  MinLength,
  ValidateIf,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'user@example.com',
  })
  @ValidateIf((o) => !o.user_ba_no)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User BA Number (digits as string)',
    example: '123456',
  })
  @ValidateIf((o) => !o.email)
  @Type(() => String)
  @IsString()
  @Matches(/^[0-9]+$/, { message: 'User BA Number must contain only digits' })
  user_ba_no?: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
