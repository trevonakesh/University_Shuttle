import jwt, { SignOptions } from 'jsonwebtoken';

// The one place that reads JWT_SECRET. There is deliberately no fallback:
// with a missing or guessable secret anyone could forge a login token, so the
// server refuses to start instead (see assertJwtSecret in index.ts).
const MIN_SECRET_LENGTH = 32;

export const jwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set to a random string of at least ${MIN_SECRET_LENGTH} characters. ` +
      `Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
    );
  }
  return secret;
};

// Call once at startup so a bad secret stops the server immediately rather
// than on the first login.
export const assertJwtSecret = (): void => {
  jwtSecret();
};

export const signToken = (payload: object, expiresIn: SignOptions['expiresIn']): string =>
  jwt.sign(payload, jwtSecret(), { algorithm: 'HS256', expiresIn });

// Throws if the token is malformed, expired, or not signed with our secret.
export const verifyToken = <T = jwt.JwtPayload>(token: string): T =>
  jwt.verify(token, jwtSecret(), { algorithms: ['HS256'] }) as T;
