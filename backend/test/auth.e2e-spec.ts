import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const registerDto = {
        email: `test.${Date.now()}@kazguu.kz`,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        faculty: 'Engineering',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('registered');
        });
    });

    it('should reject registration with invalid email', () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject registration with weak password', () => {
      const registerDto = {
        email: `test.${Date.now()}@kazguu.kz`,
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject registration with missing required fields', () => {
      const registerDto = {
        email: `test.${Date.now()}@kazguu.kz`,
        password: 'Password123!',
        // Missing firstName and lastName
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject duplicate email registration', async () => {
      const email = `duplicate.${Date.now()}@kazguu.kz`;
      const registerDto = {
        email,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409); // Conflict
    });
  });

  describe('/auth/login (POST)', () => {
    it('should reject login for unverified user', async () => {
      // Create an unverified user first
      const email = `unverified.${Date.now()}@kazguu.kz`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'Password123!',
        })
        .expect(401); // Unauthorized - email not verified
    });

    it('should reject login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@kazguu.kz',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should reject login with missing fields', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@kazguu.kz',
          // Missing password
        })
        .expect(400);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Logged out');
        });
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full registration flow', async () => {
      const email = `fullflow.${Date.now()}@kazguu.kz`;
      const password = 'Password123!';

      // Step 1: Register
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          firstName: 'Full',
          lastName: 'Flow',
          faculty: 'Engineering',
        })
        .expect(201);

      expect(registerRes.body).toHaveProperty('message');

      // Step 2: Try to login (should fail - email not verified)
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(401);

      // Step 3: Verify email manually in database for testing
      const user = await prisma.user.findUnique({ where: { email } });
      expect(user).toBeTruthy();

      await prisma.user.update({
        where: { email },
        data: { emailVerified: true },
      });

      // Step 4: Login should now succeed
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      expect(loginRes.body).toHaveProperty('accessToken');
      expect(loginRes.body).toHaveProperty('user');
      expect(loginRes.body.user.email).toBe(email);

      // Step 5: Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200);
    });
  });
});
