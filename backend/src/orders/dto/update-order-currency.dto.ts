import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateOrderCurrencyDto {
  @ApiProperty({
    enum: Currency,
    description:
      'EGP for Paymob (cards, Apple Pay, wallets), USD for PayPal. Orders with physical items stay in EGP.',
  })
  @IsEnum(Currency)
  currency!: Currency;
}
