import { Injectable } from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class PasswordsService {
  async hash(password: string): Promise<string> {
    const rounds = this.getNumberOfRounds();
    return await bcryptjs.hash(password, rounds);
  }

  async compare(
    providedPassword: string,
    storedPassword: string,
  ): Promise<boolean> {
    return await bcryptjs.compare(providedPassword, storedPassword);
  }

  private getNumberOfRounds(): number {
    return process.env.NODE_ENV === 'production' ? 14 : 1;
  }
}
