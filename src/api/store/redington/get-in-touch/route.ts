import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import {
  ensureRedingtonGetInTouchTable,
  getPgPool,
  mapGetInTouchRow,
  getRedingtonSetting,
} from "../../../../lib/pg"

type GetInTouchBody = {
  name?: string
  email?: string
  mobile_number?: string
  company_name?: string
  enquiry_type?: string
  enquiry_details?: string
}

const normalizeRequired = (value: unknown, field: string) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`"${field}" is required`)
  }
  return value.trim()
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await ensureRedingtonGetInTouchTable()

  const body = (req.body || {}) as GetInTouchBody

  let name: string
  let email: string
  let mobileNumber: string

  try {
    name = normalizeRequired(body.name, "name")
    email = normalizeRequired(body.email, "email")
    mobileNumber = normalizeRequired(body.mobile_number, "mobile_number")
  } catch (error: any) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    })
  }

  const { rows } = await getPgPool().query(
    `
      INSERT INTO redington_get_in_touch (
        name,
        email,
        mobile_number,
        company_name,
        enquiry_type,
        enquiry_details
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      name,
      email,
      mobileNumber,
      body.company_name ?? null,
      body.enquiry_type ?? null,
      body.enquiry_details ?? null,
    ]
  )

  const record = mapGetInTouchRow(rows[0])

  await dispatchNotifications(req, {
    ...record,
    enquiry_type: record.enquiry_type ?? undefined,
    enquiry_details: record.enquiry_details ?? undefined,
  })

  return res.status(201).json({
    enquiry: record,
  })
}

async function dispatchNotifications(
  req: MedusaRequest,
  payload: {
    id: number
    name: string
    email: string
    mobile_number: string
    company_name?: string | null
    enquiry_type?: string | null
    enquiry_details?: string | null
  }
) {
  let recipients: string[] = []

  try {
    const configured =
      (await getRedingtonSetting<{ recipients?: string[] | string }>(
        "get_in_touch.email_recipients"
      )) ?? {}

    if (Array.isArray(configured.recipients)) {
      recipients = configured.recipients.filter((entry) => !!entry)
    } else if (typeof configured.recipients === "string") {
      recipients = configured.recipients
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    }
  } catch (error) {
    // ignore – we'll fall back to env/config below
  }

  if (!recipients.length && process.env.GET_IN_TOUCH_RECIPIENTS) {
    recipients = process.env.GET_IN_TOUCH_RECIPIENTS.split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  if (!recipients.length) {
    return
  }

  let notificationModule: any = null

  try {
    notificationModule = req.scope.resolve(Modules.NOTIFICATION)
  } catch (_) {
    // notification module not registered
  }

  if (!notificationModule?.createNotifications) {
    logWarning(req, "Notification module is not configured; skipping email send.")
    return
  }

  try {
    await notificationModule.createNotifications(
      recipients.map((recipient) => ({
        to: recipient,
        channel: "email",
        template: "redington-get-in-touch",
        trigger_type: "redington.get_in_touch",
        resource_type: "get_in_touch",
        resource_id: String(payload.id),
        data: {
          name: payload.name,
          email: payload.email,
          mobile_number: payload.mobile_number,
          company_name: payload.company_name,
          enquiry_type: payload.enquiry_type,
          enquiry_details: payload.enquiry_details,
        },
      }))
    )
  } catch (error) {
    logWarning(
      req,
      `Failed to dispatch Get-In-Touch notifications: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

function logWarning(req: MedusaRequest, message: string) {
  try {
    const logger = req.scope.resolve(
      ContainerRegistrationKeys.LOGGER
    ) as { warn?: (...args: unknown[]) => void }
    logger?.warn?.(message)
  } catch (_) {
    // ignore logging errors
  }
}
