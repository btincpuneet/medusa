"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const respond_1 = require("../utils/respond");
const formatDate = (value) => {
    if (!value) {
        return null;
    }
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : null;
};
const serializeBanner = (banner) => ({
    banner_id: banner.banner_id,
    name: banner.name,
    status: banner.status ?? 0,
    type: banner.type ?? 0,
    content: banner.content ?? null,
    image_url: banner.image_url,
    url_banner: banner.url_banner ?? null,
    title: banner.title ?? null,
    newtab: banner.newtab ?? 0,
});
const serializeSlider = (slider, banners) => ({
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
});
const GET = async (req, res) => {
    try {
        const manager = req.scope.resolve("manager");
        const sliders = (await manager.query(`SELECT slider_id,
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
         ORDER BY priority ASC, slider_id ASC`));
        if (!sliders.length) {
            return res.json([]);
        }
        const sliderIdSet = new Set(sliders.map((slider) => slider.slider_id));
        const banners = (await manager.query(`SELECT banner_id,
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
         ORDER BY slider_id ASC, banner_id ASC`));
        const grouped = new Map();
        for (const banner of banners) {
            if (!sliderIdSet.has(banner.slider_id)) {
                continue;
            }
            if (!grouped.has(banner.slider_id)) {
                grouped.set(banner.slider_id, []);
            }
            grouped.get(banner.slider_id).push(banner);
        }
        const payload = sliders.map((slider) => serializeSlider(slider, grouped.get(slider.slider_id) ?? []));
        return res.json(payload);
    }
    catch (error) {
        return (0, respond_1.sendErrorResponse)(res, error, "Unable to load banner sliders.");
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3JlZGluZ3Rvbi9iYW5uZXJzbGlkZXJzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUtBLDhDQUFvRDtBQUVwRCxNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQTRCLEVBQUUsRUFBRTtJQUNsRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDWCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFDRCxJQUFJLEtBQUssWUFBWSxJQUFJLEVBQUUsQ0FBQztRQUMxQixPQUFPLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3pDLENBQUM7SUFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDcEMsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtBQUN4QyxDQUFDLENBQUE7QUEyQ0QsTUFBTSxlQUFlLEdBQUcsQ0FBQyxNQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzlDLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztJQUMzQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7SUFDakIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQztJQUMxQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDO0lBQ3RCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxJQUFJLElBQUk7SUFDL0IsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO0lBQzNCLFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVSxJQUFJLElBQUk7SUFDckMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLElBQUksSUFBSTtJQUMzQixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDO0NBQzNCLENBQUMsQ0FBQTtBQUVGLE1BQU0sZUFBZSxHQUFHLENBQUMsTUFBaUIsRUFBRSxPQUFvQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3BFLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztJQUMzQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7SUFDakIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQztJQUMxQixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7SUFDekIsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTLElBQUksRUFBRTtJQUNqQyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsa0JBQWtCLElBQUksRUFBRTtJQUNuRCxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsSUFBSSxDQUFDO0lBQzlCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxJQUFJLFFBQVE7SUFDakMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVLElBQUksSUFBSTtJQUNyQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVcsSUFBSSxJQUFJO0lBQ3ZDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUM7SUFDMUIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSTtJQUN6QixTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsSUFBSSxJQUFJO0lBQ25DLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxJQUFJLElBQUk7SUFDakMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixJQUFJLENBQUM7SUFDOUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLElBQUksSUFBSTtJQUN2QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJO0lBQ3pCLGFBQWEsRUFBRSxNQUFNLENBQUMsYUFBYSxJQUFJLElBQUk7SUFDM0MsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixJQUFJLElBQUk7SUFDakQsU0FBUyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDO0lBQ3ZDLE9BQU8sRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztJQUNuQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUM7Q0FDdEMsQ0FBQyxDQUFBO0FBRUssTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ25FLElBQUksQ0FBQztRQUNILE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBcUIsQ0FBQTtRQUNoRSxNQUFNLE9BQU8sR0FBRyxDQUFDLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FDbEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OENBc0J3QyxDQUN6QyxDQUFnQixDQUFBO1FBRWpCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDcEIsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3JCLENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQTtRQUN0RSxNQUFNLE9BQU8sR0FBRyxDQUFDLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FDbEM7Ozs7Ozs7Ozs7OytDQVd5QyxDQUMxQyxDQUFnQixDQUFBO1FBRWpCLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFBO1FBQzlDLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLFNBQVE7WUFDVixDQUFDO1lBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUNuQyxDQUFDO1lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQzdDLENBQUM7UUFFRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FDckMsZUFBZSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FDN0QsQ0FBQTtRQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUMxQixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sSUFBQSwyQkFBaUIsRUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLGdDQUFnQyxDQUFDLENBQUE7SUFDeEUsQ0FBQztBQUNILENBQUMsQ0FBQTtBQXBFWSxRQUFBLEdBQUcsT0FvRWYifQ==