import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Moderation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let moderatorToken: string;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create test users and get tokens
    await createTestUsers();
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.moderationQueue.deleteMany({});
    await prisma.$disconnect();
    await app.close();
  });

  async function createTestUsers() {
    // Register and verify admin
    const adminEmail = `admin.mod.${Date.now()}@kazguu.kz`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: adminEmail,
        password: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
      });

    await prisma.user.update({
      where: { email: adminEmail },
      data: { emailVerified: true, role: 'ADMIN' },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: 'Password123!' });

    adminToken = adminLogin.body.accessToken;

    // Register and verify moderator
    const moderatorEmail = `moderator.${Date.now()}@kazguu.kz`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: moderatorEmail,
        password: 'Password123!',
        firstName: 'Moderator',
        lastName: 'User',
      });

    await prisma.user.update({
      where: { email: moderatorEmail },
      data: { emailVerified: true, role: 'MODERATOR' },
    });

    const modLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: moderatorEmail, password: 'Password123!' });

    moderatorToken = modLogin.body.accessToken;

    // Register and verify student
    const studentEmail = `student.mod.${Date.now()}@kazguu.kz`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: studentEmail,
        password: 'Password123!',
        firstName: 'Student',
        lastName: 'User',
      });

    await prisma.user.update({
      where: { email: studentEmail },
      data: { emailVerified: true },
    });

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: studentEmail, password: 'Password123!' });

    studentToken = studentLogin.body.accessToken;
  }

  describe('/moderation/queue (GET)', () => {
    it('should allow moderator to access queue', () => {
      return request(app.getHttpServer())
        .get('/moderation/queue')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should allow admin to access queue', () => {
      return request(app.getHttpServer())
        .get('/moderation/queue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should deny student access to queue', () => {
      return request(app.getHttpServer())
        .get('/moderation/queue')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should deny unauthorized access', () => {
      return request(app.getHttpServer()).get('/moderation/queue').expect(401);
    });

    it('should filter queue by status', () => {
      return request(app.getHttpServer())
        .get('/moderation/queue')
        .query({ status: 'PENDING' })
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should filter queue by type', () => {
      return request(app.getHttpServer())
        .get('/moderation/queue')
        .query({ type: 'SERVICE' })
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);
    });
  });

  describe('/moderation/stats (GET)', () => {
    it('should return moderation statistics for moderator', () => {
      return request(app.getHttpServer())
        .get('/moderation/stats')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('pending');
          expect(res.body).toHaveProperty('approved');
          expect(res.body).toHaveProperty('rejected');
          expect(typeof res.body.pending).toBe('number');
          expect(typeof res.body.approved).toBe('number');
          expect(typeof res.body.rejected).toBe('number');
        });
    });

    it('should deny student access to stats', () => {
      return request(app.getHttpServer())
        .get('/moderation/stats')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('Moderation Workflow', () => {
    let serviceId: string;
    let queueId: string;

    it('should create a service that needs moderation', async () => {
      // Create a service (which should be added to moderation queue)
      const serviceResponse = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          type: 'GENERAL',
          title: 'Test Service for Moderation',
          description: 'This service needs to be moderated',
          category: 'DESIGN',
          price: 5000,
          priceType: 'HOURLY',
        })
        .expect(201);

      serviceId = serviceResponse.body.id;

      // Check if it's in moderation queue
      const queueResponse = await request(app.getHttpServer())
        .get('/moderation/queue')
        .query({ type: 'SERVICE', status: 'PENDING' })
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      const queueItem = queueResponse.body.find(
        (item: any) => item.itemId === serviceId,
      );
      expect(queueItem).toBeDefined();
      queueId = queueItem.id;
    });

    it('should allow moderator to approve service', async () => {
      await request(app.getHttpServer())
        .post(`/moderation/${queueId}/approve`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      // Verify service is now active
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      expect(service?.isActive).toBe(true);

      // Verify queue item is approved
      const queueItem = await prisma.moderationQueue.findUnique({
        where: { id: queueId },
      });
      expect(queueItem?.status).toBe('APPROVED');
    });

    it('should reject service with reason', async () => {
      // Create another service
      const serviceResponse = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          type: 'GENERAL',
          title: 'Service to Reject',
          description: 'This will be rejected',
          category: 'DESIGN',
          price: 5000,
          priceType: 'HOURLY',
        })
        .expect(201);

      const newServiceId = serviceResponse.body.id;

      // Find in queue
      const queueResponse = await request(app.getHttpServer())
        .get('/moderation/queue')
        .query({ type: 'SERVICE', status: 'PENDING' })
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      const queueItem = queueResponse.body.find(
        (item: any) => item.itemId === newServiceId,
      );
      const newQueueId = queueItem.id;

      // Reject
      await request(app.getHttpServer())
        .post(`/moderation/${newQueueId}/reject`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ reason: 'Does not meet quality standards' })
        .expect(200);

      // Verify service is not active
      const service = await prisma.service.findUnique({
        where: { id: newServiceId },
      });
      expect(service?.isActive).toBe(false);
    });

    it('should deny student from approving items', async () => {
      await request(app.getHttpServer())
        .post(`/moderation/${queueId}/approve`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });
});
