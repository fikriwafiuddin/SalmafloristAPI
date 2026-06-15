import { prisma } from "../lib/prisma"
import { EnumOrderStatus } from "../../generated/prisma/client"

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

const dashboardService = {
  getDashboardData,
  getTodaySummary,
  getOrdersChart,
  getRecentOrders,
}

export default dashboardService
