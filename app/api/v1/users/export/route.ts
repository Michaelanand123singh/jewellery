/**
 * GET /api/v1/users/export - Export users to CSV (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/src/domains/users/services/user.service';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', '/api/v1/users/export', ip);

    await requireAdminRole(request);

    const { searchParams } = new URL(request.url);

    // Build filters from query params
    const filters: any = {};
    if (searchParams.get('role') && searchParams.get('role') !== 'all') {
      filters.role = searchParams.get('role');
    }
    if (searchParams.get('provider') && searchParams.get('provider') !== 'all') {
      filters.provider = searchParams.get('provider');
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search');
    }
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!);
    }
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!);
    }
    if (searchParams.get('hasOrders') === 'true') {
      filters.hasOrders = true;
    } else if (searchParams.get('hasOrders') === 'false') {
      filters.hasOrders = false;
    }

    // Build sort
    const sort: any = {};
    if (searchParams.get('sortBy')) {
      sort.sortBy = searchParams.get('sortBy');
    }
    if (searchParams.get('sortOrder')) {
      sort.sortOrder = searchParams.get('sortOrder');
    }

    const userService = new UserService();
    const users = await userService.getAllUsersForExport(filters, sort);

    // Define CSV headers
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Role',
      'Provider',
      'Orders',
      'Total Spent',
      'Addresses',
      'Cart Items',
      'Wishlist Items',
      'Reviews',
      'Joined Date',
    ];

    // Build CSV rows
    const rows = users.map((user) => [
      user.id,
      user.name || 'N/A',
      user.email,
      user.phone || 'N/A',
      user.role,
      user.provider || 'local',
      (user._count?.orders || 0).toString(),
      (user.totalSpent || 0).toFixed(2),
      (user._count?.addresses || 0).toString(),
      (user._count?.cartItems || 0).toString(),
      (user._count?.wishlistItems || 0).toString(),
      (user._count?.reviews || 0).toString(),
      format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    // Escape CSV fields properly
    const escapeCsvField = (value: any): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map((row) => row.map(escapeCsvField).join(',')),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

