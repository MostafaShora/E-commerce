import { AdminDashboardService } from './admin-dashboard.service';
import { PAYMENT_STATUS } from '../common/constants/enums';

describe('AdminDashboardService', () => {
  it('matches MERN analytics rules for payment and inventory', async () => {
    const orderModel = {
      countDocuments: jest.fn().mockResolvedValue(6),
      aggregate: jest.fn().mockResolvedValue([{ _id: null, total: 145.18 }]),
    };
    const productModel = {
      countDocuments: jest
        .fn()
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(3),
    };
    const service = new AdminDashboardService(
      orderModel as never,
      productModel as never,
    );

    await expect(service.getAnalytics()).resolves.toEqual({
      totalSales: 145.18,
      totalOrders: 6,
      totalProducts: 12,
      totalOutOfStock: 3,
    });
    expect(orderModel.aggregate).toHaveBeenCalledWith([
      { $match: { paymentStatus: PAYMENT_STATUS.PAID } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    expect(orderModel.countDocuments).toHaveBeenCalledWith();
    expect(productModel.countDocuments).toHaveBeenNthCalledWith(1);
    expect(productModel.countDocuments).toHaveBeenNthCalledWith(2, {
      stockCount: { $lte: 0 },
    });
  });

  it('returns zero revenue when no paid orders exist', async () => {
    const orderModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue([]),
    };
    const productModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
    };
    const service = new AdminDashboardService(
      orderModel as never,
      productModel as never,
    );

    await expect(service.getAnalytics()).resolves.toEqual({
      totalSales: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalOutOfStock: 0,
    });
  });
});
