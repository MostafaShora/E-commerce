import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Address, AddressDocument } from './schemas/address.schema';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>,
  ) {}

  async createAddress(userId: string, data: CreateAddressDto) {
    await this.addressModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        isDefault: true,
      },
      {
        $set: {
          isDefault: false,
        },
      },
    );

    const address = await this.addressModel.create({
      ...data,
      userId: new Types.ObjectId(userId),
      isDefault: true,
    });

    return address;
  }

  async getUserAddresses(userId: string) {
    const addresses = await this.addressModel
      .find({
        userId: new Types.ObjectId(userId),
      })
      .sort({
        isDefault: -1,
        createdAt: -1,
      })
      .lean();

    return {
      addresses,
    };
  }
}
