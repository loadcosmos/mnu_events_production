import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from './moderation.service';
import { ModerationStatus, ModerationType } from '@prisma/client';

describe('ModerationService', () => {
  let service: ModerationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        {
          provide: PrismaService,
          useValue: {
            moderationQueue: {
              create: jest.fn().mockImplementation((data) => Promise.resolve(data)),
              findMany: jest.fn().mockImplementation(() => Promise.resolve([])),
              findUnique: jest.fn().mockImplementation(() => Promise.resolve(null)),
              update: jest.fn().mockImplementation((data) => Promise.resolve(data)),
              count: jest.fn().mockImplementation(() => Promise.resolve(0)),
            },
            service: {
              findUnique: jest.fn().mockImplementation(() => Promise.resolve(null)),
              update: jest.fn().mockImplementation((data) => Promise.resolve(data)),
            },
            event: {
              findUnique: jest.fn().mockImplementation(() => Promise.resolve(null)),
              update: jest.fn().mockImplementation((data) => Promise.resolve(data)),
            },
            advertisement: {
              findUnique: jest.fn().mockImplementation(() => Promise.resolve(null)),
              update: jest.fn().mockImplementation((data) => Promise.resolve(data)),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQueue', () => {
    it('should return all items when no status is provided', async () => {
      const mockItems = [
        {
          id: '1',
          status: ModerationStatus.PENDING,
          itemType: ModerationType.EVENT,
          itemId: 'event1',
          createdAt: new Date(),
          updatedAt: new Date(),
          moderatorId: null,
          moderator: null,
          rejectionReason: null,
          details: null,
        },
      ];

      jest.spyOn(prisma.moderationQueue, 'findMany').mockResolvedValue(mockItems);

      const result = await service.getQueue();
      
      expect(prisma.moderationQueue.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          moderator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    });

    it('should filter by status when provided', async () => {
      const mockItems = [
        {
          id: '1',
          status: ModerationStatus.PENDING,
          itemType: ModerationType.EVENT,
          itemId: 'event1',
          createdAt: new Date(),
          updatedAt: new Date(),
          moderatorId: null,
          moderator: null,
          rejectionReason: null,
          details: null,
        },
      ];

      jest.spyOn(prisma.moderationQueue, 'findMany').mockResolvedValue(mockItems);

      const result = await service.getQueue(ModerationStatus.PENDING);
      
      expect(prisma.moderationQueue.findMany).toHaveBeenCalledWith({
        where: {
          status: ModerationStatus.PENDING,
        },
        include: {
          moderator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    });

    it('should filter by both status and type when provided', async () => {
      const mockItems = [
        {
          id: '1',
          status: ModerationStatus.PENDING,
          itemType: ModerationType.EVENT,
          itemId: 'event1',
          createdAt: new Date(),
          updatedAt: new Date(),
          moderatorId: null,
          moderator: null,
          rejectionReason: null,
          details: null,
        },
      ];

      jest.spyOn(prisma.moderationQueue, 'findMany').mockResolvedValue(mockItems);

      const result = await service.getQueue(ModerationStatus.PENDING, ModerationType.EVENT);
      
      expect(prisma.moderationQueue.findMany).toHaveBeenCalledWith({
        where: {
          status: ModerationStatus.PENDING,
          itemType: ModerationType.EVENT,
        },
        include: {
          moderator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    });
  });

  describe('getStats', () => {
    it('should return moderation statistics', async () => {
      const mockStats = {
        pending: 5,
        approved: 10,
        rejected: 2,
      };

      jest.spyOn(prisma.moderationQueue, 'count')
        .mockImplementation((args: any) => {
          if (args.where?.status === ModerationStatus.PENDING) return Promise.resolve(5) as any;
          if (args.where?.status === ModerationStatus.APPROVED) return Promise.resolve(10) as any;
          if (args.where?.status === ModerationStatus.REJECTED) return Promise.resolve(2) as any;
          return Promise.resolve(0) as any;
        });

      const result = await service.getStats();
      
      expect(result).toEqual(mockStats);
    });
  });
});
