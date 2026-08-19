import type { UserDocument } from '../../auth/schemas/user.schema';

declare global {
  namespace Express {
    interface User extends UserDocument {}

    interface Request {
      guestCartId?: string | null;
    }
  }
}

export {};
