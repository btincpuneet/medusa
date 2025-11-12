import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import createSapClient from "../../../../modules/sap-client"
import { redingtonConfig } from "../../../../modules/redington-config"
import {
  ensureRedingtonAddBccTable,
  ensureRedingtonAccessMappingTable,
  getPgPool,
  mapAddBccRow,
  recordInvoiceAudit,
} from "../../../../lib/pg"

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

type InvoiceRequestBody = {
  sales_order?: string
  company_code?: string
  order_id?: string
  invoice_number?: string
  invoice_date?: string
  domain_id?: number | string
  access_id?: number | string
}

const extractInvoiceEntry = (
  salesOrder: string,
  payload: any
): { invoiceNo?: string; invoiceDate?: string } | null => {
  if (!payload) {
    return null
  }

  const invoices =
    Array.isArray(payload.Invoices) && payload.Invoices.length
      ? payload.Invoices
      : Array.isArray(payload[0])
        ? payload[0]
        : []

  const matcher = (entry: any) => {
    const soNumber =
      entry?.Sonumber ??
      entry?.SoNumber ??
      entry?.salesOrder ??
      entry?.SalesOrder ??
      entry?.OrderNo
    if (!soNumber) {
      return false
    }
    return String(soNumber).trim().toLowerCase() === salesOrder.toLowerCase()
  }

  const record =
    invoices.find(matcher) ??
    (Array.isArray(invoices) && invoices.length ? invoices[0] : null)

  if (!record) {
    return null
  }

  return {
    invoiceNo:
      record.Invoiceno ??
      record.InvoiceNo ??
      record.invoiceNo ??
      record.invoice_number ??
      record.InvoiceNumber,
    invoiceDate:
      record.Invoicedate ??
      record.InvoiceDate ??
      record.invoiceDate ??
      record.invoice_date,
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  const body = (req.body || {}) as InvoiceRequestBody
  const salesOrder = (body.sales_order || "").trim()
  let companyCode =
    (body.company_code || "").trim() ||
    redingtonConfig.sap.customerNumber ||
    ""

  if (!salesOrder) {
    await recordInvoiceAudit({
      order_id: body.order_id ?? null,
      success: false,
      message: "sales_order is required",
      payload: { body },
    })

    return res.status(400).json({
      success: false,
      message: "sales_order is required",
    })
  }

  const sapClient = createSapClient()

  let invoiceNumber = body.invoice_number?.trim()
  let invoiceDate = body.invoice_date?.trim()
  let sapInvoicePayload: any = null
  let sapPdfPayload: any = null

  const domainId = await resolveDomainId(body)
  let bccEmails: string[] = []

  try {
    bccEmails = await loadBccEmails(domainId)
    if (!invoiceNumber || !invoiceDate) {
      const invoiceResponse = await sapClient.fetchInvoice({
        salesOrder,
        companyCode,
      })
      sapInvoicePayload = invoiceResponse.data

      const extracted = extractInvoiceEntry(salesOrder, invoiceResponse.data)
      if (extracted) {
        invoiceNumber = invoiceNumber || extracted.invoiceNo || ""
        invoiceDate = invoiceDate || extracted.invoiceDate || ""
      }
    }

    if (!invoiceNumber || !invoiceDate) {
      throw new Error("Invoice number or invoice date not found in SAP response.")
    }

    const pdfResponse = await sapClient.fetchInvoicePdf(
      invoiceNumber,
      invoiceDate,
      companyCode
    )
    sapPdfPayload = pdfResponse.data

    const pdfContent =
      pdfResponse.data?.Content ??
      pdfResponse.data?.content ??
      pdfResponse.data?.PDF ??
      pdfResponse.data?.pdf ??
      pdfResponse.data

    await recordInvoiceAudit({
      order_id: body.order_id ?? salesOrder,
      invoice_number: invoiceNumber,
      company_code: companyCode,
      success: true,
      message: "Invoice retrieved successfully.",
      payload: {
        invoice_lookup: sapInvoicePayload,
        pdf_lookup: Array.isArray(pdfContent) ? undefined : { meta: "omitted" },
        bcc: bccEmails,
      },
    })

    return res.json({
      success: true,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      pdf: pdfContent,
      bcc: bccEmails,
    })
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to retrieve invoice."

    await recordInvoiceAudit({
      order_id: body.order_id ?? salesOrder,
      invoice_number: invoiceNumber ?? null,
      company_code: companyCode || null,
      success: false,
      message,
      payload: {
        invoice_lookup: sapInvoicePayload,
        pdf_lookup: sapPdfPayload,
        bcc: bccEmails,
        error: error?.response?.data ?? { message },
      },
    })

    const status =
      error?.response?.status && Number.isInteger(error.response.status)
        ? error.response.status
        : 502

    return res.status(status).json({
      success: false,
      message,
      bcc: bccEmails,
    })
  }
}
const parseNumeric = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  const parsed = Number.parseInt(String(value).trim(), 10)
  return Number.isFinite(parsed) ? parsed : null
}

const resolveDomainId = async (
  body: InvoiceRequestBody
): Promise<number | null> => {
  const explicit = parseNumeric(body.domain_id ?? null)
  if (explicit) {
    return explicit
  }

  const rawAccessId = body.access_id ?? null
  const accessId =
    rawAccessId === null || rawAccessId === undefined
      ? ""
      : String(rawAccessId).trim()

  if (!accessId) {
    return null
  }

  await ensureRedingtonAccessMappingTable()

  const { rows } = await getPgPool().query(
    `
      SELECT domain_id
      FROM redington_access_mapping
      WHERE access_id = $1
      LIMIT 1
    `,
    [accessId]
  )

  const domainId = rows[0]?.domain_id
  return Number.isFinite(domainId) ? Number(domainId) : null
}

const loadBccEmails = async (domainId: number | null): Promise<string[]> => {
  if (!domainId) {
    return []
  }

  await ensureRedingtonAddBccTable()

  const { rows } = await getPgPool().query(
    `
      SELECT *
      FROM redington_add_bcc
      WHERE domain_id = $1
      LIMIT 1
    `,
    [domainId]
  )

  if (!rows[0]) {
    return []
  }

  return mapAddBccRow(rows[0]).bcc_emails
}
