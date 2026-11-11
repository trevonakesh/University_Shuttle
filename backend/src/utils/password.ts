// The rule for every new password: sign-up, password reset, and accounts an
// admin creates. Existing passwords keep working; the rule applies the next
// time one is set.

export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignores anything after 72 bytes

// Passwords that meet the letter-and-number rule but are among the first an
// attacker tries.
const COMMON_PASSWORDS = new Set([
  'password1', 'password12', 'password123', 'password1234', 'passw0rd', 'pass1234', 'pass12345',
  'qwerty123', 'qwerty1234', 'qwertyuiop1', '1q2w3e4r', '1q2w3e4r5t', '1qaz2wsx', 'q1w2e3r4', 'zaq12wsx',
  'abc12345', 'abcd1234', 'abcd12345', 'abc123456', 'a1234567', 'a12345678', '1234567a', '12345678a', '123456789a',
  'admin123', 'admin1234', 'admin12345', 'welcome1', 'welcome123', 'letmein123', 'iloveyou1', 'iloveyou123',
  'test1234', 'test12345', 'user1234', 'changeme1', 'changeme123', 'monkey123', 'dragon123', 'football1',
  'unishuttle1', 'unishuttle123', 'srilanka1', 'srilanka123', 'colombo123', 'student123', 'driver123'
]);

/**
 * Returns what is wrong with a new password, or null when it is acceptable.
 * `notEqualTo` holds values the password must not simply repeat, such as the
 * account's email.
 */
export const passwordError = (value: unknown, notEqualTo: unknown[] = []): string | null => {
  if (typeof value !== 'string' || value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (Buffer.byteLength(value, 'utf8') > PASSWORD_MAX_BYTES) return 'Password is too long. Please use 72 characters or fewer.';
  if (!/\p{L}/u.test(value) || !/\d/.test(value)) return 'Password must include at least one letter and one number.';

  const lower = value.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return 'That password is too easy to guess. Please choose a different one.';
  const same = notEqualTo.some(other => typeof other === 'string' && other.trim() !== '' && other.trim().toLowerCase() === lower);
  if (same) return 'Password cannot be the same as your email.';
  return null;
};
