import { prisma } from "../lib/prisma.js"
import {
  sendNotification,
  registerToken as firebaseRegisterToken,
  removeToken as firebaseRemoveToken,
  getTokensByUserId,
  cleanupInvalidTokens,
  type SendResult,
} from "../lib/firebase.js"
import { EnumOrderStatus, EnumRole } from "../../generated/prisma/client.js"

// Notification message templates
const notificationTemplates = {
  NEW_ORDER: (invoiceNumber: string, username: string) =>
    `Order baru ${invoiceNumber} dari ${username}`,
  PAYMENT_SUCCESS: (invoiceNumber: string) =>
    `Pembayaran pesanan ${invoiceNumber} berhasil`,
  STATUS_PROCESSING: (invoiceNumber: string) =>
    `Pesanan ${invoiceNumber} sedang diproses`,
  STATUS_DELIVERED: (invoiceNumber: string, resi?: string) =>
    `Pesanan ${invoiceNumber} sedang dikirim${resi ? ` (No. Resi: ${resi})` : ""}`,
  STATUS_COMPLETED: (invoiceNumber: string) =>
    `Pesanan ${invoiceNumber} telah selesai`,
  STATUS_CANCELLED: (invoiceNumber: string) =>
    `Pesanan ${invoiceNumber} dibatalkan`,
}

type NotificationType =
  | "NEW_ORDER"
  | "PAYMENT_SUCCESS"
  | "STATUS_PROCESSING"
  | "STATUS_DELIVERED"
  | "STATUS_COMPLETED"
  | "STATUS_CANCELLED"

const registerToken = async (
  userId: string,
  token: string,
  deviceInfo?: string,
) => {
  await firebaseRegisterToken(userId, token, deviceInfo)
  return { message: "Token registered successfully" }
}

const removeToken = async (token: string) => {
  await firebaseRemoveToken(token)
  return { message: "Token removed successfully" }
}

const sendToUser = async (
  userId: string,
  notification: { title: string; body: string },
): Promise<SendResult> => {
  const tokens = await getTokensByUserId(userId)

  if (tokens.length === 0) {
    return { success: [], failed: [] }
  }

  const result = await sendNotification(tokens, notification)

  // Auto-cleanup invalid tokens from Firestore
  if (result.failed.length > 0) {
    await cleanupInvalidTokens(result.failed)
  }

  return result
}

const sendToAdmins = async (
  notification: { title: string; body: string },
): Promise<SendResult> => {
  // Get all admin users from local database
  const adminUsers = await prisma.user.findMany({
    where: { role: EnumRole.ADMIN },
    select: { id: true },
  })

  if (adminUsers.length === 0) {
    return { success: [], failed: [] }
  }

  // Get FCM tokens for all admin users from Firestore
  const adminTokens: string[] = []
  for (const admin of adminUsers) {
    const tokens = await getTokensByUserId(admin.id)
    adminTokens.push(...tokens)
  }

  if (adminTokens.length === 0) {
    return { success: [], failed: [] }
  }

  const result = await sendNotification(adminTokens, notification)

  // Auto-cleanup invalid tokens from Firestore
  if (result.failed.length > 0) {
    await cleanupInvalidTokens(result.failed)
  }

  return result
}

const sendOrderNotification = async (
  order: {
    userId: string
    invoiceNumber: string
    user: { username: string }
    status: EnumOrderStatus
    shippingNumber?: string | null
  },
  type: NotificationType,
) => {
  let title = "Update Pesanan"
  let body = ""

  switch (type) {
    case "NEW_ORDER":
      title = "Order Baru"
      body = notificationTemplates.NEW_ORDER(
        order.invoiceNumber,
        order.user.username,
      )
      // Send to all admins
      await sendToAdmins({ title, body })
      break

    case "PAYMENT_SUCCESS":
      title = "Pembayaran Berhasil"
      body = notificationTemplates.PAYMENT_SUCCESS(order.invoiceNumber)
      // Send to user
      await sendToUser(order.userId, { title, body })
      break

    case "STATUS_PROCESSING":
      title = "Pesanan Diproses"
      body = notificationTemplates.STATUS_PROCESSING(order.invoiceNumber)
      // Send to user
      await sendToUser(order.userId, { title, body })
      break

    case "STATUS_DELIVERED":
      title = "Pesanan Dikirim"
      body = notificationTemplates.STATUS_DELIVERED(
        order.invoiceNumber,
        order.shippingNumber || undefined,
      )
      // Send to user
      await sendToUser(order.userId, { title, body })
      break

    case "STATUS_COMPLETED":
      title = "Pesanan Selesai"
      body = notificationTemplates.STATUS_COMPLETED(order.invoiceNumber)
      // Send to user
      await sendToUser(order.userId, { title, body })
      break

    case "STATUS_CANCELLED":
      title = "Pesanan Dibatalkan"
      body = notificationTemplates.STATUS_CANCELLED(order.invoiceNumber)
      // Send to user
      await sendToUser(order.userId, { title, body })
      break
  }
}

const notificationService = {
  registerToken,
  removeToken,
  sendToUser,
  sendToAdmins,
  sendOrderNotification,
}

export default notificationService
