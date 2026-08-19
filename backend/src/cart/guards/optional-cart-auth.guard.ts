import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import type { Request, Response } from 'express';

import { generateGuestCartId } from '../../common/utils/helper';
import { setGuestCartCookie } from '../../common/utils/cookie.util';

import passport from 'passport';

@Injectable()
export class OptionalCartAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const token = req.cookies?.instant_access_token;

    // Guest
    if (!token) {
      const guestCartId =
        req.cookies?.instant_guest_cart_id ?? generateGuestCartId();

      req.user = undefined;
      req.guestCartId = guestCartId;

      if (!req.cookies?.instant_guest_cart_id) {
        setGuestCartCookie(res, guestCartId);
      }

      return true;
    }

    // Logged user
    return new Promise<boolean>((resolve, reject) => {
      passport.authenticate(
        'jwt',
        {
          session: false,
        },
        (error: unknown, user: any) => {
          if (error) {
            reject(error);
            return;
          }

          if (user) {
            req.user = user;
            req.guestCartId = null;
          } else {
            req.user = undefined;

            const guestCartId =
              req.cookies?.instant_guest_cart_id ?? generateGuestCartId();

            req.guestCartId = guestCartId;

            if (!req.cookies?.instant_guest_cart_id) {
              setGuestCartCookie(res, guestCartId);
            }
          }

          resolve(true);
        },
      )(req, res, () => {});
    });
  }
}
