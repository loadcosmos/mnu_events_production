import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Role, Category, EventStatus } from '@prisma/client';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockModerationService = {
    addToQueue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ModerationService, useValue: mockModerationService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create an event', async () => {
      const createEventDto = {
        title: 'Test Event',
        description: 'This is a comprehensive test description that meets the minimum 50 character requirement for event descriptions.',
        category: Category.ACADEMIC,
        location: 'Test Location',
        startDate: '2025-12-01T10:00:00Z',
        endDate: '2025-12-01T12:00:00Z',
        capacity: 100,
        isPaid: false,
      };

      const mockEvent = {
        id: '1',
        ...createEventDto,
        status: EventStatus.UPCOMING,
        creatorId: 'user-1',
        creator: {
          id: 'user-1',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@kazguu.kz',
        },
        _count: { registrations: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.event.create.mockResolvedValue(mockEvent);

      const result = await service.create(createEventDto, 'user-1', Role.ORGANIZER);

      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.event.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      const createEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        category: Category.ACADEMIC,
        location: 'Test Location',
        startDate: '2025-12-01T12:00:00Z',
        endDate: '2025-12-01T10:00:00Z', // Before start
        capacity: 100,
        isPaid: false,
      };

      await expect(service.create(createEventDto, 'user-1', Role.ORGANIZER)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.event.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if start date is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const createEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        category: Category.ACADEMIC,
        location: 'Test Location',
        startDate: pastDate.toISOString(),
        endDate: '2025-12-01T12:00:00Z',
        capacity: 100,
        isPaid: false,
      };

      await expect(service.create(createEventDto, 'user-1', Role.ORGANIZER)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated events', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Event 1',
          category: Category.ACADEMIC,
          status: EventStatus.UPCOMING,
        },
        {
          id: '2',
          title: 'Event 2',
          category: Category.SPORTS,
          status: EventStatus.UPCOMING,
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.event.count.mockResolvedValue(2);

      const result = await service.findAll(1, 10);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should filter events by category', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Academic Event',
          category: Category.ACADEMIC,
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.event.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10, {
        category: Category.ACADEMIC,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].category).toBe(Category.ACADEMIC);
    });
  });

  describe('findOne', () => {
    it('should return event by id', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        category: Category.ACADEMIC,
        capacity: 100,
        creator: {
          id: 'user-1',
          firstName: 'Test',
          lastName: 'User',
        },
        _count: {
          registrations: 25,
        },
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne('1');

      expect(result).toMatchObject({
        ...mockEvent,
        availableSeats: 75, // capacity (100) - registrations (25)
      });
      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should successfully update event by creator', async () => {
      const mockEvent = {
        id: '1',
        title: 'Old Title',
        creatorId: 'user-1',
      };

      const updateDto = {
        title: 'New Title',
      };

      const updatedEvent = {
        ...mockEvent,
        ...updateDto,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.update.mockResolvedValue(updatedEvent);

      const result = await service.update('1', updateDto, 'user-1', Role.ORGANIZER);

      expect(result.title).toBe('New Title');
      expect(mockPrismaService.event.update).toHaveBeenCalled();
    });

    it('should allow admin to update any event', async () => {
      const mockEvent = {
        id: '1',
        title: 'Old Title',
        creatorId: 'user-1',
      };

      const updateDto = {
        title: 'New Title',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        ...updateDto,
      });

      const result = await service.update('1', updateDto, 'admin-user', Role.ADMIN);

      expect(result.title).toBe('New Title');
    });

    it('should throw ForbiddenException if user is not creator or admin', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        creatorId: 'user-1',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(
        service.update('1', { title: 'New Title' }, 'user-2', Role.STUDENT),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.event.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { title: 'New Title' }, 'user-1', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should successfully delete event by creator', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        creatorId: 'user-1',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.delete.mockResolvedValue(mockEvent);

      const result = await service.remove('1', 'user-1', Role.ORGANIZER);

      expect(result).toEqual({ message: 'Event deleted successfully' });
      expect(mockPrismaService.event.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should allow admin to delete any event', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        creatorId: 'user-1',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.delete.mockResolvedValue(mockEvent);

      const result = await service.remove('1', 'admin-user', Role.ADMIN);

      expect(result).toEqual({ message: 'Event deleted successfully' });
    });

    it('should throw ForbiddenException if user is not creator or admin', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        creatorId: 'user-1',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(
        service.remove('1', 'user-2', Role.STUDENT),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.event.delete).not.toHaveBeenCalled();
    });
  });
});
