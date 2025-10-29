import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  ensureRedingtonTermsConditionsTable,
  ensureRedingtonCurrencyMappingTable,
  findAccessMappingByAccessId,
  findDomainById,
  getPgPool,
  searchTermsConditions,
  TermsConditionsRow,
} from "../../../../../../lib/pg"

type SearchCriteriaFilter = {
  field?: string
  value?: unknown
  condition_type?: string
}

type SearchCriteria = {
  filter_groups?: Array<{
    filters?: SearchCriteriaFilter[]
  }>
}

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
  res.header("Access-Control-Allow-Methods", "POST,OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

const normalizeValue = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const collectFilters = (criteria: SearchCriteria | undefined) => {
  const result: Record<string, string | null> = {}

  const groups = criteria?.filter_groups ?? []
  for (const group of groups) {
    const filters = group.filters ?? []
    for (const filter of filters) {
      const field = (filter.field || "").toString().toLowerCase()
      const value = normalizeValue(
        typeof filter.value === "string"
          ? filter.value.replace(/%/g, "")
          : filter.value
      )
      if (!field || value === null) {
        continue
      }

      if (
        ["country", "country_id"].includes(field) &&
        !result.country
      ) {
        result.country = value
      } else if (
        ["domain", "domain_id"].includes(field) &&
        !result.domain
      ) {
        result.domain = value
      } else if (field === "status" && !result.status) {
        result.status = value
      }
    }
  }

  return result
}

const normalizeStatus = (value: string | null | undefined): string | null => {
  if (!value) {
    return null
  }
  return value.trim().toLowerCase()
}

const toResponse = async (
  rows: TermsConditionsRow[]
): Promise<
  Array<{
    id: number
    country_id: string | null
    country_name: string | null
    domain_id: number | null
    domain_name: string | null
    page: string | null
    uploadpdf: string | null
  }>
> => {
  await ensureRedingtonCurrencyMappingTable()

  const pool = getPgPool()

  const getCountryName = async (code: string | null) => {
    if (!code) {
      return null
    }

    const { rows } = await pool.query(
      `
        SELECT country_name
        FROM redington_currency_mapping
        WHERE country_code = $1
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [code]
    )

    const name = rows[0]?.country_name
    return typeof name === "string" && name.length ? name : code
  }

  const getDomainName = async (id: number | null) => {
    if (id === null) {
      return null
    }
    const domain = await findDomainById(id)
    return domain?.domain_name ?? null
  }

  const promises = rows.map(async (row) => {
    const countryCode = row.country
    const domainId =
      row.domain !== null && row.domain !== undefined
        ? Number(row.domain)
        : null

    const [countryName, domainName] = await Promise.all([
      getCountryName(countryCode),
      getDomainName(Number.isFinite(domainId as number) ? (domainId as number) : null),
    ])

    return {
      id: row.id,
      country_id: countryCode,
      country_name: countryName,
      domain_id: Number.isFinite(domainId as number) ? (domainId as number) : null,
      domain_name: domainName,
      page: row.termsandcondition,
      uploadpdf: row.uploadpdf,
    }
  })

  return Promise.all(promises)
}

const DEFAULT_MESSAGE_SUCCESS = "Data retrieved successfully"
const DEFAULT_MESSAGE_FAILED = "Data not found"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  await ensureRedingtonTermsConditionsTable()

  const body = (req.body || {}) as {
    accessId?: string
    access_id?: string
    searchCriteria?: SearchCriteria
  }

  const accessId = normalizeValue(body.accessId ?? body.access_id ?? null)

  let countryFilter: string | null = null
  let domainFilter: string | null = null

  if (accessId) {
    const accessMapping = await findAccessMappingByAccessId(accessId).catch(() => null)
    if (accessMapping?.country_code) {
      countryFilter = accessMapping.country_code
    }
    if (Number.isFinite(accessMapping?.domain_id)) {
      domainFilter = String(accessMapping?.domain_id)
    }
  }

  const criteriaFilters = collectFilters(body.searchCriteria)
  if (criteriaFilters.country) {
    countryFilter = criteriaFilters.country
  }
  if (criteriaFilters.domain) {
    domainFilter = criteriaFilters.domain
  }

  const statusFilter = normalizeStatus(criteriaFilters.status) ?? "yes"

  const rows = await searchTermsConditions({
    country: countryFilter ?? undefined,
    domain: domainFilter ?? undefined,
    status: statusFilter ?? undefined,
  })

  const activeRows = statusFilter
    ? rows.filter(
        (row) =>
          normalizeStatus(row.status) === normalizeStatus(statusFilter)
      )
    : rows

  const payload = await toResponse(activeRows)

  if (!payload.length) {
    return res.json([
      {
        status: "failed",
        message: DEFAULT_MESSAGE_FAILED,
        data: [],
      },
    ])
  }

  return res.json([
    {
      status: "success",
      message: DEFAULT_MESSAGE_SUCCESS,
      data: payload,
    },
  ])
}
