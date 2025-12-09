"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapSliderToMagento = void 0;
const toBooleanFlag = (value) => (value ? 1 : 0);
const formatDate = (value) => {
    if (!value) {
        return null;
    }
    const [datePart] = value.split("T");
    return datePart || null;
};
const mapBanner = (banner) => ({
    banner_id: banner.id,
    name: banner.title,
    status: toBooleanFlag(banner.status),
    type: 0,
    content: null,
    image_url: banner.image_url,
    url_banner: banner.link_url,
    title: banner.title,
    newtab: 0,
});
const mapSliderToMagento = (slider) => ({
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
});
exports.mapSliderToMagento = mapSliderToMagento;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwcGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2FwaS9yZXN0L1YxL2Jhbm5lcnNsaWRlcnMvbWFwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLE1BQU0sYUFBYSxHQUFHLENBQUMsS0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUV6RCxNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQXFCLEVBQUUsRUFBRTtJQUMzQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDWCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFDRCxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNuQyxPQUFPLFFBQVEsSUFBSSxJQUFJLENBQUE7QUFDekIsQ0FBQyxDQUFBO0FBRUQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxNQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLFNBQVMsRUFBRSxNQUFNLENBQUMsRUFBRTtJQUNwQixJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUs7SUFDbEIsTUFBTSxFQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ3BDLElBQUksRUFBRSxDQUFDO0lBQ1AsT0FBTyxFQUFFLElBQUk7SUFDYixTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVM7SUFDM0IsVUFBVSxFQUFFLE1BQU0sQ0FBQyxRQUFRO0lBQzNCLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSztJQUNuQixNQUFNLEVBQUUsQ0FBQztDQUNWLENBQUMsQ0FBQTtBQUVLLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxNQUF1QixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzlELFNBQVMsRUFBRSxNQUFNLENBQUMsRUFBRTtJQUNwQixJQUFJLEVBQUUsTUFBTSxDQUFDLFVBQVUsSUFBSSxNQUFNLENBQUMsS0FBSztJQUN2QyxNQUFNLEVBQUUsYUFBYSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDcEMsUUFBUSxFQUFFLHFCQUFxQjtJQUMvQixTQUFTLEVBQUUsR0FBRztJQUNkLGtCQUFrQixFQUFFLFNBQVM7SUFDN0IsUUFBUSxFQUFFLENBQUM7SUFDWCxNQUFNLEVBQUUsUUFBUTtJQUNoQixVQUFVLEVBQUUsSUFBSTtJQUNoQixXQUFXLEVBQUUsSUFBSTtJQUNqQixNQUFNLEVBQUUsQ0FBQztJQUNULElBQUksRUFBRSxJQUFJO0lBQ1YsU0FBUyxFQUFFLElBQUk7SUFDZixRQUFRLEVBQUUsSUFBSTtJQUNkLGdCQUFnQixFQUFFLElBQUk7SUFDdEIsR0FBRyxFQUFFLElBQUk7SUFDVCxJQUFJLEVBQUUsSUFBSTtJQUNWLGFBQWEsRUFBRSxJQUFJO0lBQ25CLGdCQUFnQixFQUFFLElBQUk7SUFDdEIsU0FBUyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO0lBQ3hDLE9BQU8sRUFBRSxJQUFJO0lBQ2IsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztDQUN2QyxDQUFDLENBQUE7QUF2QlcsUUFBQSxrQkFBa0Isc0JBdUI3QiJ9