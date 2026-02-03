/**
 * User repository - Data access layer for users
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { User } from '../types/auth.types';

export class UserRepository {
  async findByEmail(email: string): Promise<(User & { password: string | null; provider: string; providerId: string | null }) | null> {
    return prisma.user.findUnique({
      where: { email },
    }) as Promise<(User & { password: string | null; provider: string; providerId: string | null }) | null>;
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: {
    email: string;
    password?: string | null;
    name?: string;
    phone?: string;
    role?: string;
    provider?: string;
    providerId?: string | null;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password || null,
        name: data.name,
        phone: data.phone,
        role: data.role || 'USER',
        provider: data.provider || 'local',
        providerId: data.providerId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'phone'>>
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

