import { Test, TestingModule } from '@nestjs/testing';
import { AdvertisementsService } from './advertisements.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Local enums until Prisma client is regenerated
enum AdPosition {
  TOP_BANNER = 'TOP_BANNER',
  NATIVE_FEED = 'NATIVE_FEED',
  STORY_BANNER = 'STORY_BANNER',
  SIDEBAR = 'SIDEBAR',
  HERO_SLIDE = 'HERO_SLIDE',
  BOTTOM_BANNER = 'BOTTOM_BANNER',
}

enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
}

describe('AdvertisementsService', () => {
  let service: AdvertisementsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    advertisement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    moderationQueue: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvertisementsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdvertisementsService>(AdvertisementsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPricing', () => {
    it('should return pricing for all ad positions', async () => {
      const result = await service.getPricing();

      expect(result).toHaveProperty('positions');
      expect(Array.isArray(result.positions)).toBe(true);
      expect(result.positions.length).toBeGreaterThan(0);

      const topBanner = result.positions.find((p) => p.position === 'TOP_BANNER');
      expect(topBanner).toBeDefined();
      expect(topBanner?.pricePerWeek).toBe(10000);
      expect(topBanner?.description).toContain('Top banner');

      const nativeFeed = result.positions.find((p) => p.position === 'NATIVE_FEED');
      expect(nativeFeed).toBeDefined();
      expect(nativeFeed?.pricePerWeek).toBe(8000);
    });

    it('should include all ad positions', async () => {
      const result = await service.getPricing();

      const positions = result.positions.map((p) => p.position);
      expect(positions).toContain('TOP_BANNER');
      expect(positions).toContain('NATIVE_FEED');
      expect(positions).toContain('STORY_BANNER');
      expect(positions).toContain('SIDEBAR');
      expect(positions).toContain('HERO_SLIDE');
      expect(positions).toContain('BOTTOM_BANNER');
    });
  });

  describe('create', () => {
    it('should create a new advertisement and add to moderation queue', async () => {
      const createAdDto = {
        title: 'Test Ad',
        imageUrl: 'https://example.com/ad.jpg',
        linkUrl: 'https://example.com',
        position: AdPosition.TOP_BANNER,
        duration: 4,
      };

      const mockAd = {
        id: 'ad-1',
        ...createAdDto,
        price: 40000, // 10000 * 4 weeks
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        isActive: false,
        paymentStatus: PaymentStatus.PENDING,
        impressions: 0,
        clicks: 0,
        createdAt: new Date(),
      };

      mockPrismaService.advertisement.create.mockResolvedValue(mockAd);
      mockPrismaService.moderationQueue.create.mockResolvedValue({
        id: 'queue-1',
        itemType: 'ADVERTISEMENT',
        itemId: 'ad-1',
        status: 'PENDING',
      });

      const result = await service.create(createAdDto);

      expect(result).toEqual(mockAd);
      expect(mockPrismaService.advertisement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Ad',
          position: AdPosition.TOP_BANNER,
          price: 40000,
          isActive: false,
          paymentStatus: 'PENDING',
        }),
      });
      expect(mockPrismaService.moderationQueue.create).toHaveBeenCalledWith({
        data: {
          itemType: 'ADVERTISEMENT',
          itemId: 'ad-1',
          status: 'PENDING',
        },
      });
    });

    it('should calculate correct price for different durations', async () => {
      const createAdDto = {
        title: 'Test Ad',
        imageUrl: 'https://example.com/ad.jpg',
        position: AdPosition.STORY_BANNER, // 15000 тг/week
        duration: 2,
      };

      const mockAd = {
        id: 'ad-2',
        ...createAdDto,
        price: 30000, // 15000 * 2 weeks
        startDate: new Date(),
        endDate: new Date(),
        isActive: false,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: new Date(),
      };

      mockPrismaService.advertisement.create.mockResolvedValue(mockAd);
      mockPrismaService.moderationQueue.create.mockResolvedValue({});

      const result = await service.create(createAdDto);

      expect(result.price).toBe(30000);
    });

    it('should set correct end date based on duration', async () => {
      const createAdDto = {
        title: 'Test Ad',
        imageUrl: 'https://example.com/ad.jpg',
        position: AdPosition.NATIVE_FEED,
        duration: 1,
      };

      let capturedEndDate: Date = new Date();
      mockPrismaService.advertisement.create.mockImplementation((args) => {
        capturedEndDate = args.data.endDate;
        return Promise.resolve({
          id: 'ad-3',
          ...args.data,
          createdAt: new Date(),
        });
      });
      mockPrismaService.moderationQueue.create.mockResolvedValue({});

      await service.create(createAdDto);

      const expectedEndDate = new Date();
      expectedEndDate.setDate(expectedEndDate.getDate() + 7); // 1 week

      // Allow 1 second difference for test execution time
      expect(Math.abs(capturedEndDate.getTime() - expectedEndDate.getTime())).toBeLessThan(1000);
    });
  });

  describe('getActiveAds', () => {
    it('should return only active and paid advertisements', async () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const mockAds = [
        {
          id: 'ad-1',
          title: 'Active Ad',
          isActive: true,
          paymentStatus: PaymentStatus.PAID,
          startDate: yesterday,
          endDate: tomorrow,
        },
      ];

      mockPrismaService.advertisement.findMany.mockResolvedValue(mockAds);

      const result = await service.getActiveAds();

      expect(result).toEqual(mockAds);
      expect(mockPrismaService.advertisement.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          paymentStatus: 'PAID',
          startDate: { lte: expect.any(Date) },
          endDate: { gte: expect.any(Date) },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by position if provided', async () => {
      mockPrismaService.advertisement.findMany.mockResolvedValue([]);

      await service.getActiveAds(AdPosition.TOP_BANNER);

      expect(mockPrismaService.advertisement.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          paymentStatus: 'PAID',
          startDate: { lte: expect.any(Date) },
          endDate: { gte: expect.any(Date) },
          position: AdPosition.TOP_BANNER,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if no active ads', async () => {
      mockPrismaService.advertisement.findMany.mockResolvedValue([]);

      const result = await service.getActiveAds();

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all advertisements', async () => {
      const mockAds = [
        { id: 'ad-1', title: 'Ad 1', isActive: true, paymentStatus: PaymentStatus.PAID },
        { id: 'ad-2', title: 'Ad 2', isActive: false, paymentStatus: PaymentStatus.PENDING },
        { id: 'ad-3', title: 'Ad 3', isActive: true, paymentStatus: PaymentStatus.EXPIRED },
      ];

      mockPrismaService.advertisement.findMany.mockResolvedValue(mockAds);

      const result = await service.findAll();

      expect(result).toEqual(mockAds);
      expect(result.length).toBe(3);
      expect(mockPrismaService.advertisement.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return advertisement by ID', async () => {
      const mockAd = {
        id: 'ad-1',
        title: 'Test Ad',
        isActive: true,
        paymentStatus: PaymentStatus.PAID,
      };

      mockPrismaService.advertisement.findUnique.mockResolvedValue(mockAd);

      const result = await service.findOne('ad-1');

      expect(result).toEqual(mockAd);
      expect(mockPrismaService.advertisement.findUnique).toHaveBeenCalledWith({
        where: { id: 'ad-1' },
      });
    });

    it('should throw NotFoundException if advertisement not found', async () => {
      mockPrismaService.advertisement.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status to PAID and activate ad', async () => {
      const mockAd = {
        id: 'ad-1',
        title: 'Test Ad',
        isActive: true,
        paymentStatus: PaymentStatus.PENDING,
      };

      const updatedAd = {
        ...mockAd,
        paymentStatus: PaymentStatus.PAID,
        isActive: true,
      };

      mockPrismaService.advertisement.findUnique.mockResolvedValue(mockAd);
      mockPrismaService.advertisement.update.mockResolvedValue(updatedAd);

      const result = await service.updatePaymentStatus('ad-1', { status: PaymentStatus.PAID });

      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
      expect(result.isActive).toBe(true);
      expect(mockPrismaService.advertisement.update).toHaveBeenCalledWith({
        where: { id: 'ad-1' },
        data: {
          paymentStatus: PaymentStatus.PAID,
          isActive: true,
        },
      });
    });

    it('should update payment status to EXPIRED', async () => {
      const mockAd = {
        id: 'ad-2',
        title: 'Expired Ad',
        isActive: true,
        paymentStatus: PaymentStatus.PAID,
      };

      mockPrismaService.advertisement.findUnique.mockResolvedValue(mockAd);
      mockPrismaService.advertisement.update.mockResolvedValue({
        ...mockAd,
        paymentStatus: PaymentStatus.EXPIRED,
      });

      const result = await service.updatePaymentStatus('ad-2', { status: PaymentStatus.EXPIRED });

      expect(result.paymentStatus).toBe(PaymentStatus.EXPIRED);
    });

    it('should throw NotFoundException if advertisement not found', async () => {
      mockPrismaService.advertisement.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePaymentStatus('non-existent', { status: PaymentStatus.PAID }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('trackImpression', () => {
    it('should increment impression count', async () => {
      mockPrismaService.advertisement.update.mockResolvedValue({
        id: 'ad-1',
        impressions: 1,
      });

      await service.trackImpression('ad-1');

      expect(mockPrismaService.advertisement.update).toHaveBeenCalledWith({
        where: { id: 'ad-1' },
        data: {
          impressions: { increment: 1 },
        },
      });
    });
  });

  describe('trackClick', () => {
    it('should increment click count', async () => {
      mockPrismaService.advertisement.update.mockResolvedValue({
        id: 'ad-1',
        clicks: 1,
      });

      await service.trackClick('ad-1');

      expect(mockPrismaService.advertisement.update).toHaveBeenCalledWith({
        where: { id: 'ad-1' },
        data: {
          clicks: { increment: 1 },
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete advertisement and its moderation queue items', async () => {
      const mockAd = {
        id: 'ad-1',
        title: 'Test Ad',
      };

      mockPrismaService.advertisement.findUnique.mockResolvedValue(mockAd);
      mockPrismaService.moderationQueue.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.advertisement.delete.mockResolvedValue(mockAd);

      const result = await service.remove('ad-1');

      expect(result).toEqual(mockAd);
      expect(mockPrismaService.moderationQueue.deleteMany).toHaveBeenCalledWith({
        where: {
          itemType: 'ADVERTISEMENT',
          itemId: 'ad-1',
        },
      });
      expect(mockPrismaService.advertisement.delete).toHaveBeenCalledWith({
        where: { id: 'ad-1' },
      });
    });

    it('should throw NotFoundException if advertisement not found', async () => {
      mockPrismaService.advertisement.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
