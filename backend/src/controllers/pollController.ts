import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

export const createPoll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, question } = req.body;
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
        question: question || 'Are you coming tomorrow?'
      }
    });

    res.status(201).json({ message: 'Poll created successfully', poll });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
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
      const comingStudents = poll.responses
        .filter(r => r.isComing)
        .map(r => ({
          name: r.student.fullName,
          pickupPoint: r.student.pickupPoint,
          phone: (r.student as any).user?.phone
        }));
        
      const notComingCount = poll.responses.filter(r => !r.isComing).length;

      return {
        id: poll.id,
        date: poll.date,
        question: poll.question,
        createdAt: poll.createdAt,
        stats: {
          comingCount: comingStudents.length,
          notComingCount
        },
        comingStudents // The detailed list requested by the user
      };
    });

    res.status(200).json({ polls: formattedPolls });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
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
    res.status(500).json({ error: 'Server error', details: error.message });
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

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    const poll = await prisma.poll.findUnique({ where: { id: parseInt(id) } });
    if (!poll) {
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
    res.status(500).json({ error: 'Server error', details: error.message });
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

    const poll = await prisma.poll.findUnique({ where: { id: parseInt(id) } });
    if (!poll) {
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    if (poll.driverId !== driver.id) {
      res.status(403).json({ error: 'You can only delete your own polls' });
      return;
    }

    await prisma.poll.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ message: 'Poll deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
