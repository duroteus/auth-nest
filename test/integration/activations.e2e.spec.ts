import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { eq } from 'drizzle-orm';
import { AppModule } from '../../src/app.module';
import { DrizzleService } from '../../src/infra/database/drizzle/drizzle.service';
import { activationTokens } from '../../src/infra/database/drizzle/schema';
import { clearDatabase, createUser } from '../orchestrator';

interface ActivateResponseBody {
  message: string;
  user: { features: string[] };
}

describe('Activations API (e2e)', () => {
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

  describe('PATCH /activations/:tokenId', () => {
    it('should activate account with valid token', async () => {
      const user = await createUser(app, {
        username: 'activateuser',
        email: 'activate@user.com',
        password: '12345678',
      });

      const drizzleService = app.get(DrizzleService);
      const [token] = await drizzleService.connection
        .select()
        .from(activationTokens)
        .where(eq(activationTokens.userId, user.id))
        .limit(1);

      if (!token) {
        throw new Error('Activation token not found after user creation');
      }

      const response = await request(app.getHttpServer())
        .patch(`/activations/${token.id}`)
        .send();

      expect(response.status).toBe(200);
      const body = response.body as ActivateResponseBody;
      expect(body.message).toBe('Account activated successfully');
      expect(body.user.features).toEqual([
        'create:session',
        'read:session',
        'update:user',
      ]);
    });

    it('should reject invalid token', async () => {
      const response = await request(app.getHttpServer())
        .patch('/activations/00000000-0000-0000-0000-000000000000')
        .send();

      expect(response.status).toBe(404);
    });
  });
});
