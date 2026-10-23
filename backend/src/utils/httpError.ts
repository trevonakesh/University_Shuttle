import { Response } from 'express';

// Thrown from inside a transaction to abort it and send a specific HTTP
// status and message to the client, instead of a generic 500.
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Unexpected failure: log everything server-side, tell the client nothing
// about the internals (error text, SQL, stack traces, file paths).
export const serverError = (res: Response, error: unknown): void => {
  const req = res.req;
  console.error(`[error] ${req?.method} ${req?.originalUrl}:`, error);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Server error' });
  }
};
