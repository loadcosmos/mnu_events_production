import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Category, EventStatus } from '@prisma/client';

describe('Events (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let organizerToken: string;
  let organizerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create and login a test user (student)
    const studentEmail = `student.e2e.${Date.now()}@kazguu.kz`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: studentEmail,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Student',
      });

    const student = await prisma.user.findUnique({ where: { email: studentEmail } });
    await prisma.user.update({
      where: { email: studentEmail },
      data: { emailVerified: true },
    });

    const studentLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: studentEmail, password: 'Password123!' });

    accessToken = studentLoginRes.body.accessToken;
    userId = student!.id;

    // Create and login an organizer
    const organizerEmail = `organizer.e2e.${Date.now()}@kazguu.kz`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: organizerEmail,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Organizer',
      });

    const organizer = await prisma.user.findUnique({ where: { email: organizerEmail } });
    await prisma.user.update({
      where: { email: organizerEmail },
      data: { emailVerified: true, role: 'ORGANIZER' },
    });

    const organizerLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: organizerEmail, password: 'Password123!' });

    organizerToken = organizerLoginRes.body.accessToken;
    organizerId = organizer!.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test events and users
    await prisma.event.deleteMany({
      where: {
        OR: [
          { creatorId: userId },
          { creatorId: organizerId },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: userId },
          { id: organizerId },
        ],
      },
    });

    await prisma.$disconnect();
    await app.close();
  });

  describe('/events (POST)', () => {
    it('should create event as organizer', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'E2E Test Event',
          description: 'This is a test event',
          category: Category.ACADEMIC,
          location: 'Test Location',
          startDate: tomorrow.toISOString(),
          endDate: dayAfter.toISOString(),
          capacity: 100,
          isPaid: false,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('E2E Test Event');
          expect(res.body.creator).toBeDefined();
        });
    });

    it('should reject event creation without authentication', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      return request(app.getHttpServer())
        .post('/events')
        .send({
          title: 'Unauthorized Event',
          description: 'Should fail',
          category: Category.ACADEMIC,
          location: 'Test',
          startDate: tomorrow.toISOString(),
          endDate: dayAfter.toISOString(),
          capacity: 100,
        })
        .expect(401);
    });

    it('should reject event with invalid dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Invalid Date Event',
          description: 'Should fail',
          category: Category.ACADEMIC,
          location: 'Test',
          startDate: tomorrow.toISOString(),
          endDate: yesterday.toISOString(), // End before start
          capacity: 100,
        })
        .expect(400);
    });

    it('should reject event with past start date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Past Event',
          description: 'Should fail',
          category: Category.ACADEMIC,
          location: 'Test',
          startDate: yesterday.toISOString(),
          endDate: tomorrow.toISOString(),
          capacity: 100,
        })
        .expect(400);
    });
  });

  describe('/events (GET)', () => {
    beforeAll(async () => {
      // Create some test events
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Academic Event',
          description: 'Test',
          category: Category.ACADEMIC,
          location: 'Test',
          startDate: tomorrow.toISOString(),
          endDate: dayAfter.toISOString(),
          capacity: 100,
        });

      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Sports Event',
          description: 'Test',
          category: Category.SPORTS,
          location: 'Test',
          startDate: tomorrow.toISOString(),
          endDate: dayAfter.toISOString(),
          capacity: 50,
        });
    });

    it('should get all events with pagination', () => {
      return request(app.getHttpServer())
        .get('/events')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('limit');
        });
    });

    it('should filter events by category', () => {
      return request(app.getHttpServer())
        .get('/events')
        .query({ category: Category.ACADEMIC })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          if (res.body.data.length > 0) {
            res.body.data.forEach((event: any) => {
              expect(event.category).toBe(Category.ACADEMIC);
            });
          }
        });
    });

    it('should support pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/events')
        .query({ page: 1, limit: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
        });
    });
  });

  describe('/events/:id (GET)', () => {
    let eventId: string;

    beforeAll(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const createRes = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Detail Test Event',
          description: 'Test',
          category: Category.CULTURAL,
          location: 'Test',
          startDate: tomorrow.toISOString(),
          endDate: dayAfter.toISOString(),
          capacity: 75,
        });

      eventId = createRes.body.id;
    });

    it('should get event by id', () => {
      return request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(eventId);
          expect(res.body.title).toBe('Detail Test Event');
          expect(res.body.creator).toBeDefined();
        });
    });

    it('should return 404 for non-existent event', () => {
      return request(app.getHttpServer())
        .get('/events/non-existent-id')
        .expect(404);
    });
  });

  describe('/events/:id (PATCH)', () => {
    let eventId: string;

    beforeAll(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const createRes = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Update Test Event',
          description: 'Test',
          category: Category.SPORTS,
          location: 'Test',
          startDate: tomorrow.toISOString(),
          endDate: dayAfter.toISOString(),
          capacity: 60,
        });

      eventId = createRes.body.id;
    });

    it('should update event by creator', () => {
      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Updated Event Title',
          capacity: 80,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Event Title');
          expect(res.body.capacity).toBe(80);
        });
    });

    it('should reject update by non-creator', () => {
      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(403);
    });

    it('should reject update without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(401);
    });
  });

  describe('/events/:id (DELETE)', () => {
    let eventId: string;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const createRes = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Delete Test Event',
          description: 'Test',
          category: Category.OTHER,
          location: 'Test',
          startDate: tomorrow.toISOString(),
          endDate: dayAfter.toISOString(),
          capacity: 50,
        });

      eventId = createRes.body.id;
    });

    it('should delete event by creator', () => {
      return request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('deleted');
        });
    });

    it('should reject delete by non-creator', async () => {
      return request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });
});
