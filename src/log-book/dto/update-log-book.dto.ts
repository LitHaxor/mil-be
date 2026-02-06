import { PartialType } from '@nestjs/mapped-types';
import { CreateLogBookDto } from './create-log-book.dto';

export class UpdateLogBookDto extends PartialType(CreateLogBookDto) {}
