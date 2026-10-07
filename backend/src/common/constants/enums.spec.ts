import {
  normalizeOrderStatus,
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
} from './enums';

describe('Order status lifecycle', () => {
  it('contains only the active statuses in lifecycle order', () => {
    expect(ORDER_STATUS_VALUES).toEqual([
      'placed',
      'confirmed',
      'packed',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ]);
  });

  it('normalizes legacy assigned records to packed', () => {
    expect(normalizeOrderStatus('assigned')).toBe(ORDER_STATUS.PACKED);
  });

  it('keeps supported statuses and falls back for unknown values', () => {
    expect(normalizeOrderStatus('out_for_delivery')).toBe(
      ORDER_STATUS.OUT_FOR_DELIVERY,
    );
    expect(normalizeOrderStatus('unknown')).toBe(ORDER_STATUS.PLACED);
  });
});
