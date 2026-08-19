import type { Response } from 'express';

const GUEST_CART_TOKEN_COOKIE = 'instant_guest_cart_id';
const GUEST_CART_EXPIRY = 14 * 24 * 60 * 60 * 1000;

export function setGuestCartCookie(res: Response, guestCartId: string) {
  return res.cookie(GUEST_CART_TOKEN_COOKIE, guestCartId, {
    maxAge: GUEST_CART_EXPIRY,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });
}

export function clearGuestCartCookie(res: Response) {
  return res.clearCookie(GUEST_CART_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });
}
