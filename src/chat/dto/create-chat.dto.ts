import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

export class CreateChatDto {
  @IsUUID()
  @IsNotEmpty()
  user_unit_id: string;

  @IsUUID()
  @IsNotEmpty()
  sender_id: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
