import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  ADMIN_PERMISSIONS,
  type AdminPermission,
} from '../../auth/admin-permissions';
import { IsStrongPassword } from '../../common/decorators/strong-password.decorator';
import {
  normalizeEmail,
  toOptionalBoolean,
  trimString,
} from './dto-transformers';

export class CreateAdminDto {
  @ApiProperty({ example: 'Admin Name', maxLength: 150 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @ApiProperty({ example: 'admin@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '01000000000', maxLength: 32 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phoneNumber: string;

  @ApiProperty({ example: 'Str0ng-Pass!2026', minLength: 12 })
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

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
