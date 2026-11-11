// The password rule shown on forms. The server (backend/src/utils/password.ts)
// is what enforces it, and also turns away very common passwords.
export const PASSWORD_HINT = 'At least 8 characters, with a letter and a number';

// Spread onto a new-password <input> so the browser checks the rule before sending.
export const passwordInputProps = {
  minLength: 8,
  maxLength: 72,
  pattern: '(?=.*\\p{L})(?=.*\\d).{8,}',
  title: PASSWORD_HINT
};
