const rajaongkirApiKey = process.env.RAJAONGKIR_API_KEY || ""
const rajaongkirBaseUrl = process.env.RAJAONGKIR_BASE_URL || ""
const origin = process.env.ORIGIN || ""
const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || ""
const midtransClientKey = process.env.MIDTRANS_CLIENT_KEY || ""
const midtransIsProduction = process.env.MIDTRANS_IS_PRODUCTION === "true"
const baseUrl = process.env.BASE_URL || "http://localhost:3000"

const config = {
  rajaongkirApiKey,
  rajaongkirBaseUrl,
  origin,
  midtransServerKey,
  midtransClientKey,
  midtransIsProduction,
  baseUrl,
}

export default config
