import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { sendErrorResponse } from "../utils/respond"

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return null
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  const trimmed = String(value).trim()
  return trimmed.length ? trimmed : null
}

type ManagerWithQuery = {
  query: (sql: string, parameters?: any[]) => Promise<any[]>
}

type SliderRow = {
  slider_id: number
  name: string
  status: number | null
  location: string
  store_ids: string | null
  customer_group_ids: string | null
  priority: number | null
  effect: string | null
  auto_width: boolean | null
  auto_height: boolean | null
  design: number | null
  loop: boolean | null
  lazy_load: boolean | null
  autoplay: boolean | null
  autoplay_timeout: number | null
  nav: boolean | null
  dots: boolean | null
  is_responsive: boolean | null
  responsive_items: string | null
  from_date: string | Date | null
  to_date: string | Date | null
}

type BannerRow = {
  banner_id: number
  slider_id: number
  name: string
  status: number | null
  type: number | null
  content: string | null
  image_url: string
  url_banner: string | null
  title: string | null
  newtab: number | null
}

const serializeBanner = (banner: BannerRow) => ({
  banner_id: banner.banner_id,
  name: banner.name,
  status: banner.status ?? 0,
  type: banner.type ?? 0,
  content: banner.content ?? null,
  image_url: banner.image_url,
  url_banner: banner.url_banner ?? null,
  title: banner.title ?? null,
  newtab: banner.newtab ?? 0,
})

const serializeSlider = (slider: SliderRow, banners: BannerRow[]) => ({
  slider_id: slider.slider_id,
  name: slider.name,
  status: slider.status ?? 0,
  location: slider.location,
  store_ids: slider.store_ids ?? "",
  customer_group_ids: slider.customer_group_ids ?? "",
  priority: slider.priority ?? 0,
  effect: slider.effect ?? "slider",
  auto_width: slider.auto_width ?? null,
  auto_height: slider.auto_height ?? null,
  design: slider.design ?? 0,
  loop: slider.loop ?? null,
  lazy_load: slider.lazy_load ?? null,
  autoplay: slider.autoplay ?? null,
  autoplay_timeout: slider.autoplay_timeout ?? 0,
  nav: slider.nav ?? null,
  dots: slider.dots ?? null,
  is_responsive: slider.is_responsive ?? null,
  responsive_items: slider.responsive_items ?? "[]",
  from_date: formatDate(slider.from_date),
  to_date: formatDate(slider.to_date),
  banners: banners.map(serializeBanner),
})

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const manager = req.scope.resolve("manager") as ManagerWithQuery
    const sliders = (await manager.query(
      `SELECT slider_id,
              name,
              status,
              location,
              store_ids,
              customer_group_ids,
              priority,
              effect,
              auto_width,
              auto_height,
              design,
              loop,
              lazy_load,
              autoplay,
              autoplay_timeout,
              nav,
              dots,
              is_responsive,
              responsive_items,
              from_date,
              to_date
         FROM redington_banner_slider
         ORDER BY priority ASC, slider_id ASC`
    )) as SliderRow[]

    if (!sliders.length) {
      return res.json([])
    }

    const sliderIdSet = new Set(sliders.map((slider) => slider.slider_id))
    const banners = (await manager.query(
      `SELECT banner_id,
              slider_id,
              name,
              status,
              type,
              content,
              image_url,
              url_banner,
              title,
              newtab
         FROM redington_banner
         ORDER BY slider_id ASC, banner_id ASC`
    )) as BannerRow[]

    const grouped = new Map<number, BannerRow[]>()
    for (const banner of banners) {
      if (!sliderIdSet.has(banner.slider_id)) {
        continue
      }
      if (!grouped.has(banner.slider_id)) {
        grouped.set(banner.slider_id, [])
      }
      grouped.get(banner.slider_id)!.push(banner)
    }

    const payload = sliders.map((slider) =>
      serializeSlider(slider, grouped.get(slider.slider_id) ?? [])
    )

    return res.json(payload)
  } catch (error) {
    return sendErrorResponse(res, error, "Unable to load banner sliders.")
  }
}
