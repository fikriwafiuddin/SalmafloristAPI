const rajaongkirApiKey = process.env.RAJAONGKIR_API_KEY || ""
const rajaongkirBaseUrl = process.env.RAJAONGKIR_BASE_URL || ""
const origin = process.env.ORIGIN || ""

const config = {
  rajaongkirApiKey,
  rajaongkirBaseUrl,
  origin,
}

export default config
