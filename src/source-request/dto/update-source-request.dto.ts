import { PartialType } from '@nestjs/mapped-types';
import { CreateSourceRequestDto } from './create-source-request.dto';

export class UpdateSourceRequestDto extends PartialType(CreateSourceRequestDto) {}
