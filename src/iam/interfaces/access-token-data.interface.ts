import { UserRole } from '@prisma/client';

export interface AccessTokenData {
  sub: number; // user ID
  email: string;
  role: UserRole;
}
