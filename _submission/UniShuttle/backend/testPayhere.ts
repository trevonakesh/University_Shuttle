// Unit tests for the PayHere signature helpers.
// Run: npx ts-node --transpile-only testPayhere.ts
import crypto from 'crypto';

process.env.PAYHERE_MERCHANT_ID = '1211149';
process.env.PAYHERE_MERCHANT_SECRET = 'test_secret_123';
process.env.PAYHERE_MODE = 'sandbox';

import { payhereEnabled, checkoutUrl, generateCheckoutHash, verifyNotifySignature } from './src/services/payhere';

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
};

const md5U = (s: string) => crypto.createHash('md5').update(s).digest('hex').toUpperCase();

check('enabled with creds', payhereEnabled() === true);
check('sandbox checkout url', checkoutUrl() === 'https://sandbox.payhere.lk/pay/checkout');

// Hash formula per PayHere docs:
// md5(merchant_id + order_id + amount + currency + md5(secret)) uppercased
const expected = md5U('1211149' + '42' + '5000.00' + 'LKR' + md5U('test_secret_123'));
check('checkout hash matches PayHere formula', generateCheckoutHash('42', 5000) === expected);

// Notify signature:
// md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5(secret))
const goodSig = md5U('1211149' + '42' + '5000.00' + 'LKR' + '2' + md5U('test_secret_123'));
check('valid notify signature accepted', verifyNotifySignature({
  merchant_id: '1211149', order_id: '42', payhere_amount: '5000.00',
  payhere_currency: 'LKR', status_code: '2', md5sig: goodSig
}));
check('tampered amount rejected', !verifyNotifySignature({
  merchant_id: '1211149', order_id: '42', payhere_amount: '1.00',
  payhere_currency: 'LKR', status_code: '2', md5sig: goodSig
}));
check('tampered status rejected', !verifyNotifySignature({
  merchant_id: '1211149', order_id: '42', payhere_amount: '5000.00',
  payhere_currency: 'LKR', status_code: '-2', md5sig: goodSig
}));

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail === 0 ? 0 : 1);
