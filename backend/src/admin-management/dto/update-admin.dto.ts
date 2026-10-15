import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsStrongPassword } from '../../common/decorators/strong-password.decorator';
import { toOptionalBoolean, trimString } from './dto-transformers';

export class UpdateAdminDto {
  @ApiPropertyOptional({ example: 'Updated Name', maxLength: 150 })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ example: '01000000000', maxLength: 32 })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phoneNumber?: string;

  @ApiPropertyOptional({ example: true })
  @Transform(toOptionalBoolean)
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Str0ng-Pass!2026', minLength: 12 })
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty()
  @IsStrongPassword()
  password?: string;
}
