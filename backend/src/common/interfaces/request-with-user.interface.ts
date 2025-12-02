import { Request } from 'express';
import { Role } from '@prisma/client';

export interface RequestWithUser extends Request {
  user: {
    sub: string; // User ID
    email: string;
    role: Role;
  };
}
