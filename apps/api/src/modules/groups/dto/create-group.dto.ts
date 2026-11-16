import { Permission } from '@tomato/constants';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsArray()
  @ArrayUnique()
  @IsIn(Object.values(Permission), { each: true })
  permissions: Permission[];
}
