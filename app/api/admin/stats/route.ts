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
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfLastWeek = new Date(now);
    startOfLastWeek.setDate(now.getDate() - 14);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Get last 30 days for revenue chart
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

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
      todayRevenue,
      weekRevenue,
      todayOrders,
      weekOrders,
      newUsersToday,
      recentOrders,
      orderStatusBreakdown,
      paymentStatusBreakdown,
      topProducts,
      topCustomers,
      lowStockProducts,
      pendingOrders,
      averageOrderValue,
      revenueByDay,
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
      // Today's revenue
      prisma.order.aggregate({
        where: {
          status: {
            in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
          },
          createdAt: {
            gte: startOfToday,
          },
        },
        _sum: {
          total: true,
        },
      }),
      // This week's revenue
      prisma.order.aggregate({
        where: {
          status: {
            in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
          },
          createdAt: {
            gte: startOfWeek,
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Today's orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
          status: {
            not: 'CANCELLED',
          },
        },
      }),
      // This week's orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfWeek,
          },
          status: {
            not: 'CANCELLED',
          },
        },
      }),
      // New users today
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
      // Recent orders for sales list
      prisma.order.findMany({
        take: 10,
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
      // Order status breakdown
      prisma.order.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      }),
      // Payment status breakdown
      prisma.order.groupBy({
        by: ['paymentStatus'],
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      }),
      // Top products by sales
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true,
          price: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 10,
      }),
      // Top customers by order value
      prisma.order.groupBy({
        by: ['userId'],
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            total: 'desc',
          },
        },
        take: 10,
      }),
      // Low stock products
      prisma.product.count({
        where: {
          stockQuantity: {
            lte: 10,
          },
          inStock: true,
        },
      }),
      // Pending orders count
      prisma.order.count({
        where: {
          status: 'PENDING',
        },
      }),
      // Average order value
      prisma.order.aggregate({
        where: {
          status: {
            not: 'CANCELLED',
          },
          createdAt: {
            gte: startOfMonth,
          },
        },
        _avg: {
          total: true,
        },
        _count: {
          id: true,
        },
      }),
      // Revenue by day (last 30 days)
      Promise.all(
        last30Days.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          
          const dayRevenue = await prisma.order.aggregate({
            where: {
              status: {
                in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
              },
              createdAt: {
                gte: date,
                lt: nextDay,
              },
            },
            _sum: {
              total: true,
            },
          });
          
          return {
            date: date.toISOString().split('T')[0],
            revenue: dayRevenue._sum.total || 0,
          };
        })
      ),
    ]);

    // Calculate revenue metrics
    const currentRevenue = totalRevenue._sum.total || 0;
    const previousRevenue = lastMonthRevenue._sum.total || 0;
    const revenueChange = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;
    const todayRevenueAmount = todayRevenue._sum.total || 0;
    const weekRevenueAmount = weekRevenue._sum.total || 0;

    // Calculate orders metrics
    const ordersChange = totalOrders > 0
      ? parseFloat(((todayOrders / totalOrders) * 100).toFixed(1))
      : 0;

    // Calculate products change
    const productsChange = newProductsThisMonth;

    // Calculate users change
    const usersChange = newUsersThisWeek;

    // Get product details for top products
    const topProductIds = topProducts.map(p => p.productId);
    const topProductsWithDetails = await prisma.product.findMany({
      where: {
        id: {
          in: topProductIds,
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
      },
    });

    // Get user details for top customers
    const topCustomerIds = topCustomers.map(c => c.userId).filter(Boolean);
    const topCustomersWithDetails = topCustomerIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: {
              in: topCustomerIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : [];

    // Format top products
    const formattedTopProducts = topProducts.map((item) => {
      const product = topProductsWithDetails.find(p => p.id === item.productId);
      return {
        id: item.productId,
        name: product?.name || 'Unknown Product',
        image: product?.image || '',
        price: product?.price || 0,
        quantitySold: item._sum.quantity || 0,
        revenue: (item._sum.price || 0) * (item._sum.quantity || 0),
      };
    });

    // Format top customers
    const formattedTopCustomers = topCustomers
      .filter(c => c.userId)
      .map((item) => {
        const customer = topCustomersWithDetails.find(u => u.id === item.userId);
        return {
          id: item.userId,
          name: customer?.name || 'Guest',
          email: customer?.email || '',
          totalSpent: item._sum.total || 0,
          orderCount: item._count.id || 0,
        };
      });

    // Format order status breakdown
    const orderStatusData = orderStatusBreakdown.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Format payment status breakdown
    const paymentStatusData = paymentStatusBreakdown.reduce((acc, item) => {
      acc[item.paymentStatus] = {
        count: item._count.id,
        total: item._sum.total || 0,
      };
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Calculate conversion rate (orders / users)
    const conversionRate = totalUsers > 0
      ? ((totalOrders / totalUsers) * 100).toFixed(2)
      : '0';

    // Format recent sales
    const recentSales = recentOrders.map((order) => ({
      id: order.id,
      customerName: order.user.name || 'Guest',
      customerEmail: order.user.email,
      amount: order.total,
      date: order.createdAt,
      status: order.status,
    }));

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          total: currentRevenue,
          today: todayRevenueAmount,
          week: weekRevenueAmount,
          change: parseFloat(revenueChange.toFixed(1)),
        },
        orders: {
          total: totalOrders,
          today: todayOrders,
          week: weekOrders,
          active: lastHourOrders,
          pending: pendingOrders,
          change: ordersChange,
        },
        products: {
          total: totalProducts,
          new: newProductsThisMonth,
          change: productsChange,
          lowStock: lowStockProducts,
        },
        users: {
          total: totalUsers,
          new: newUsersThisWeek,
          today: newUsersToday,
          change: usersChange,
        },
        metrics: {
          averageOrderValue: averageOrderValue._avg.total || 0,
          conversionRate: parseFloat(conversionRate),
          totalTransactions: averageOrderValue._count.id || 0,
        },
        orderStatusBreakdown: orderStatusData,
        paymentStatusBreakdown: paymentStatusData,
        topProducts: formattedTopProducts,
        topCustomers: formattedTopCustomers,
        revenueChart: revenueByDay,
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

