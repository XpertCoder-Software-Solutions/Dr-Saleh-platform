import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleName } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { createHash } from 'crypto';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChangePasswordDto } from '../users/dto/change-password.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OtpService } from './services/otp.service';
import { PasswordService } from './services/password.service';

const userId = '7c2f6a1e-2f7e-4c5b-9a55-0d0a2b7d4c11';
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

function createUser(overrides: Record<string, unknown> = {}) {
  return {
    id: userId,
    fullName: 'Test User',
    email: 'user@example.com',
    passwordResetOtpHash: 'otp-hash',
    passwordResetOtpExpiresAt: new Date(Date.now() + 60_000),
    passwordResetAttempts: 0,
    role: { name: RoleName.User },
    ...overrides,
  };
}

describe('Password reset in steps', () => {
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    passwordResetToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let otpService: { isExpired: jest.Mock; compareOtp: jest.Mock };
  let passwordService: { hashPassword: jest.Mock };
  let notifications: { sendPasswordChanged: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(createUser()),
        update: jest.fn().mockResolvedValue({}),
      },
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    otpService = {
      isExpired: jest.fn().mockReturnValue(false),
      compareOtp: jest.fn().mockResolvedValue(true),
    };
    passwordService = { hashPassword: jest.fn().mockResolvedValue('new-hash') };
    notifications = {
      sendPasswordChanged: jest.fn().mockResolvedValue(undefined),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      passwordService as unknown as PasswordService,
      otpService as unknown as OtpService,
      notifications as unknown as NotificationsService,
      {
        get: jest.fn((key: string) =>
          key.startsWith('JWT_') ? 'test-secret-value' : undefined,
        ),
      } as unknown as ConfigService,
      {} as JwtService,
      { logAction: jest.fn() } as unknown as AuditLogService,
    );
  });

  it('verifies the OTP, uses it up and returns a reset token stored as a hash', async () => {
    const res = await service.verifyPasswordResetOtp({
      email: 'User@Example.com',
      otp: '123456',
    });

    expect(res.data.resetToken).toMatch(/^[\w-]{40,}$/);
    expect(res.data.expiresInSeconds).toBe(900);
    const created = (
      prisma.passwordResetToken.create.mock.calls[0] as [
        { data: { tokenHash: string; userId: string } },
      ]
    )[0].data;
    expect(created.userId).toBe(userId);
    expect(created.tokenHash).toBe(sha256(res.data.resetToken));
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passwordResetOtpHash: null }) as object,
      }),
    );
  });

  it('rejects a wrong OTP and counts the attempt', async () => {
    otpService.compareOtp.mockResolvedValue(false);

    await expect(
      service.verifyPasswordResetOtp({
        email: 'user@example.com',
        otp: '000000',
      }),
    ).rejects.toThrow('Invalid password reset OTP.');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { passwordResetAttempts: { increment: 1 } },
      }),
    );
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('sets the new password with a valid reset token and marks the token used', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'token-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: userId,
        fullName: 'Test User',
        email: 'user@example.com',
        role: { name: RoleName.User },
      },
    });

    await service.resetPassword({
      email: 'user@example.com',
      resetToken: 'the-token',
      newPassword: 'Str0ng-Pass!2026',
    });

    expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: sha256('the-token') } }),
    );
    expect(passwordService.hashPassword).toHaveBeenCalledWith(
      'Str0ng-Pass!2026',
    );
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'token-1' } }),
    );
    expect(notifications.sendPasswordChanged).toHaveBeenCalled();
  });

  it.each([
    ['unknown', null],
    ['used', { usedAt: new Date() }],
    ['expired', { expiresAt: new Date(Date.now() - 1000) }],
    [
      'for another email',
      {
        user: {
          id: userId,
          fullName: 'x',
          email: 'other@example.com',
          role: { name: RoleName.User },
        },
      },
    ],
  ])('refuses a %s reset token', async (_label, patch) => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(
      patch === null
        ? null
        : {
            id: 'token-1',
            usedAt: null,
            expiresAt: new Date(Date.now() + 60_000),
            user: {
              id: userId,
              fullName: 'Test User',
              email: 'user@example.com',
              role: { name: RoleName.User },
            },
            ...patch,
          },
    );

    await expect(
      service.resetPassword({
        email: 'user@example.com',
        resetToken: 'the-token',
        newPassword: 'Str0ng-Pass!2026',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(passwordService.hashPassword).not.toHaveBeenCalled();
  });
});

describe('Strong password policy', () => {
  const base = {
    fullName: 'Ahmed Saleh',
    email: 'ahmed@example.com',
    phoneNumber: '+201001234567',
  };

  it.each(['Short1!', 'alllowercase1!x', 'NoDigitsHere!!', 'NoSymbols12345'])(
    'rejects %s',
    async (password) => {
      const errors = await validate(
        plainToInstance(RegisterDto, { ...base, password }),
      );
      expect(errors.map((e) => e.property)).toContain('password');
      expect(JSON.stringify(errors)).toContain(
        'password must be at least 12 characters',
      );
    },
  );

  it('accepts a 12+ character password with an uppercase letter, a number and a symbol', async () => {
    const errors = await validate(
      plainToInstance(RegisterDto, { ...base, password: 'Str0ng-Pass!2026' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('applies to reset and change password too', async () => {
    const reset = await validate(
      plainToInstance(ResetPasswordDto, {
        email: 'a@b.com',
        resetToken: 't',
        newPassword: 'weakpass',
      }),
    );
    const change = await validate(
      plainToInstance(ChangePasswordDto, {
        currentPassword: 'old',
        newPassword: 'weakpass',
      }),
    );
    expect(reset.map((e) => e.property)).toEqual(['newPassword']);
    expect(change.map((e) => e.property)).toEqual(['newPassword']);
  });

  it('needs either a reset token or an OTP', async () => {
    const errors = await validate(
      plainToInstance(ResetPasswordDto, {
        email: 'a@b.com',
        newPassword: 'Str0ng-Pass!2026',
      }),
    );
    expect(errors.map((e) => e.property).sort()).toEqual(['otp', 'resetToken']);
  });
});
