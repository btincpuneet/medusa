import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { findDirectoryCountryWithRegions } from "../../../../../../lib/pg"
import { createMagentoB2CClient } from "../../../../../../api/magentoClient"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL

const setCors = (req: MedusaRequest, res: MedusaResponse) => {
  const origin = req.headers.origin
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin)
    res.header("Vary", "Origin")
  } else {
    res.header("Access-Control-Allow-Origin", "*")
  }

  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Content-Type, Authorization"
  )
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

const formatRegion = (region: {
  region_id: number
  country_id: string
  code: string | null
  name: string | null
}) => ({
  id: String(region.region_id),
  code: region.code ?? String(region.region_id),
  name: region.name ?? region.code ?? String(region.region_id),
  country_id: region.country_id,
})

const formatCountry = (country: {
  country_id: string
  iso2_code: string | null
  iso3_code: string | null
  name: string | null
  regions: Array<{
    region_id: number
    country_id: string
    code: string | null
    name: string | null
  }>
}) => ({
  id: country.country_id,
  two_letter_abbreviation: country.iso2_code ?? country.country_id,
  three_letter_abbreviation: country.iso3_code ?? country.country_id,
  full_name_locale: country.name ?? country.country_id,
  full_name_english: country.name ?? country.country_id,
  available_regions: country.regions.map(formatRegion),
})

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const countryId = String(req.params?.countryId ?? req.params?.country_id ?? "")

  if (!countryId.length) {
    return res.status(400).json({
      message: "Country id is required",
    })
  }

  const country = await findDirectoryCountryWithRegions(countryId)
  if (country) {
    return res.json(formatCountry(country))
  }

  if (!MAGENTO_REST_BASE_URL) {
    return res.status(404).json({
      message: `Country ${countryId} not found`,
    })
  }

  try {
    const client = createMagentoB2CClient({
      baseUrl: MAGENTO_REST_BASE_URL,
    })

    const response = await client.request({
      url: `directory/countries/${encodeURIComponent(countryId)}`,
      method: "GET",
    })

    return res.status(response.status).json(response.data)
  } catch (error: any) {
    const status = error?.response?.status ?? 404
    const message =
      error?.response?.data?.message ||
      error?.message ||
      `Country ${countryId} not found`
    return res.status(status).json({ message })
  }
}
