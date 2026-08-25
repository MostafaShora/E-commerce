import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Address, AddressDocument } from './schemas/address.schema';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

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

  async updateAddress(
    userId: string,
    addressId: string,
    data: UpdateAddressDto,
  ) {
    if (!Types.ObjectId.isValid(addressId)) {
      throw new BadRequestException('Invalid address ID');
    }

    const address = await this.addressModel.findOne({
      _id: new Types.ObjectId(addressId),
      userId: new Types.ObjectId(userId),
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (data.recipientName !== undefined) {
      address.recipientName = data.recipientName;
    }

    if (data.phone !== undefined) {
      address.phone = data.phone;
    }

    if (data.street !== undefined) {
      address.street = data.street;
    }

    if (data.city !== undefined) {
      address.city = data.city;
    }

    if (data.state !== undefined) {
      address.state = data.state;
    }

    if (data.postalCode !== undefined) {
      address.postalCode = data.postalCode;
    }

    if (data.country !== undefined) {
      address.country = data.country;
    }

    await address.save();

    return address;
  }

  async deleteAddress(userId: string, addressId: string) {
    if (!Types.ObjectId.isValid(addressId)) {
      throw new BadRequestException('Invalid address ID');
    }

    const address = await this.addressModel.findOne({
      _id: new Types.ObjectId(addressId),
      userId: new Types.ObjectId(userId),
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const wasDefault = address.isDefault;

    await this.addressModel.deleteOne({
      _id: address._id,
      userId: new Types.ObjectId(userId),
    });

    // If the deleted address was the default address,
    // set the most recent remaining address as the new default
    if (wasDefault) {
      const nextDefaultAddress = await this.addressModel
        .findOne({
          userId: new Types.ObjectId(userId),
        })
        .sort({ createdAt: -1 });

      if (nextDefaultAddress) {
        nextDefaultAddress.isDefault = true;
        await nextDefaultAddress.save();
      }
    }

    return address;
  }
}
