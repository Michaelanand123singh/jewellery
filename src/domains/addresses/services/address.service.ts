/**
 * Address service - Business logic for addresses
 */

import { AddressRepository } from '../repositories/address.repository';
import { Address, CreateAddressData, UpdateAddressData } from '../types/address.types';
import { NotFoundError, ValidationError } from '@/src/shared/utils/errors';

export class AddressService {
  private addressRepository: AddressRepository;

  constructor() {
    this.addressRepository = new AddressRepository();
  }

  async getAddressById(id: string, userId?: string): Promise<Address> {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new NotFoundError('Address');
    }

    // If userId provided, ensure address belongs to user
    if (userId && address.userId !== userId) {
      throw new NotFoundError('Address');
    }

    return address;
  }

  async getAddressesByUserId(userId: string): Promise<Address[]> {
    return this.addressRepository.findByUserId(userId);
  }

  async createAddress(data: CreateAddressData): Promise<Address> {
    // If this is set as default, remove default from other addresses
    if (data.isDefault) {
      const defaultAddress = await this.addressRepository.findDefaultByUserId(data.userId);
      if (defaultAddress) {
        await this.addressRepository.update(defaultAddress.id, { isDefault: false });
      }
    } else {
      // If no default exists, make this one default
      const defaultAddress = await this.addressRepository.findDefaultByUserId(data.userId);
      if (!defaultAddress) {
        data.isDefault = true;
      }
    }

    return this.addressRepository.create(data);
  }

  async updateAddress(
    id: string,
    userId: string,
    data: UpdateAddressData
  ): Promise<Address> {
    // Verify address belongs to user
    await this.getAddressById(id, userId);

    // If setting as default, remove default from other addresses
    if (data.isDefault) {
      await this.addressRepository.setDefault(userId, id);
    }

    return this.addressRepository.update(id, data);
  }

  async deleteAddress(id: string, userId: string): Promise<void> {
    const address = await this.getAddressById(id, userId);

    // Don't allow deleting default address if there are other addresses
    if (address.isDefault) {
      const addresses = await this.addressRepository.findByUserId(userId);
      if (addresses.length > 1) {
        throw new ValidationError('Cannot delete default address. Please set another address as default first.');
      }
    }

    await this.addressRepository.delete(id);
  }

  async setDefaultAddress(id: string, userId: string): Promise<Address> {
    await this.getAddressById(id, userId);
    await this.addressRepository.setDefault(userId, id);
    return this.getAddressById(id);
  }
}

