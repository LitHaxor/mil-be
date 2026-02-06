import { PartialType } from '@nestjs/swagger';
import { CreateConsumeRequestDto } from './create-consume-request.dto';

export class UpdateConsumeRequestDto extends PartialType(CreateConsumeRequestDto) {}
