import { ConfigType, registerAs } from '@nestjs/config';

export const PAYPAL_LIVE_URL = 'https://api-m.paypal.com';
export const PAYPAL_SANDBOX_URL = 'https://api-m.sandbox.paypal.com';

/**
 * PayPal settings. Only PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required to take
 * payments; PAYPAL_WEBHOOK_ID enables the webhook (payments are also confirmed when the
 * buyer returns to the site). PAYPAL_MODE picks live (default) or sandbox.
 */
const paypalConfig = registerAs('paypal', () => {
  const mode =
    process.env.PAYPAL_MODE?.trim().toLowerCase() === 'sandbox'
      ? 'sandbox'
      : 'live';
  // The site's checkout result page unless set explicitly.
  const platformUrl = (
    process.env.APP_PLATFORM_URL || 'https://drsalehabdelkarim.com'
  ).replace(/\/+$/, '');
  const returnUrl =
    process.env.PAYPAL_RETURN_URL || `${platformUrl}/checkout/result`;

  return {
    mode,
    clientId: process.env.PAYPAL_CLIENT_ID?.trim(),
    clientSecret: process.env.PAYPAL_CLIENT_SECRET?.trim(),
    baseUrl:
      process.env.PAYPAL_BASE_URL ||
      (mode === 'sandbox' ? PAYPAL_SANDBOX_URL : PAYPAL_LIVE_URL),
    webhookId: process.env.PAYPAL_WEBHOOK_ID?.trim(),
    returnUrl,
    cancelUrl: process.env.PAYPAL_CANCEL_URL || returnUrl,
    brandName: process.env.PAYPAL_BRAND_NAME || 'Dr. Saleh Abdelkarim',
  };
});

export type PaypalConfig = ConfigType<typeof paypalConfig>;

export default paypalConfig;
