import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

// Local enum until Prisma client is regenerated
enum TicketStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;

  const mockPrismaService: any = {
    event: {
      findUnique: jest.fn(),
    },
    ticket: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    checkIn: {
      create: jest.fn(),
    },
  };

  // Add $transaction method after declaration to avoid circular reference
  mockPrismaService.$transaction = jest.fn((callback) => {
    return callback(mockPrismaService);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Set environment variable for tests
    process.env.FRONTEND_URL = 'http://localhost:5173';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    const createPaymentDto = {
      eventId: 'event-1',
      amount: 150,
      platformFee: 50,
      paymentMethod: 'mock' as const,
    };

    const mockEvent = {
      id: 'event-1',
      title: 'Paid Event',
      isPaid: true,
      price: 100,
      platformFee: 50,
      capacity: 100,
    };

    it('should successfully create a payment for a paid event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);
      mockPrismaService.ticket.count.mockResolvedValue(50);
      mockPrismaService.ticket.create.mockResolvedValue({
        id: 'ticket-1',
        eventId: 'event-1',
        userId: 'user-1',
        status: TicketStatus.PENDING,
        transactionId: expect.any(String),
      });

      const result = await service.createPayment(createPaymentDto, 'user-1');

      expect(result).toHaveProperty('redirectUrl');
      expect(result).toHaveProperty('transactionId');
      expect(result.redirectUrl).toContain('mock-payment');
      expect(mockPrismaService.ticket.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayment(createPaymentDto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if event is free', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        isPaid: false,
      });

      await expect(
        service.createPayment(createPaymentDto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already has a ticket', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.ticket.findFirst.mockResolvedValue({
        id: 'existing-ticket',
        userId: 'user-1',
        eventId: 'event-1',
        status: TicketStatus.PAID,
      });

      await expect(
        service.createPayment(createPaymentDto, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if event is sold out', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);
      mockPrismaService.ticket.count.mockResolvedValue(100); // At capacity

      await expect(
        service.createPayment(createPaymentDto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if payment amount is incorrect', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);
      mockPrismaService.ticket.count.mockResolvedValue(50);

      const incorrectDto = {
        ...createPaymentDto,
        amount: 100, // Wrong amount
      };

      await expect(
        service.createPayment(incorrectDto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processWebhook', () => {
    beforeEach(() => {
      // Set PAYMENT_SECRET for QR code generation
      process.env.PAYMENT_SECRET = 'test-payment-secret';
    });

    it('should successfully process payment with success status', async () => {
      const mockTicket = {
        id: 'ticket-1',
        transactionId: 'txn_123',
        status: TicketStatus.PENDING,
        eventId: 'event-1',
        userId: 'user-1',
        price: 100,
        platformFee: 50,
        purchasedAt: new Date(),
        event: {
          id: 'event-1',
          title: 'Test Event',
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-01T23:59:59'),
          location: 'Test Location',
        },
        user: {
          email: 'test@kazguu.kz',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.PAID,
        qrCode: 'mocked-qr-code',
      });

      const webhookDto = {
        transactionId: 'txn_123',
        status: 'success' as const,
        signature: 'mock-signature',
      };

      const result = await service.processWebhook(webhookDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('qrCode');
      expect(mockPrismaService.ticket.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if ticket not found', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      const webhookDto = {
        transactionId: 'non-existent',
        status: 'success' as const,
        signature: 'mock-signature',
      };

      await expect(service.processWebhook(webhookDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if transaction already processed', async () => {
      const mockTicket = {
        id: 'ticket-1',
        transactionId: 'txn_123',
        status: TicketStatus.PAID, // Already processed
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);

      const webhookDto = {
        transactionId: 'txn_123',
        status: 'success' as const,
        signature: 'mock-signature',
      };

      await expect(service.processWebhook(webhookDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete ticket and throw on payment failure', async () => {
      const mockTicket = {
        id: 'ticket-1',
        transactionId: 'txn_123',
        status: TicketStatus.PENDING,
        eventId: 'event-1',
        userId: 'user-1',
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.ticket.delete.mockResolvedValue(mockTicket);

      const webhookDto = {
        transactionId: 'txn_123',
        status: 'failed' as const,
        signature: 'mock-signature',
      };

      await expect(service.processWebhook(webhookDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.ticket.delete).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
      });
    });
  });

  describe('getTicketById', () => {
    it('should return ticket with QR code for authorized user', async () => {
      const mockTicket = {
        id: 'ticket-1',
        userId: 'user-1',
        eventId: 'event-1',
        status: TicketStatus.PAID,
        qrCode: 'qr-code-data',
        price: 100,
        platformFee: 50,
        paymentMethod: 'mock',
        transactionId: 'txn_123',
        purchasedAt: new Date(),
        event: {
          id: 'event-1',
          title: 'Test Event',
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-01T23:59:59'),
          location: 'Test Location',
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);

      const result = await service.getTicketById('ticket-1', 'user-1', 'STUDENT');

      expect(result).toHaveProperty('qrCode');
      expect(result.event).toBeDefined();
      expect(result.event?.title).toBe('Test Event');
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      await expect(
        service.getTicketById('non-existent', 'user-1', 'STUDENT'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the ticket', async () => {
      const mockTicket = {
        id: 'ticket-1',
        userId: 'user-1',
        status: TicketStatus.PAID,
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);

      await expect(
        service.getTicketById('ticket-1', 'user-2', 'STUDENT'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to view any ticket', async () => {
      const mockTicket = {
        id: 'ticket-1',
        userId: 'user-1',
        eventId: 'event-1',
        status: TicketStatus.PAID,
        qrCode: 'qr-code-data',
        price: 100,
        platformFee: 50,
        paymentMethod: 'mock',
        transactionId: 'txn_123',
        purchasedAt: new Date(),
        event: {
          id: 'event-1',
          title: 'Test Event',
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-01T23:59:59'),
          location: 'Test Location',
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);

      const result = await service.getTicketById('ticket-1', 'admin-user', 'ADMIN');

      expect(result).toHaveProperty('qrCode');
      expect(result.event).toBeDefined();
      expect(result.event?.title).toBe('Test Event');
    });
  });

  describe('getMyTickets', () => {
    it('should return all tickets for the user', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          userId: 'user-1',
          status: TicketStatus.PAID,
          event: { title: 'Event 1' },
        },
        {
          id: 'ticket-2',
          userId: 'user-1',
          status: TicketStatus.PAID,
          event: { title: 'Event 2' },
        },
      ];

      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await service.getMyTickets('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('event');
    });

    it('should return empty array if user has no tickets', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([]);

      const result = await service.getMyTickets('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('refundTicket', () => {
    it('should successfully refund a paid ticket', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // Event in 7 days

      const mockTicket = {
        id: 'ticket-1',
        userId: 'user-1',
        status: TicketStatus.PAID,
        purchasedAt: new Date(),
        event: {
          startDate: futureDate,
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.REFUNDED,
      });

      const refundDto = {
        reason: 'Changed plans',
      };

      const result = await service.refundTicket('ticket-1', 'user-1', 'STUDENT', refundDto);

      expect(result.message).toContain('success');
      expect(result.message).toContain('Changed plans');
      expect(mockPrismaService.ticket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: {
          status: TicketStatus.REFUNDED,
        },
      });
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      await expect(
        service.refundTicket('non-existent', 'user-1', 'STUDENT'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the ticket', async () => {
      const mockTicket = {
        id: 'ticket-1',
        userId: 'user-1',
        status: TicketStatus.PAID,
        event: {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);

      await expect(
        service.refundTicket('ticket-1', 'user-2', 'STUDENT'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to refund any ticket', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockTicket = {
        id: 'ticket-1',
        userId: 'user-1',
        status: TicketStatus.PAID,
        event: {
          startDate: futureDate,
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.REFUNDED,
      });

      const result = await service.refundTicket('ticket-1', 'admin-user', 'ADMIN');

      expect(result.message).toContain('success');
    });

    it('should throw BadRequestException if ticket is not paid', async () => {
      const mockTicket = {
        id: 'ticket-1',
        userId: 'user-1',
        status: TicketStatus.PENDING,
        event: {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);

      await expect(
        service.refundTicket('ticket-1', 'user-1', 'STUDENT'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if event has already started', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Event started yesterday

      const mockTicket = {
        id: 'ticket-1',
        userId: 'user-1',
        status: TicketStatus.PAID,
        event: {
          startDate: pastDate,
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);

      await expect(
        service.refundTicket('ticket-1', 'user-1', 'STUDENT'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if ticket already refunded', async () => {
      const mockTicket = {
        id: 'ticket-1',
        userId: 'user-1',
        status: TicketStatus.REFUNDED,
        event: {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);

      await expect(
        service.refundTicket('ticket-1', 'user-1', 'STUDENT'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
