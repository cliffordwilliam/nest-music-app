import { Injectable } from '@nestjs/common';
import { genSalt, hash, compare } from 'bcryptjs';

@Injectable()
export class HashingService {
  async hash(data: string): Promise<string> {
    const salt = await genSalt();
    return hash(data, salt);
  }

  compare(data: string, encrypted: string): Promise<boolean> {
    return compare(data, encrypted);
  }
}
