import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const MAX = { name: 120, email: 160, phone: 40, subject: 120, message: 4000 };
const emailLooksValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// POST /api/contact — public. Receives an enquiry from the marketing site.
export const createContactMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = String(req.body?.name ?? '').trim();
    const email = String(req.body?.email ?? '').trim();
    const phone = String(req.body?.phone ?? '').trim();
    const subject = String(req.body?.subject ?? '').trim() || 'General enquiry';
    const message = String(req.body?.message ?? '').trim();

    if (!name || !email || !message) {
      res.status(400).json({ error: 'Please provide your name, email and a message.' });
      return;
    }
    if (!emailLooksValid(email)) {
      res.status(400).json({ error: 'That email address does not look right.' });
      return;
    }
    if (name.length > MAX.name || email.length > MAX.email || phone.length > MAX.phone ||
        subject.length > MAX.subject || message.length > MAX.message) {
      res.status(400).json({ error: 'One of your answers is too long. Please shorten it and try again.' });
      return;
    }

    const saved = await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, subject, message }
    });

    res.status(201).json({ message: 'Thanks — we will be in touch shortly.', id: saved.id });
  } catch (error: any) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ error: 'We could not save your message. Please try again.' });
  }
};

// GET /api/admin/messages — admin only.
export const getContactMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/admin/messages/:id/read — admin only.
export const markMessageRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id));
    if (!Number.isInteger(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: req.body?.isRead === false ? false : true }
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(404).json({ message: 'Message not found' });
  }
};

// DELETE /api/admin/messages/:id — admin only.
export const deleteContactMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.contactMessage.delete({ where: { id } });
    res.status(200).json({ message: 'Message deleted' });
  } catch (error) {
    res.status(404).json({ message: 'Message not found' });
  }
};
