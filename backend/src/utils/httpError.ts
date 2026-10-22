// Thrown from inside a transaction to abort it and send a specific HTTP
// status and message to the client, instead of a generic 500.
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
