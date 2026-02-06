import { IsUUID, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatDto {
  @ApiProperty({
    description: 'User unit ID this message is associated with',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  user_unit_id: string;

  @ApiProperty({
    description: 'User ID of the message sender',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  sender_id: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Maintenance completed successfully',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
