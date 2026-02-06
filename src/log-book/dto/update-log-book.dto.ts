import { PartialType } from '@nestjs/swagger';
import { CreateLogBookDto } from './create-log-book.dto';

export class UpdateLogBookDto extends PartialType(CreateLogBookDto) {}
