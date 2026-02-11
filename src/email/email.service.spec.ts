import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    // Set environment variables for testing
    process.env.SMTP_HOST = 'localhost';
    process.env.SMTP_PORT = '1025';
    process.env.SMTP_FROM_EMAIL = 'test@test.com';
    process.env.SMTP_FROM_NAME = 'Test';
    process.env.APP_BASE_URL = 'http://localhost:3000';

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have sendEmail method', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.sendEmail).toBeDefined();
    expect(typeof service.sendEmail).toBe('function');
  });

  it('should have sendActivationEmail method', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.sendActivationEmail).toBeDefined();
    expect(typeof service.sendActivationEmail).toBe('function');
  });
});
