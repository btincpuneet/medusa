import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  createProductEnquiry,
  listProductEnquiries,
  ProductEnquiryInput,
} from "../../../../../lib/pg"

const parseOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const [entries, count] = await listProductEnquiries(
    {
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      email: typeof req.query.email === "string" ? req.query.email : undefined,
      sku: typeof req.query.sku === "string" ? req.query.sku : undefined,
      product_id: parseOptionalNumber(req.query.product_id),
      access_id: parseOptionalNumber(req.query.access_id),
      user_id: parseOptionalNumber(req.query.user_id),
    },
    {
      limit: parseOptionalNumber(req.query.limit),
      offset: parseOptionalNumber(req.query.offset),
    }
  )

  return res.json({
    items: entries,
    total_count: count,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
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
    status: body.status ?? "new",
  })

  return res.status(201).json(enquiry)
}
