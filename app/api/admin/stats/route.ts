import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    // Get date ranges for comparisons
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfLastWeek = new Date(now);
    startOfLastWeek.setDate(now.getDate() - 14);

    // Fetch all statistics in parallel
    const [
      totalRevenue,
      lastMonthRevenue,
      totalOrders,
      lastHourOrders,
      totalProducts,
      newProductsThisMonth,
      totalUsers,
      newUsersThisWeek,
      recentOrders,
    ] = await Promise.all([
      // Total revenue (sum of all completed/delivered orders)
      prisma.order.aggregate({
        where: {
          status: {
            in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Last month revenue
      prisma.order.aggregate({
        where: {
          status: {
            in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
          },
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfMonth,
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Total orders count
      prisma.order.count({
        where: {
          status: {
            not: 'CANCELLED',
          },
        },
      }),
      // Orders in last hour (for active orders calculation)
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 60 * 60 * 1000),
          },
          status: {
            not: 'CANCELLED',
          },
        },
      }),
      // Total products
      prisma.product.count(),
      // New products this month
      prisma.product.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
      // Total users
      prisma.user.count(),
      // New users this week
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfWeek,
          },
        },
      }),
      // Recent orders for sales list
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          status: {
            not: 'CANCELLED',
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Calculate revenue change percentage
    const currentRevenue = totalRevenue._sum.total || 0;
    const previousRevenue = lastMonthRevenue._sum.total || 0;
    const revenueChange = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Calculate orders change (using last hour as proxy for "since last hour")
    const ordersChange = lastHourOrders;

    // Calculate products change percentage
    const productsChange = newProductsThisMonth;

    // Calculate users change
    const usersChange = newUsersThisWeek;

    // Format recent sales
    const recentSales = recentOrders.map((order) => ({
      id: order.id,
      customerName: order.user.name || 'Guest',
      customerEmail: order.user.email,
      amount: order.total,
      date: order.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          total: currentRevenue,
          change: parseFloat(revenueChange.toFixed(1)),
        },
        orders: {
          total: totalOrders,
          active: lastHourOrders,
          change: ordersChange,
        },
        products: {
          total: totalProducts,
          new: newProductsThisMonth,
          change: productsChange,
        },
        users: {
          total: totalUsers,
          new: newUsersThisWeek,
          change: usersChange,
        },
        recentSales,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

