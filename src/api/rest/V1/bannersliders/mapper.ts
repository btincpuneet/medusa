import { BannerRow, BannerSliderRow } from "../../../../lib/pg"

const toBooleanFlag = (value: boolean) => (value ? 1 : 0)

const formatDate = (value?: string | null) => {
  if (!value) {
    return null
  }
  const [datePart] = value.split("T")
  return datePart || null
}

const mapBanner = (banner: BannerRow) => ({
  banner_id: banner.id,
  name: banner.title,
  status: toBooleanFlag(banner.status),
  type: 0,
  content: null,
  image_url: banner.image_url,
  url_banner: banner.link_url,
  title: banner.title,
  newtab: 0,
})

export const mapSliderToMagento = (slider: BannerSliderRow) => ({
  slider_id: slider.id,
  name: slider.identifier || slider.title,
  status: toBooleanFlag(slider.status),
  location: "custom.snippet-code",
  store_ids: "0",
  customer_group_ids: "0,1,2,3",
  priority: 0,
  effect: "slider",
  auto_width: null,
  auto_height: null,
  design: 0,
  loop: null,
  lazy_load: null,
  autoplay: null,
  autoplay_timeout: 5000,
  nav: null,
  dots: null,
  is_responsive: null,
  responsive_items: "[]",
  from_date: formatDate(slider.created_at),
  to_date: null,
  banners: slider.banners.map(mapBanner),
})
