import { PartialType } from '@nestjs/swagger';
import { CreateUserUnitDto } from './create-user-unit.dto';

export class UpdateUserUnitDto extends PartialType(CreateUserUnitDto) {}
