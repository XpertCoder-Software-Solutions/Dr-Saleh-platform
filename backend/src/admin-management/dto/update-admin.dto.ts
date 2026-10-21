import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  ADMIN_PERMISSIONS,
  type AdminPermission,
} from '../../auth/admin-permissions';
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

  @ApiPropertyOptional({
    example: false,
    description:
      'Full access, including managing staff accounts. Defaults to false (staff).',
  })
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  @ApiPropertyOptional({
    enum: ADMIN_PERMISSIONS,
    isArray: true,
    example: ['courses', 'blog'],
    description: 'Dashboard sections a staff admin can use.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(ADMIN_PERMISSIONS, { each: true })
  adminPermissions?: AdminPermission[];
}
