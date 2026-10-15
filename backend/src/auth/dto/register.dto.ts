import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Gender } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsStrongPassword } from '../../common/decorators/strong-password.decorator';
import {
  normalizeEmail,
  normalizeReferralCode,
  trimString,
} from './dto-transformers';

export class RegisterDto {
  @ApiProperty({
    example: 'Ahmed Saleh',
    description: 'User full name.',
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: 'ahmed@example.com',
    description: 'Unique user email address.',
  })
  @Transform(normalizeEmail)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '+201001234567',
    description: 'Unique user phone number.',
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    example: 'Str0ng-Pass!2026',
    minLength: 12,
    description:
      'User password. At least 12 characters with an uppercase letter, a number and a symbol.',
  })
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiPropertyOptional({
    example: 'ABC123',
    maxLength: 64,
    description: 'Optional referral code shared by another user.',
  })
  @Transform(normalizeReferralCode)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Z0-9_-]+$/)
  referralCode?: string;

  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.Female,
    description:
      'Optional gender. Used to address the user with gendered copy.',
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
