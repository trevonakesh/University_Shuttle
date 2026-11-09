import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { serverError } from '../utils/httpError';
import { AuthRequest } from '../middleware/authMiddleware';
import { RequestStatus, Role } from '@prisma/client';
import { buildPassengerListPdf } from '../services/passengerListPdf';

export const createPoll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, question, option1, option2 } = req.body;
    const userId = req.user!.userId;

    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Only drivers can create polls' });
      return;
    }

    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    const poll = await prisma.poll.create({
      data: {
        driverId: driver.id,
        date,
        question: question || 'Are you coming tomorrow?',
        option1: option1 || 'COMING',
        option2: option2 || 'NOT COMING'
      }
    });

    res.status(201).json({ message: 'Poll created successfully', poll });
  } catch (error: any) {
    serverError(res, error);
  }
};

export const getDriverPolls = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    
    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    const polls = await prisma.poll.findMany({
      where: { driverId: driver.id },
      include: {
        responses: {
          include: {
            student: {
              select: {
                fullName: true,
                pickupPoint: true,
                user: {
                  select: { phone: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // We can also aggregate and filter directly in JS to format it beautifully for the driver
    const formattedPolls = polls.map(poll => {
      const option1Students = poll.responses
        .filter(r => r.isComing)
        .map(r => ({
          name: r.student.fullName,
          pickupPoint: r.student.pickupPoint,
          phone: (r.student as any).user?.phone
        }));
        
      const option2Students = poll.responses
        .filter(r => !r.isComing)
        .map(r => ({
          name: r.student.fullName,
          pickupPoint: r.student.pickupPoint,
          phone: (r.student as any).user?.phone
        }));
        
      const option2Count = option2Students.length;

      return {
        id: poll.id,
        date: poll.date,
        question: poll.question,
        option1: poll.option1,
        option2: poll.option2,
        createdAt: poll.createdAt,
        stats: {
          option1Count: option1Students.length,
          option2Count
        },
        option1Students,
        option2Students
      };
    });

    res.status(200).json({ polls: formattedPolls });
  } catch (error: any) {
    serverError(res, error);
  }
};

export const downloadPassengerList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const pollId = parseInt(String(req.params.id));
    if (!Number.isInteger(pollId)) {
      res.status(400).json({ error: 'Invalid poll id' });
      return;
    }

    const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        responses: {
          where: { isComing: true },
          include: { student: { select: { fullName: true, pickupPoint: true, user: { select: { phone: true } } } } }
        }
      }
    });
    // Another driver's poll gets the same 404 as a missing one: this list holds phone numbers.
    if (!poll || poll.driverId !== driver.id) {
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    const pdf = await buildPassengerListPdf({
      date: poll.date,
      question: poll.question,
      optionLabel: poll.option1,
      driverName: driver.fullName,
      routeName: driver.routeName,
      busRegNumber: driver.busRegNumber,
      passengers: poll.responses.map(r => ({
        name: r.student.fullName,
        pickupPoint: r.student.pickupPoint,
        phone: r.student.user?.phone ?? null
      }))
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="passenger-list-${poll.id}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(pdf);
  } catch (error: any) {
    serverError(res, error);
  }
};

export const getStudentPolls = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    
    if (req.user?.role !== Role.STUDENT) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    // Get polls from drivers the student has an approved request with
    const approvedRequests = await prisma.seatRequest.findMany({
      where: { 
        studentId: student.id,
        status: 'APPROVED'
      },
      select: { driverId: true }
    });

    const driverIds = approvedRequests.map(req => req.driverId);

    if (driverIds.length === 0) {
      res.status(200).json({ polls: [] });
      return;
    }

    const polls = await prisma.poll.findMany({
      where: { driverId: { in: driverIds } },
      include: {
        driver: {
          select: {
            fullName: true,
            busRegNumber: true
          }
        },
        // Only include this student's response to see if they've voted
        responses: {
          where: { studentId: student.id }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ polls });
  } catch (error: any) {
    serverError(res, error);
  }
};

export const votePoll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isComing } = req.body;
    const userId = req.user!.userId;

    if (req.user?.role !== Role.STUDENT) {
      res.status(403).json({ error: 'Only students can vote' });
      return;
    }

    if (typeof isComing !== 'boolean') {
      res.status(400).json({ error: 'isComing must be true or false.' });
      return;
    }
    const pollId = parseInt(String(id));
    if (!Number.isInteger(pollId)) {
      res.status(400).json({ error: 'Invalid poll id' });
      return;
    }

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) {
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    // Only passengers of the bus that posted the poll may answer it — the
    // same rule that decides which polls a student sees. Other buses' polls
    // get the same 404 as a missing one, so poll ids reveal nothing.
    const seat = await prisma.seatRequest.findFirst({
      where: { studentId: student.id, driverId: poll.driverId, status: RequestStatus.APPROVED },
      select: { id: true }
    });
    if (!seat) {
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    // Upsert the vote (create or update)
    const vote = await prisma.pollResponse.upsert({
      where: {
        pollId_studentId: {
          pollId: poll.id,
          studentId: student.id
        }
      },
      update: {
        isComing
      },
      create: {
        pollId: poll.id,
        studentId: student.id,
        isComing
      }
    });

    res.status(200).json({ message: 'Vote recorded successfully', vote });
  } catch (error: any) {
    serverError(res, error);
  }
};

export const deletePoll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (req.user?.role !== Role.DRIVER) {
      res.status(403).json({ error: 'Only drivers can delete polls' });
      return;
    }

    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      res.status(404).json({ error: 'Driver profile not found' });
      return;
    }

    const poll = await prisma.poll.findUnique({ where: { id: parseInt(id as string) } });
    if (!poll) {
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    if (poll.driverId !== driver.id) {
      res.status(403).json({ error: 'You can only delete your own polls' });
      return;
    }

    await prisma.poll.delete({ where: { id: parseInt(id as string) } });

    res.status(200).json({ message: 'Poll deleted successfully' });
  } catch (error: any) {
    serverError(res, error);
  }
};
