import { ConfigType, registerAs } from '@nestjs/config';

const trimSlash = (url: string) => url.replace(/\/+$/, '');

/**
 * Paymob (cards, mobile wallets, Apple Pay) for EGP orders.
 *
 * Required: PAYMOB_SECRET_KEY, PAYMOB_PUBLIC_KEY, PAYMOB_HMAC_SECRET and the integration id
 * of each channel to offer (PAYMOB_INTEGRATION_ID_CARD / _WALLET / _APPLE_PAY); a channel
 * without an id is simply not shown. The callback and return URLs default to the API and
 * site addresses (APP_PUBLIC_URL / APP_PLATFORM_URL), so they only need setting to override.
 */
const paymobConfig = registerAs('paymob', () => {
  const apiUrl = trimSlash(
    process.env.APP_PUBLIC_URL || 'https://api.drsalehabdelkarim.com',
  );
  const apiPrefix = (process.env.API_PREFIX ?? 'api').replace(/^\/+|\/+$/g, '');
  const siteUrl = trimSlash(
    process.env.APP_PLATFORM_URL || 'https://drsalehabdelkarim.com',
  );
  const clean = (value?: string) => value?.trim() || undefined;

  return {
    baseUrl: trimSlash(
      process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com',
    ),
    checkoutUrl:
      process.env.PAYMOB_CHECKOUT_URL ||
      'https://accept.paymob.com/unifiedcheckout/',
    secretKey: clean(process.env.PAYMOB_SECRET_KEY),
    publicKey: clean(process.env.PAYMOB_PUBLIC_KEY),
    hmacSecret: clean(process.env.PAYMOB_HMAC_SECRET),
    integrationIdCard: clean(process.env.PAYMOB_INTEGRATION_ID_CARD),
    integrationIdWallet: clean(process.env.PAYMOB_INTEGRATION_ID_WALLET),
    integrationIdApplePay: clean(process.env.PAYMOB_INTEGRATION_ID_APPLE_PAY),
    notificationUrl:
      process.env.PAYMOB_NOTIFICATION_URL ||
      `${apiUrl}${apiPrefix ? `/${apiPrefix}` : ''}/payments/paymob/webhook`,
    redirectionUrl:
      process.env.PAYMOB_REDIRECTION_URL || `${siteUrl}/checkout/result`,
  };
});

export type PaymobConfig = ConfigType<typeof paymobConfig>;

export default paymobConfig;
