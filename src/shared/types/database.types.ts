/**
 * Database-related types
 */

import { PrismaClient } from '@prisma/client';

export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export type DatabaseError = {
  code: string;
  message: string;
  meta?: Record<string, any>;
};

