import type { ProductTypes } from "@medusajs/framework/types"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

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

const toMajorUnits = (amount: any) => {
  const value = Number(amount ?? 0)
  if (!Number.isFinite(value)) {
    return 0
  }
  return Number((value / 100).toFixed(2))
}

const parseFilters = (query: Record<string, any>) => {
  const filters: Record<string, string> = {}

  for (const [key, value] of Object.entries(query)) {
    const match = key.match(
      /searchCriteria\[filter_groups\]\[(\d+)\]\[filters\]\[(\d+)\]\[field\]/
    )
    if (match) {
      const prefix = `searchCriteria[filter_groups][${match[1]}][filters][${match[2]}]`
      const fieldName = String(value)
      const filterValue = query[`${prefix}[value]`]
      if (fieldName && filterValue !== undefined) {
        filters[fieldName] = Array.isArray(filterValue)
          ? filterValue[0]
          : String(filterValue)
      }
    }
  }

  return filters
}

const parsePagination = (query: Record<string, any>) => {
  const pageSizeKey = Object.keys(query).find((key) =>
    key.endsWith("[pageSize]")
  )
  const currentPageKey = Object.keys(query).find((key) =>
    key.endsWith("[currentPage]")
  )

  const take = Number(
    pageSizeKey ? query[pageSizeKey] : query.pageSize ?? query.page_size
  )
  const page =
    Number(
      currentPageKey
        ? query[currentPageKey]
        : query.currentPage ?? query.current_page
    ) || 1

  return {
    skip: take && Number.isFinite(take) ? (page - 1) * take : 0,
    take: take && Number.isFinite(take) ? take : 20,
  }
}

const formatProduct = (product: any) => {
  const variant = product.variants?.[0] ?? {}
  const prices = variant.prices ?? []
  const priceAmount = prices.length ? prices[0].amount : 0
  const categories = product.categories ?? []
  const metadata = product.metadata ?? {}

  return {
    id: product.id,
    sku: variant.sku ?? product.handle ?? product.id,
    name: product.title,
    status: product.status ?? 1,
    visibility: 4,
    price: toMajorUnits(priceAmount),
    type_id: variant.options?.length ? "configurable" : "simple",
    custom_attributes: [
      {
        attribute_code: "small_image",
        value: product.thumbnail ?? "",
      },
      {
        attribute_code: "image",
        value: product.images?.[0]?.url ?? product.thumbnail ?? "",
      },
    ],
    extension_attributes: {
      stock_item: {
        qty: variant.inventory_quantity ?? metadata.inventory ?? 0,
      },
      product_category: categories[0]?.id ?? null,
      category_links: categories.map((category: any) => ({
        category_id: category.id,
        position: 0,
      })),
      on_home: metadata.on_home ?? 0,
    },
  }
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)
  res.status(204).send()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  setCors(req, res)

  let productModule: ProductTypes.IProductModuleService | null = null
  let legacyProductService: any | null = null

  try {
    productModule = req.scope.resolve(
      "product"
    ) as ProductTypes.IProductModuleService
  } catch {
    productModule = null
  }

  if (!productModule) {
    try {
      legacyProductService = req.scope.resolve("productService")
    } catch {
      legacyProductService = null
    }
  }

  if (!productModule && !legacyProductService) {
    return res.status(500).json({
      message: "Product module/service is not available.",
    })
  }
  const { skip, take } = parsePagination(req.query)
  const filters = parseFilters(req.query)

  const selector: ProductTypes.FilterableProductProps = {}

  let products: any[] = []
  let count = 0

  if (productModule) {
    ;[products, count] = await productModule.listAndCountProducts(selector, {
      relations: ["variants", "variants.prices", "categories"],
      skip,
      take,
    })
  } else if (legacyProductService) {
    ;[products, count] = await legacyProductService.listAndCount(selector, {
      relations: ["variants", "variants.prices", "categories"],
      skip,
      take,
    })
  }

  let items = products

  if (filters.category_id) {
    items = items.filter((product: any) =>
      (product.categories || []).some(
        (category: any) => category.id === filters.category_id
      )
    )
  }

  if (filters.on_home) {
    items = items.filter(
      (product: any) =>
        String(product.metadata?.on_home ?? "") === String(filters.on_home)
    )
  }

  return res.json({
    items: items.map(formatProduct),
    total_count: count,
  })
}
