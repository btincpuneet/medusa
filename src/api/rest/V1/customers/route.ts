import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import type { AwilixContainer } from "awilix"

type MagentoCustomAttribute = {
  attribute_code: string
  value: unknown
}

type MagentoCustomer = {
  email?: string
  firstname?: string
  lastname?: string
  middlename?: string
  prefix?: string
  suffix?: string
  store_id?: number
  website_id?: number
  custom_attributes?: MagentoCustomAttribute[]
  addresses?: any[]
  [key: string]: any
}

type MagentoCustomerCreateBody = {
  customer?: MagentoCustomer
  password?: string
}

const mapCustomAttributes = (
  attributes: MagentoCustomAttribute[] | undefined
) => {
  if (!Array.isArray(attributes)) {
    return {}
  }

  return attributes.reduce<Record<string, unknown>>((acc, attr) => {
    if (attr?.attribute_code) {
      acc[attr.attribute_code] = attr.value
    }
    return acc
  }, {})
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as MagentoCustomerCreateBody
  const payload = body.customer || {}

  const email = (payload.email || "").trim().toLowerCase()
  const password = (body.password || "").trim()

  if (!email) {
    return res.status(400).json({ message: "Email is required." })
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required." })
  }

  const firstName = payload.firstname || payload.first_name || ""
  const lastName = payload.lastname || payload.last_name || ""

  const scope: AwilixContainer = req.scope
  const customerService = scope.resolve("customerService")

  const customAttributesMap = mapCustomAttributes(payload.custom_attributes)

  try {
    const customer = await customerService.create({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      metadata: {
        magento_custom_attributes: customAttributesMap,
        magento_payload_snapshot: {
          store_id: payload.store_id ?? null,
          website_id: payload.website_id ?? null,
          prefix: payload.prefix ?? null,
          suffix: payload.suffix ?? null,
        },
      },
    })

    const response = {
      id: customer.id,
      group_id: payload.group_id ?? 0,
      default_billing: payload.default_billing ?? "0",
      default_shipping: payload.default_shipping ?? "0",
      confirmation: null,
      created_at: customer.created_at?.toISOString?.() ?? new Date().toISOString(),
      updated_at: customer.updated_at?.toISOString?.() ?? new Date().toISOString(),
      created_in: "Medusa",
      dob: null,
      email: customer.email,
      firstname: customer.first_name ?? firstName,
      lastname: customer.last_name ?? lastName,
      middlename: payload.middlename ?? null,
      prefix: payload.prefix ?? null,
      suffix: payload.suffix ?? null,
      gender: payload.gender ?? 0,
      store_id: payload.store_id ?? 1,
      website_id: payload.website_id ?? 1,
      addresses: payload.addresses ?? [],
      disable_auto_group_change: payload.disable_auto_group_change ?? 0,
      extension_attributes: payload.extension_attributes ?? {},
      custom_attributes: payload.custom_attributes ?? [],
    }

    return res.status(200).json(response)
  } catch (error: any) {
    if (
      error instanceof MedusaError &&
      error.type === MedusaError.Types.DUPLICATE_ERROR
    ) {
      return res.status(400).json({
        message: "A customer with the same email already exists.",
      })
    }

    return res.status(500).json({
      message:
        error?.message ?? "Unexpected error while creating the customer.",
    })
  }
}
