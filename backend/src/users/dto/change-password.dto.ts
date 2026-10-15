import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../../common/decorators/strong-password.decorator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'Str0ng-Pass!2026', minLength: 12 })
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;
}
