import { ErrorResponse } from "../utils/response.js"
import config from "../config/index.js"

const getProvinces = async () => {
  const response = await fetch(
    `${config.rajaongkirBaseUrl}/destination/province`,
    {
      headers: {
        key: config.rajaongkirApiKey,
      },
    },
  )

  const decodedData = await response.json()

  if (!response.ok) {
    throw new ErrorResponse(
      decodedData?.data || "Failed to fetch provinces from RajaOngkir",
      response.status,
    )
  }

  return decodedData.data
}

const getCities = async (provinceId: string) => {
  const url = `${config.rajaongkirBaseUrl}/destination/city/${provinceId}`

  const response = await fetch(url, {
    headers: {
      key: config.rajaongkirApiKey,
    },
  })

  const decodedData = await response.json()

  if (!response.ok) {
    throw new ErrorResponse(
      decodedData?.data || "Failed to fetch cities from RajaOngkir",
      response.status,
    )
  }

  return decodedData.data
}

const getDistricts = async (cityId: string) => {
  const url = `${config.rajaongkirBaseUrl}/destination/district/${cityId}`

  const response = await fetch(url, {
    headers: {
      key: config.rajaongkirApiKey,
    },
  })

  const decodedData = await response.json()

  if (!response.ok) {
    throw new ErrorResponse(
      decodedData?.data || "Failed to fetch districts from RajaOngkir",
      response.status,
    )
  }

  return decodedData.data
}

const getCosts = async (destination: string, weight: number) => {
  const url = `${config.rajaongkirBaseUrl}/calculate/district/domestic-cost`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      key: config.rajaongkirApiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      origin: config.origin,
      destination: destination,
      weight: weight.toString(),
      courier:
        "jne:sicepat:ide:sap:jnt:ninja:tiki:lion:anteraja:pos:ncs:rex:rpx:sentral:star:wahana:dse",
    }).toString(),
  })

  const decodedData = await response.json()

  if (!response.ok) {
    throw new ErrorResponse(
      decodedData?.data || "Failed to fetch shipping costs from RajaOngkir",
      response.status,
    )
  }

  return decodedData.data
}

const destinationService = { getProvinces, getCities, getDistricts, getCosts }
export default destinationService
