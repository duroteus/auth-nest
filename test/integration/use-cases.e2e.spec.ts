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
  deleteAllEmails,
  getLastEmail,
  extractUUID,
} from '../orchestrator';

interface CreateUserResponseBody {
  id: string;
  username: string;
  email: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

interface ActivateResponseBody {
  message: string;
  user: CreateUserResponseBody & { features: string[] };
}

interface UserResponseBody {
  id: string;
  username: string;
  features: string[];
}

describe('Use case: Registration Flow (e2e)', () => {
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
    await deleteAllEmails();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('full flow: create user -> receive email -> activate -> login -> get user', async () => {
    const createUserResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({
        username: 'registrationflow',
        email: 'registration@flow.com.br',
        password: 'RegistrationFlow',
      });

    expect(createUserResponse.status).toBe(201);
    const createUserBody = createUserResponse.body as CreateUserResponseBody;
    expect(createUserBody.username).toBe('registrationflow');
    expect(createUserBody.email).toBe('registration@flow.com.br');
    expect(createUserBody.features).toEqual(['read:activation_token']);

    const lastEmail = await getLastEmail();
    expect(lastEmail).not.toBeNull();
    expect(lastEmail!.recipients[0]).toContain('registration@flow.com.br');
    expect(lastEmail!.subject).toContain('Activate');
    expect(lastEmail!.text).toContain('registrationflow');

    const activationTokenId = extractUUID(lastEmail!.text);
    expect(activationTokenId).not.toBeNull();

    const activateResponse = await request(app.getHttpServer())
      .patch(`/activations/${activationTokenId}`)
      .send();

    expect(activateResponse.status).toBe(200);
    const activateBody = activateResponse.body as ActivateResponseBody;
    expect(activateBody.user.features).toEqual([
      'create:session',
      'read:session',
      'update:user',
    ]);

    const loginResponse = await request(app.getHttpServer())
      .post('/sessions')
      .set('Content-Type', 'application/json')
      .send({
        email: 'registration@flow.com.br',
        password: 'RegistrationFlow',
      });

    expect(loginResponse.status).toBe(201);
    const setCookie = loginResponse.headers['set-cookie'] as
      | string[]
      | undefined;
    expect(setCookie).toBeDefined();
    const sessionMatch = setCookie?.join('').match(/session_id=([^;]+)/);
    const sessionToken = sessionMatch ? sessionMatch[1] : '';

    const userResponse = await request(app.getHttpServer())
      .get('/user')
      .set('Cookie', `session_id=${sessionToken}`);

    expect(userResponse.status).toBe(200);
    const userBody = userResponse.body as UserResponseBody;
    expect(userBody.id).toBe(createUserBody.id);
    expect(userBody.username).toBe('registrationflow');
  });

  it('activation via orchestrator -> login -> get user', async () => {
    const user = await createUser(app, {
      username: 'FlowUser',
      email: 'flow@user.com',
      password: 'FlowPassword',
    });
    await activateUser(app, user.id);
    const session = await createSession(app, user.id);

    const userResponse = await request(app.getHttpServer())
      .get('/user')
      .set('Cookie', `session_id=${session.token}`);

    expect(userResponse.status).toBe(200);
    const userBody = userResponse.body as UserResponseBody;
    expect(userBody.id).toBe(user.id);
    expect(userBody.username).toBe('flowuser');
    expect(userBody.features).toEqual([
      'create:session',
      'read:session',
      'update:user',
    ]);
  });
});
