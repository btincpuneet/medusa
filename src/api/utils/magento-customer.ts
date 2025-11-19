import axios, { AxiosInstance } from "axios"

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL || ""
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN || ""

const createMagentoAdminClient = (): AxiosInstance | null => {
  if (!MAGENTO_REST_BASE_URL || !MAGENTO_ADMIN_TOKEN) {
    return null
  }

  const normalizedBase = MAGENTO_REST_BASE_URL.replace(/\/$/, "")

  return axios.create({
    baseURL: normalizedBase,
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
      "Content-Type": "application/json",
    },
    validateStatus: () => true,
  })
}

export const fetchMagentoCustomerByEmail = async (email: string) => {
  const client = createMagentoAdminClient()
  if (!client) {
    return null
  }

  try {
    const response = await client.get("customers/search", {
      params: {
        "searchCriteria[filter_groups][0][filters][0][field]": "email",
        "searchCriteria[filter_groups][0][filters][0][value]": email,
        "searchCriteria[filter_groups][0][filters][0][condition_type]": "eq",
      },
    })

    if (response.status >= 200 && response.status < 300) {
      const items = Array.isArray(response.data?.items)
        ? response.data.items
        : []
      return items[0] ?? null
    }
  } catch (error) {
    console.warn("Failed to fetch Magento customer by email.", error)
  }

  return null
}

type MagentoCustomerMinimal = {
  id?: number
  email?: string
  firstname?: string
  lastname?: string
  website_id?: number
}

export const updateMagentoCustomerPassword = async (
  email: string,
  password: string,
  existing?: MagentoCustomerMinimal | null
) => {
  const client = createMagentoAdminClient()
  if (!client) {
    return false
  }

  let customer = existing ?? null

  if (!customer?.id) {
    customer = (await fetchMagentoCustomerByEmail(email)) ?? null
  }

  if (!customer?.id) {
    console.warn(
      `Unable to locate Magento customer for ${email}; password sync skipped.`
    )
    return false
  }

  const payload = {
    customer: {
      id: customer.id,
      email: customer.email ?? email,
      firstname: customer.firstname ?? "",
      lastname: customer.lastname ?? "",
      website_id: customer.website_id ?? 1,
    },
    password,
  }

  try {
    const response = await client.put(`customers/${customer.id}`, payload)
    if (response.status >= 200 && response.status < 300) {
      return true
    }

    console.warn(
      `Magento password update failed for ${email}:`,
      response.status,
      response.data
    )
  } catch (error) {
    console.warn("Magento password update threw an error.", error)
  }

  return false
}
