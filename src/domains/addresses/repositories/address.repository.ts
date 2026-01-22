/**
 * Address repository - Data access layer for addresses
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Address, CreateAddressData, UpdateAddressData } from '../types/address.types';

export class AddressRepository {
  async findById(id: string): Promise<Address | null> {
    return prisma.address.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Address[]> {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findDefaultByUserId(userId: string): Promise<Address | null> {
    return prisma.address.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  async create(data: CreateAddressData): Promise<Address> {
    return prisma.address.create({
      data,
    });
  }

  async update(id: string, data: UpdateAddressData): Promise<Address> {
    return prisma.address.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.address.delete({
      where: { id },
    });
  }

  async setDefault(userId: string, addressId: string): Promise<void> {
    // Remove default from all addresses
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Set new default
    await prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }
}

