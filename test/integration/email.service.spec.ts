import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../../src/email/email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
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
