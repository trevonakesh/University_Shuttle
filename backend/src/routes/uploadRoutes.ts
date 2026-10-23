import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { rateLimit } from '../utils/rateLimit';
import { verifyToken } from '../utils/jwt';

const router = express.Router();

// Ensure uploads directory exists
export const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Files are only written to disk after their contents check out as an image.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB limit
});

// Works out the image type from the file's first bytes rather than trusting
// its name or the browser's Content-Type, so an .html/.svg/.js file renamed
// to .jpg is still refused. Returns the extension to save it under.
const detectImage = (buf: Buffer): 'jpg' | 'png' | 'webp' | 'gif' | null => {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (['GIF87a', 'GIF89a'].includes(buf.toString('ascii', 0, 6))) return 'gif';
  return null;
};

// Sign-up screens upload photos before the account exists, so a token is
// optional here. A token that is sent must be valid, though, and signed-in
// users get their own (higher) upload allowance.
const optionalUser = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header) return next();
  try {
    const token = header.replace(/^Bearer\s+/i, '');
    const decoded = verifyToken<{ userId?: number }>(token);
    if (typeof decoded.userId !== 'number') throw new Error('not a login token');
    (req as any).uploadUserId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
  }
};

const limitUploads = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30, // a driver sign-up uploads 5 documents, so this leaves plenty for retries
  key: req => ((req as any).uploadUserId ? `user:${(req as any).uploadUserId}` : `ip:${req.ip}`),
  message: 'Too many uploads. Please wait a while and try again.',
});

router.post('/', optionalUser, limitUploads, (req: Request, res: Response) => {
  upload.single('image')(req, res, async (err: unknown) => {
    if (err) {
      const tooBig = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({ success: false, message: tooBig ? 'Images must be 5 MB or smaller.' : 'Upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const ext = detectImage(req.file.buffer);
    if (!ext) {
      return res.status(400).json({ success: false, message: 'Only JPG, PNG, WEBP or GIF images can be uploaded.' });
    }

    // Random, server-chosen name: nothing from the client ends up in the path.
    const filename = `image-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    try {
      await fs.promises.writeFile(path.join(uploadDir, filename), req.file.buffer);
    } catch (e) {
      console.error('Error saving upload:', e);
      return res.status(500).json({ success: false, message: 'Could not save the image. Please try again.' });
    }

    return res.status(200).json({
      success: true,
      url: `/uploads/${filename}`,
      message: 'File uploaded successfully',
    });
  });
});

export default router;
