import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listDirectoryCountriesWithRegions } from "../../../../../lib/pg"

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

  const countries = await listDirectoryCountriesWithRegions()
  return res.json(countries.map(formatCountry))
}

