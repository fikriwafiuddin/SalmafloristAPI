import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"

const renderSuccessPage = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.query

    let orderDetails = null

    if (order_id && typeof order_id === "string") {
      const order = await prisma.order.findFirst({
        where: { invoiceNumber: order_id },
        include: {
          orderItems: {
            include: { product: true },
          },
          address: true,
        },
      })
      orderDetails = order
    }

    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pembayaran Berhasil - Salmafloris</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="min-h-screen bg-gradient-to-br from-pink-50 to-green-50 flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
    <div class="bg-green-500 p-8 text-center">
      <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-green-500 text-4xl"></i>
      </div>
      <h1 class="text-2xl font-bold text-white">Pembayaran Berhasil!</h1>
      <p class="text-green-100 mt-2">Terima kasih telah berbelanja di Salmafloris</p>
    </div>

    <div class="p-6">
      ${orderDetails ? `
      <div class="bg-gray-50 rounded-lg p-4 mb-4">
        <h2 class="font-semibold text-gray-700 mb-2">Detail Pesanan</h2>
        <div class="text-sm text-gray-600 space-y-1">
          <p><span class="font-medium">No. Invoice:</span> ${orderDetails.invoiceNumber}</p>
          <p><span class="font-medium">Status:</span>
            <span class="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
              ${orderDetails.status}
            </span>
          </p>
          <p><span class="font-medium">Total Pembayaran:</span> Rp ${orderDetails.totalPayment.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div class="border-t pt-4 mb-4">
        <h3 class="font-medium text-gray-700 mb-2">Item Pesanan:</h3>
        <div class="text-sm text-gray-600 space-y-2 max-h-32 overflow-y-auto">
          ${orderDetails.orderItems.map(item => `
            <div class="flex justify-between">
              <span>${item.product.name} x${item.quantity}</span>
              <span>Rp ${(item.unitPrice * item.quantity).toLocaleString('id-ID')}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : `
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p class="text-sm text-blue-700">
          <i class="fas fa-info-circle mr-1"></i>
          Pesanan Anda sedang diproses. Kami akan menghubungi Anda melalui WhatsApp untuk konfirmasi pengiriman.
        </p>
      </div>
      `}

      <div class="space-y-3">
        <a href="/" class="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-3 rounded-lg font-medium transition">
          <i class="fas fa-shopping-bag mr-2"></i> Lanjut Belanja
        </a>
        <button onclick="window.close()" class="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-3 rounded-lg font-medium transition">
          <i class="fas fa-times mr-2"></i> Tutup Halaman
        </button>
      </div>
    </div>
  </div>
</body>
</html>
    `)
  } catch (error) {
    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Salmafloris</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
    <i class="fas fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
    <h1 class="text-xl font-bold text-gray-800">Terjadi Kesalahan</h1>
    <p class="text-gray-600 mt-2">Silakan hubungi customer service jika ada masalah dengan pesanan Anda.</p>
  </div>
</body>
</html>
    `)
  }
}

const renderErrorPage = async (req: Request, res: Response) => {
  const { order_id } = req.query

  res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pembayaran Gagal - Salmafloris</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
    <div class="bg-red-500 p-8 text-center">
      <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-times text-red-500 text-4xl"></i>
      </div>
      <h1 class="text-2xl font-bold text-white">Pembayaran Gagal</h1>
      <p class="text-red-100 mt-2">Maat, pembayaran Anda tidak dapat diproses</p>
    </div>

    <div class="p-6">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p class="text-sm text-red-700">
          <i class="fas fa-info-circle mr-2"></i>
          Pembayaran mungkin dibatalkan atau waktu habis. Pesanan Anda belum selesai.
        </p>
      </div>

      ${order_id ? `
      <div class="bg-gray-50 rounded-lg p-4 mb-4">
        <p class="text-sm text-gray-600">
          <span class="font-medium">No. Pesanan:</span> ${order_id}
        </p>
      </div>
      ` : ''}

      <div class="space-y-3">
        <a href="/cart" class="block w-full bg-red-500 hover:bg-red-600 text-white text-center py-3 rounded-lg font-medium transition">
          <i class="fas fa-redo mr-2"></i> Coba Lagi
        </a>
        <a href="/" class="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-3 rounded-lg font-medium transition">
          <i class="fas fa-home mr-2"></i> Kembali ke Beranda
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `)
}

const paymentController = {
  renderSuccessPage,
  renderErrorPage,
}

export default paymentController
