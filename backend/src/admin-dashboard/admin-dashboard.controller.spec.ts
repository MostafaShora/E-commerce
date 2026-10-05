import { AdminDashboardController } from './admin-dashboard.controller';

describe('AdminDashboardController', () => {
  it('returns the dashboard analytics API response', async () => {
    const analytics = {
      totalSales: 145.18,
      totalOrders: 6,
      totalProducts: 12,
      totalOutOfStock: 3,
    };
    const adminDashboardService = {
      getAnalytics: jest.fn().mockResolvedValue(analytics),
    };
    const controller = new AdminDashboardController(
      adminDashboardService as never,
    );

    await expect(controller.getAnalytics()).resolves.toEqual({
      message: 'Analytics retrieved successfully',
      ...analytics,
    });
    expect(adminDashboardService.getAnalytics).toHaveBeenCalledTimes(1);
  });
});