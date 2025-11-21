export type ProductSummary = {
  id: string
  title: string
  handle: string | null
  status: string
  subtitle: string | null
  description: string | null
  thumbnail: string | null
  company_code: string | null
  distribution_channel: string | null
  variant_skus: string[]
  updated_at: string | Date
  created_at: string | Date
  metadata?: Record<string, unknown>
}

export type ProductListResponse = {
  products: ProductSummary[]
  count: number
  limit: number
  offset: number
}

export type ProductDetailResponse = {
  product?: ProductSummary
  metadata_changes?: {
    company_code: boolean
    distribution_channel: boolean
  }
  sap_sync?: {
    triggered: boolean
    results: Array<{
      sku: string
      status: "success" | "error"
      message?: string
    }>
  }
  message?: string
}

export type ProductFormPayload = {
  title: string
  handle?: string
  subtitle?: string
  description?: string
  status?: string
  thumbnail?: string | null
  company_code?: string | null
  distribution_channel?: string | null
  sku?: string | null
  price?: string | number | null
  weight?: string | number | null
  attribute_set?: string | null
  tax_class?: string | null
  visibility?: string | null
  categories?: Array<number | string>
  brand?: string | null
  country_of_manufacture?: string | null
  enable_rma?: boolean | null
  on_home?: boolean | null
  product_delivery_tag?: string | null
}

type ListParams = Partial<{
  q: string
  sku: string
  handle: string
  id: string
  limit: number
  offset: number
}>

const headers = {
  "Content-Type": "application/json",
}

const toQuery = (params: ListParams = {}) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }
    if (typeof value === "string" && value.trim() === "") {
      return
    }
    search.set(key, String(value))
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

const handleJson = async <T>(response: Response): Promise<T> => {
  const body = await response.json().catch(() => ({} as T))
  if (!response.ok) {
    const message =
      (body as { message?: string })?.message ||
      `Request failed with status ${response.status}`
    throw new Error(message)
  }
  return body as T
}

export const productApi = {
  async list(params?: ListParams): Promise<ProductListResponse> {
    const query = toQuery(params)
    const response = await fetch(`/admin/redington/product${query}`, {
      credentials: "include",
    })
    return handleJson<ProductListResponse>(response)
  },

  async retrieve(productId: string): Promise<ProductDetailResponse> {
    const response = await fetch(`/admin/redington/product/${productId}`, {
      credentials: "include",
    })
    return handleJson<ProductDetailResponse>(response)
  },

  async updateMetadata(
    productId: string,
    payload: { company_code?: string | null; distribution_channel?: string | null }
  ): Promise<ProductDetailResponse> {
    const response = await fetch(`/admin/redington/product/${productId}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify(payload),
    })
    return handleJson<ProductDetailResponse>(response)
  },

  async create(payload: ProductFormPayload): Promise<ProductSummary> {
    const response = await fetch("/admin/products", {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({
        title: payload.title,
        handle: payload.handle,
        subtitle: payload.subtitle,
        description: payload.description,
        status: payload.status,
        thumbnail: payload.thumbnail,
        metadata: {
          company_code: payload.company_code ?? undefined,
          distribution_channel: payload.distribution_channel ?? undefined,
          sku_input: payload.sku ?? undefined,
          price: payload.price ?? undefined,
          weight: payload.weight ?? undefined,
          attribute_set: payload.attribute_set ?? undefined,
          tax_class: payload.tax_class ?? undefined,
          visibility: payload.visibility ?? undefined,
          categories: payload.categories ?? undefined,
          brand: payload.brand ?? undefined,
          country_of_manufacture: payload.country_of_manufacture ?? undefined,
          enable_rma: payload.enable_rma ?? undefined,
          on_home: payload.on_home ?? undefined,
          product_delivery_tag: payload.product_delivery_tag ?? undefined,
        },
      }),
    })
    const body = await handleJson<{ product: ProductSummary }>(response)
    return body.product
  },

  async update(productId: string, payload: ProductFormPayload): Promise<ProductSummary> {
    const response = await fetch(`/admin/products/${productId}`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({
        title: payload.title,
        handle: payload.handle,
        subtitle: payload.subtitle,
        description: payload.description,
        status: payload.status,
        thumbnail: payload.thumbnail,
        metadata: {
          company_code: payload.company_code ?? undefined,
          distribution_channel: payload.distribution_channel ?? undefined,
          sku_input: payload.sku ?? undefined,
          price: payload.price ?? undefined,
          weight: payload.weight ?? undefined,
          attribute_set: payload.attribute_set ?? undefined,
          tax_class: payload.tax_class ?? undefined,
          visibility: payload.visibility ?? undefined,
          categories: payload.categories ?? undefined,
          brand: payload.brand ?? undefined,
          country_of_manufacture: payload.country_of_manufacture ?? undefined,
          enable_rma: payload.enable_rma ?? undefined,
          on_home: payload.on_home ?? undefined,
          product_delivery_tag: payload.product_delivery_tag ?? undefined,
        },
      }),
    })
    const body = await handleJson<{ product: ProductSummary }>(response)
    return body.product
  },

  async remove(productId: string): Promise<void> {
    const response = await fetch(`/admin/products/${productId}`, {
      method: "DELETE",
      credentials: "include",
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      const message =
        (body as { message?: string })?.message ||
        `Delete failed with status ${response.status}`
      throw new Error(message)
    }
  },
}

export type ProductListItem = ProductSummary
