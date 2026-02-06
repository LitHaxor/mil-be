import { PartialType } from '@nestjs/swagger';
import { CreateSourceRequestDto } from './create-source-request.dto';

export class UpdateSourceRequestDto extends PartialType(CreateSourceRequestDto) {}
