import { prisma } from "../lib/prisma.js"
import { EnumOrderStatus } from "../../generated/prisma/client.js"

interface DateRange {
  start: Date
  end: Date
}

const getTodayRange = (): DateRange => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return { start, end }
}

const getLastNDaysRange = (days: number): DateRange => {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const start = new Date(now)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

const getTodaySummary = async () => {
  const { start, end } = getTodayRange()

  const [totalOrders, totalRevenue] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: {
          in: [EnumOrderStatus.PAID, EnumOrderStatus.PROCESSING, EnumOrderStatus.DELIVERED, EnumOrderStatus.COMPLETED],
        },
      },
      _sum: {
        totalPayment: true,
      },
    }),
  ])

  return {
    totalOrders,
    totalRevenue: totalRevenue._sum.totalPayment || 0,
  }
}

const getOrdersChart = async (days: number = 7) => {
  const { start, end } = getLastNDaysRange(days)

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  // Initialize date map with zero counts
  const dateMap = new Map<string, number>()
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const parts = date.toISOString().split("T")
    const dateStr = parts[0] ?? ""
    dateMap.set(dateStr, 0)
  }

  // Count orders per date
  orders.forEach((order) => {
    const parts = order.createdAt.toISOString().split("T")
    const dateStr = parts[0] ?? ""
    const currentCount = dateMap.get(dateStr) ?? 0
    dateMap.set(dateStr, currentCount + 1)
  })

  // Convert to array
  const chartData = Array.from(dateMap.entries()).map(([date, count]) => ({
    date,
    count,
  }))

  return chartData
}

const getRecentOrders = async (limit: number = 5) => {
  return await prisma.order.findMany({
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          username: true,
          email: true,
        },
      },
      address: true,
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  })
}

const getDashboardData = async (days?: number) => {
  const [summary, chartData, recentOrders] = await Promise.all([
    getTodaySummary(),
    getOrdersChart(days),
    getRecentOrders(5),
  ])

  return {
    summary,
    chartData,
    recentOrders,
  }
}

const getMonthRange = (year: number, month: number): DateRange => {
  const start = new Date(year, month - 1, 1, 0, 0, 0)
  const end = new Date(year, month, 0, 23, 59, 59)
  return { start, end }
}

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate()
}

const getReport = async (month?: number, year?: number) => {
  const now = new Date()
  const selectedMonth = month ?? now.getMonth() + 1
  const selectedYear = year ?? now.getFullYear()

  const { start, end } = getMonthRange(selectedYear, selectedMonth)
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)

  const completedStatuses = [
    EnumOrderStatus.PAID,
    EnumOrderStatus.PROCESSING,
    EnumOrderStatus.DELIVERED,
    EnumOrderStatus.COMPLETED,
  ]

  // Get total revenue, completed orders, and unique customers
  const [revenueResult, completedOrders, customers] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: completedStatuses },
      },
      _sum: { totalPayment: true },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: EnumOrderStatus.COMPLETED,
      },
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: {
        createdAt: { gte: start, lte: end },
      },
    }),
  ])

  const totalRevenue = revenueResult._sum.totalPayment || 0

  // Get revenue trend for the month (daily breakdown)
  const ordersInMonth = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: { in: completedStatuses },
    },
    select: {
      createdAt: true,
      totalPayment: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  // Initialize date map with zero revenue
  const revenueMap = new Map<string, number>()
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(selectedYear, selectedMonth - 1, day)
    const parts = date.toISOString().split("T")
    const dateStr = parts[0] ?? ""
    revenueMap.set(dateStr, 0)
  }

  // Sum revenue per date
  ordersInMonth.forEach((order) => {
    const parts = order.createdAt.toISOString().split("T")
    const dateStr = parts[0] ?? ""
    const currentRevenue = revenueMap.get(dateStr) ?? 0
    revenueMap.set(dateStr, currentRevenue + order.totalPayment)
  })

  const revenueTrend = Array.from(revenueMap.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }))

  // Get top 5 best-selling products
  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        createdAt: { gte: start, lte: end },
        status: { in: completedStatuses },
      },
    },
    _sum: {
      quantity: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 5,
  })

  // Fetch product details
  const productIds = topProducts.map((p) => p.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      price: true,
      image: true,
    },
  })

  const topProductsData = topProducts.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    return {
      product: product ?? null,
      totalQuantity: item._sum.quantity ?? 0,
      totalOrders: item._count.id,
    }
  })

  // Get top 5 categories by sales
  const topCategories = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        createdAt: { gte: start, lte: end },
        status: { in: completedStatuses },
      },
    },
    _sum: {
      quantity: true,
    },
  })

  // Fetch category for each product
  const categoryProductIds = topCategories.map((c) => c.productId)
  const productsWithCategories = await prisma.product.findMany({
    where: { id: { in: categoryProductIds } },
    select: {
      id: true,
      categoryId: true,
    },
  })

  // Aggregate by category
  const categoryMap = new Map<number, number>()
  productsWithCategories.forEach((p) => {
    const orderItem = topCategories.find((oi) => oi.productId === p.id)
    if (orderItem) {
      const current = categoryMap.get(p.categoryId) ?? 0
      categoryMap.set(p.categoryId, current + (orderItem._sum.quantity ?? 0))
    }
  })

  // Get top 5 categories
  const topCategoryEntries = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const categoryIds = topCategoryEntries.map((e) => e[0])
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  })

  const topCategoriesData = topCategoryEntries.map(([categoryId, totalQuantity]) => {
    const category = categories.find((c) => c.id === categoryId)
    return {
      category: category ?? null,
      totalQuantity,
    }
  })

  return {
    month: selectedMonth,
    year: selectedYear,
    totalRevenue,
    completedOrders,
    customers: customers.length,
    revenueTrend,
    topProducts: topProductsData,
    topCategories: topCategoriesData,
  }
}

const dashboardService = {
  getDashboardData,
  getTodaySummary,
  getOrdersChart,
  getRecentOrders,
  getReport,
}

export default dashboardService
