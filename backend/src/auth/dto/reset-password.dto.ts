import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsStrongPassword } from '../../common/decorators/strong-password.decorator';
import { normalizeEmail, trimString } from './dto-transformers';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address receiving the password reset OTP.',
  })
  @Transform(normalizeEmail)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    example: 'hQ3c…',
    description:
      'Token returned by POST /auth/verify-reset-otp. Send this or the OTP.',
  })
  @ValidateIf((dto: ResetPasswordDto) => !dto.otp)
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  resetToken?: string;

  @ApiPropertyOptional({
    example: '123456',
    description:
      'Six-digit password reset OTP (older clients; prefer resetToken).',
  })
  @ValidateIf((dto: ResetPasswordDto) => !dto.resetToken)
  @Transform(trimString)
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be exactly 6 digits' })
  otp?: string;

  @ApiProperty({
    example: 'Str0ng-Pass!2026',
    minLength: 12,
    description:
      'New password. At least 12 characters with an uppercase letter, a number and a symbol.',
  })
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;
}
