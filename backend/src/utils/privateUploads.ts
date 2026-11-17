import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import prisma from '../prismaClient';
import { jwtSecret } from './jwt';

// Drivers' identity documents (NIC, driving licence, vehicle registration)
// sit in the same uploads folder as profile and bus photos, but must not be
// open to anyone who has the link.
//
// A file counts as a document when a driver's record points at it in one of
// DOCUMENT_FIELDS. That is decided from the database, not from the file name
// or folder, so documents uploaded before this existed, and by older versions
// of the app, are covered too.
//
// A document only opens through a signed link that expires. Signed links are
// handed out in two places: admin responses, and a driver's own profile.
export const DOCUMENT_FIELDS = ['nicCopyUrl', 'licenseCopyUrl', 'vehicleRegUrl'] as const;

const LINK_LIFETIME_MS = 60 * 60 * 1000; // long enough to review a driver, short if a link is passed on

const fileNameOf = (url: unknown): string | null => {
  if (typeof url !== 'string') return null;
  const match = /\/uploads\/([\w.-]+)(?:[?#].*)?$/.exec(url);
  return match ? match[1] : null;
};

/** The form an upload link is stored in: no signature or other query string. */
export const cleanUploadUrl = <T>(url: T): T =>
  (typeof url === 'string' ? url.split(/[?#]/)[0] : url) as T;

const signature = (fileName: string, expires: number): string =>
  crypto.createHmac('sha256', jwtSecret()).update(`upload-document:${fileName}:${expires}`).digest('base64url');

export const signDocumentUrl = <T>(url: T, now = Date.now()): T => {
  const fileName = fileNameOf(url);
  if (!fileName) return url;
  const expires = now + LINK_LIFETIME_MS;
  return `${cleanUploadUrl(url)}?e=${expires}&s=${signature(fileName, expires)}` as T;
};

/** A copy of a driver record whose document links can be opened for the next hour. */
export const withSignedDocuments = <T>(driver: T): T => {
  if (!driver || typeof driver !== 'object') return driver;
  const copy = { ...driver } as Record<string, unknown>;
  for (const field of DOCUMENT_FIELDS) {
    if (copy[field]) copy[field] = signDocumentUrl(copy[field]);
  }
  return copy as T;
};

const hasValidSignature = (fileName: string, query: Request['query']): boolean => {
  const expires = Number(query.e);
  const given = typeof query.s === 'string' ? query.s : '';
  if (!given || !Number.isFinite(expires) || expires < Date.now()) return false;
  const wanted = Buffer.from(signature(fileName, expires));
  const got = Buffer.from(given);
  return wanted.length === got.length && crypto.timingSafeEqual(wanted, got);
};

// Whether a file is a document is looked up once and remembered briefly, so a
// page of bus photos does not mean a database query per photo. "Not a
// document" is remembered for a shorter time: a file becomes one the moment a
// driver registers with it.
const PRIVATE_TTL_MS = 5 * 60 * 1000;
const PUBLIC_TTL_MS = 20 * 1000;
const MAX_REMEMBERED = 5000;
const remembered = new Map<string, { isDocument: boolean; until: number }>();

const isDocument = async (fileName: string): Promise<boolean> => {
  const known = remembered.get(fileName);
  if (known && known.until > Date.now()) return known.isDocument;

  const match = await prisma.driver.findFirst({
    where: { OR: DOCUMENT_FIELDS.map(field => ({ [field]: { endsWith: `/${fileName}` } })) },
    select: { id: true }
  });
  const found = match !== null;
  if (remembered.size >= MAX_REMEMBERED) remembered.clear();
  remembered.set(fileName, { isDocument: found, until: Date.now() + (found ? PRIVATE_TTL_MS : PUBLIC_TTL_MS) });
  return found;
};

/** Called when a driver record is saved, so its documents are private at once. */
export const markAsDocuments = (...urls: unknown[]): void => {
  for (const url of urls) {
    const fileName = fileNameOf(url);
    if (fileName) remembered.set(fileName, { isDocument: true, until: Date.now() + PRIVATE_TTL_MS });
  }
};

/**
 * Sits in front of the /uploads files. Documents answer 404 without a valid
 * signed link, the same as a file that does not exist, so a link reveals
 * nothing. If the database cannot be asked, nothing is served rather than
 * risk serving a document.
 */
export const guardDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const fileName = req.path.slice(1);
  try {
    if (await isDocument(fileName)) {
      if (!hasValidSignature(fileName, req.query)) {
        res.status(404).end();
        return;
      }
      // Never kept by a shared cache or proxy.
      res.setHeader('Cache-Control', 'private, no-store');
    }
    next();
  } catch (error) {
    console.error('[uploads] could not check a file:', error);
    res.status(503).end();
  }
};
