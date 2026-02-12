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

interface CreateUserResponseBody {
  id: string;
  username: string;
  email: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

interface UserPublicResponseBody {
  username: string;
  email: string;
  hashedPassword?: unknown;
}

describe('Users API (e2e)', () => {
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

  describe('POST /users', () => {
    describe('Anonymous user', () => {
      it('should create user with valid data', async () => {
        const response = await request(app.getHttpServer())
          .post('/users')
          .set('Content-Type', 'application/json')
          .send({
            username: 'gustavo',
            email: 'gstv.mra@gmail.com',
            password: '12345678',
          });

        expect(response.status).toBe(201);
        const body = response.body as CreateUserResponseBody;
        expect(body.username).toBe('gustavo');
        expect(body.email).toBe('gstv.mra@gmail.com');
        expect(body.features).toEqual(['read:activation_token']);
        expect(body.id).toBeDefined();
        expect(body.createdAt).toBeDefined();
        expect(body.updatedAt).toBeDefined();
      });

      it('should reject duplicated email (case insensitive)', async () => {
        await createUser(app, {
          username: 'emailduplicado1',
          email: 'emailduplicado@gmail.com',
          password: '12345678',
        });

        const response = await request(app.getHttpServer())
          .post('/users')
          .set('Content-Type', 'application/json')
          .send({
            username: 'emailduplicado2',
            email: 'Emailduplicado@gmail.com',
            password: '12345678',
          });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          name: 'ValidationError',
          message: 'The provided email is already in use.',
          action: 'Use another email to complete this operation.',
          status_code: 400,
        });
      });

      it('should reject duplicated username (case insensitive)', async () => {
        await createUser(app, {
          username: 'usernameDuplicado',
          email: 'emailduplicado1@gmail.com',
          password: '12345678',
        });

        const response = await request(app.getHttpServer())
          .post('/users')
          .set('Content-Type', 'application/json')
          .send({
            username: 'usernameduplicado',
            email: 'Emailduplicado2@gmail.com',
            password: '12345678',
          });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          name: 'ValidationError',
          message: 'The provided username is already in use.',
          action: 'Use another username to complete this operation.',
          status_code: 400,
        });
      });
    });

    describe('Logged in user (activated)', () => {
      it('should reject create user - lacks create:user feature', async () => {
        const user = await createUser(app, {
          username: 'usuariologado',
          email: 'usuario@logado.com',
          password: 'senha12345',
        });
        await activateUser(app, user.id);
        const session = await createSession(app, user.id);

        const response = await request(app.getHttpServer())
          .post('/users')
          .set('Content-Type', 'application/json')
          .set('Cookie', `session_id=${session.token}`)
          .send({
            username: 'outrousuario',
            email: 'outro@usuario.com',
            password: 'senha12345',
          });

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          name: 'ForbiddenError',
          message: 'You do not have permission to execute this action.',
          action: expect.stringContaining('create:user'),
          status_code: 403,
        });
      });
    });
  });

  describe('GET /users/:username', () => {
    it('should return user by username', async () => {
      await createUser(app, {
        username: 'testuser',
        email: 'test@user.com',
        password: '12345678',
      });

      const response = await request(app.getHttpServer())
        .get('/users/testuser')
        .send();

      expect(response.status).toBe(200);
      const body = response.body as UserPublicResponseBody;
      expect(body.username).toBe('testuser');
      expect(body.email).toBe('test@user.com');
      expect(body.hashedPassword).toBeUndefined();
    });

    it('should return 404 for non-existent username', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/nonexistent')
        .send();

      expect(response.status).toBe(404);
    });
  });
});
