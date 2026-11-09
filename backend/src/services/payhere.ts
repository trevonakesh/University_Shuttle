import crypto from 'crypto';

// PayHere (https://www.payhere.lk) checkout integration.
// Configure via env: PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET,
// PAYHERE_MODE=sandbox|live, PUBLIC_URL (must be reachable by PayHere for
// the notify callback — use a tunnel like ngrok in development).
const md5Upper = (s: string) =>
  crypto.createHash('md5').update(s).digest('hex').toUpperCase();

export const payhereConfig = () => ({
  merchantId: process.env.PAYHERE_MERCHANT_ID || '',
  merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || '',
  mode: (process.env.PAYHERE_MODE || 'sandbox').toLowerCase(),
  // publicUrl: where PayHere's SERVER calls back (notify) — must be
  // internet-reachable (tunnel in dev).
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, ''),
  // appUrl: what the STUDENT'S BROWSER opens (checkout + return pages).
  // localhost is fine when testing on this machine; set APP_PUBLIC_URL to a
  // reachable address when students pay from their phones.
  appUrl: (process.env.APP_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '')
});

// When no merchant credentials are set (local dev), payments fall back to
// instant completion instead of the card checkout.
export const payhereEnabled = (): boolean => {
  const c = payhereConfig();
  return Boolean(c.merchantId && c.merchantSecret);
};

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

// Online payments are switched off until ONLINE_PAYMENTS_ENABLED=true. In
// production they also need real PayHere credentials, so the local-dev
// instant-completion fallback can never settle a fare on the live server.
export const onlinePaymentsEnabled = (): boolean =>
  process.env.ONLINE_PAYMENTS_ENABLED === 'true' && (payhereEnabled() || !isProduction());

// Daily rides have no card checkout yet: paying one only records it. Allowed
// for local development, never in production.
export const dailyRidePaymentsEnabled = (): boolean =>
  process.env.ONLINE_PAYMENTS_ENABLED === 'true' && !isProduction();

export const PAYMENTS_COMING_SOON =
  'Online payments are coming soon. For now, please pay your driver in cash and they will mark it as paid.';

export const checkoutUrl = (): string =>
  payhereConfig().mode === 'live'
    ? 'https://www.payhere.lk/pay/checkout'
    : 'https://sandbox.payhere.lk/pay/checkout';

// Signature sent with the checkout form. Amount is fixed server-side, so a
// tampered amount invalidates the hash and PayHere rejects the payment.
export const generateCheckoutHash = (orderId: string, amount: number, currency = 'LKR'): string => {
  const { merchantId, merchantSecret } = payhereConfig();
  return md5Upper(merchantId + orderId + amount.toFixed(2) + currency + md5Upper(merchantSecret));
};

// Verifies the md5sig on PayHere's server-to-server notify callback.
export const verifyNotifySignature = (p: {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
}): boolean => {
  const { merchantSecret } = payhereConfig();
  const local = md5Upper(
    p.merchant_id + p.order_id + p.payhere_amount + p.payhere_currency + p.status_code + md5Upper(merchantSecret)
  );
  return local === (p.md5sig || '').toUpperCase();
};
