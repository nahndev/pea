import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/** A password signs the user out everywhere */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
