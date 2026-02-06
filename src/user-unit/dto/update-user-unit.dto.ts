import { PartialType } from '@nestjs/mapped-types';
import { CreateUserUnitDto } from './create-user-unit.dto';

export class UpdateUserUnitDto extends PartialType(CreateUserUnitDto) {}
