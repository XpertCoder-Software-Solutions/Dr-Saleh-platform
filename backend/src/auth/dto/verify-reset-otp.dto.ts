import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { normalizeEmail, trimString } from './dto-transformers';

export class VerifyResetOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address that received the password reset OTP.',
  })
  @Transform(normalizeEmail)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Six-digit password reset OTP.',
  })
  @Transform(trimString)
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be exactly 6 digits' })
  otp: string;
}
