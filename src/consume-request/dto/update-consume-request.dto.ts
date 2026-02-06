import { PartialType } from '@nestjs/mapped-types';
import { CreateConsumeRequestDto } from './create-consume-request.dto';

export class UpdateConsumeRequestDto extends PartialType(CreateConsumeRequestDto) {}
