import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  createProductEnquiry,
  ensureRedingtonProductEnquiryTable,
  listProductEnquiries,
  ProductEnquiryInput,
} from "../../../../lib/pg"

type ListQuery = {
  status?: string
  email?: string
  sku?: string
  product_id?: string
  access_id?: string
  user_id?: string
  limit?: string
  offset?: string
}

const parseOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonProductEnquiryTable()

  const query = (req.query || {}) as ListQuery

  const [enquiries, count] = await listProductEnquiries(
    {
      status: query.status?.trim() || undefined,
      email: query.email?.trim() || undefined,
      sku: query.sku?.trim() || undefined,
      product_id: parseOptionalNumber(query.product_id),
      access_id: parseOptionalNumber(query.access_id),
      user_id: parseOptionalNumber(query.user_id),
    },
    {
      limit: parseOptionalNumber(query.limit),
      offset: parseOptionalNumber(query.offset),
    }
  )

  return res.json({
    product_enquiries: enquiries,
    count,
    limit: parseOptionalNumber(query.limit),
    offset: parseOptionalNumber(query.offset) ?? 0,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonProductEnquiryTable()

  const body = (req.body || {}) as ProductEnquiryInput

  const enquiry = await createProductEnquiry({
    user_id: body.user_id ?? null,
    access_id: body.access_id ?? null,
    domain_id: body.domain_id ?? null,
    company_code: body.company_code ?? null,
    product_id: body.product_id ?? null,
    fullname: body.fullname ?? null,
    email: body.email ?? null,
    product_name: body.product_name ?? null,
    domain_name: body.domain_name ?? null,
    country_name: body.country_name ?? null,
    sku: body.sku ?? null,
    price: body.price ?? null,
    comments: body.comments ?? null,
    status: body.status ?? null,
  })

  return res.status(201).json({
    product_enquiry: enquiry,
  })
}
