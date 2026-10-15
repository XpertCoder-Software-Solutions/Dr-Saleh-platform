import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsStrongPassword } from '../../common/decorators/strong-password.decorator';
import { normalizeEmail, trimString } from './dto-transformers';

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
}
