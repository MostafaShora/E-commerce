import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { PAYMENT_STATUS } from '../common/constants/enums';
import { Order, OrderDocument } from '../order/schemas/order.schema';
import { Product, ProductDocument } from '../product/schemas/product.schema';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async getAnalytics() {
    const [totalOrders, totalProducts, totalOutOfStock, totalSalesResult] =
      await Promise.all([
        this.orderModel.countDocuments(),
        this.productModel.countDocuments(),
        this.productModel.countDocuments({ stockCount: { $lte: 0 } }),
        this.orderModel.aggregate([
          { $match: { paymentStatus: PAYMENT_STATUS.PAID } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);

    return {
      totalSales: totalSalesResult[0]?.total ?? 0,
      totalOrders,
      totalProducts,
      totalOutOfStock,
    };
  }
}
