import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import {
  clearDatabase,
  createUser,
  activateUser,
  createSession,
} from '../orchestrator';

interface CreateSessionResponseBody {
  message: string;
  expiresAt: string;
}

describe('Sessions API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  beforeEach(async () => {
    await clearDatabase(app);
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('POST /sessions', () => {
    it('should reject incorrect email', async () => {
      await createUser(app, { password: 'senha-correta' });

      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Content-Type', 'application/json')
        .send({
          email: 'email.errado@gmail.com',
          password: 'senha-correta',
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        name: 'UnauthorizedError',
        message: 'Invalid credentials.',
        action: 'Verify that the submitted data is correct.',
        status_code: 401,
      });
    });

    it('should reject incorrect password', async () => {
      await createUser(app, {
        email: 'email.correto@gmail.com',
        password: 'senha-correta',
      });

      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Content-Type', 'application/json')
        .send({
          email: 'email.correto@gmail.com',
          password: 'senha-incorreta',
        });

      expect(response.status).toBe(401);
    });

    it('should create session with correct credentials and set cookie', async () => {
      const createdUser = await createUser(app, {
        email: 'tudo.correto@gmail.com',
        password: 'tudocorreto',
      });
      await activateUser(app, createdUser.id);

      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Content-Type', 'application/json')
        .send({
          email: 'tudo.correto@gmail.com',
          password: 'tudocorreto',
        });

      expect(response.status).toBe(201);
      const body = response.body as CreateSessionResponseBody;
      expect(body.expiresAt).toBeDefined();
      expect(body.message).toBe('Session created successfully');

      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookieStr = Array.isArray(setCookie)
        ? setCookie.join('')
        : (setCookie ?? '');
      expect(cookieStr).toMatch(/session_id=[a-f0-9]+/);
    });
  });

  describe('DELETE /sessions', () => {
    it('should clear session cookie on logout', async () => {
      const user = await createUser(app, {
        email: 'logout@test.com',
        password: 'senha12345',
      });
      await activateUser(app, user.id);
      const session = await createSession(app, user.id);

      const response = await request(app.getHttpServer())
        .delete('/sessions')
        .set('Cookie', `session_id=${session.token}`);

      expect(response.status).toBe(204);
      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookieStr = Array.isArray(setCookie)
        ? setCookie.join('')
        : (setCookie ?? '');
      expect(cookieStr).toContain('session_id=;');
    });
  });
});
