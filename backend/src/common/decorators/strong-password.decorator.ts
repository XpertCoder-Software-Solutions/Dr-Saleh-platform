import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength } from 'class-validator';

export const STRONG_PASSWORD_MIN_LENGTH = 12;

/** 12+ characters with at least one uppercase letter, one digit and one symbol. */
export const STRONG_PASSWORD_PATTERN =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{12,}$/;

/**
 * Password policy for new passwords (sign-up, reset, change, admin accounts).
 * The message starts with "<field> must be at least 12 characters" — the website
 * translates it from that prefix.
 */
export function IsStrongPassword(): PropertyDecorator {
  return applyDecorators(
    IsString(),
    MaxLength(128),
    Matches(STRONG_PASSWORD_PATTERN, {
      message: ({ property }) =>
        `${property} must be at least ${STRONG_PASSWORD_MIN_LENGTH} characters and include an uppercase letter, a number and a symbol`,
    }),
  );
}
