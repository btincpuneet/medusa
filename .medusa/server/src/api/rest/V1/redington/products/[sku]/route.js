"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.OPTIONS = void 0;
const magentoClient_1 = require("../../../../../magentoClient");
const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL;
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN;
const setCors = (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Vary", "Origin");
    }
    else {
        res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ||
        "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
};
const toMajorUnits = (amount) => {
    const value = Number(amount ?? 0);
    if (!Number.isFinite(value)) {
        return 0;
    }
    return Number((value / 100).toFixed(2));
};
const buildMediaEntries = (images = []) => images.map((image, index) => ({
    id: image.id ?? index + 1,
    media_type: "image",
    label: image.metadata?.label ?? null,
    position: index,
    disabled: false,
    file: image.url ?? "",
}));
const buildProductResponse = (product, variantSku) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const variant = variants.find((entry) => entry.sku === variantSku) ?? variants[0] ?? null;
    if (!variant) {
        throw new Error("Variant not found");
    }
    const prices = variant.prices ?? [];
    const price = prices.length ? prices[0].amount : 0;
    return {
        id: product.id,
        variant_id: variant.id ?? null,
        sku: variant.sku ?? product.handle ?? product.id,
        name: product.title,
        attribute_set_id: 0,
        price: toMajorUnits(price),
        status: product.status === "published" ? 1 : 0,
        visibility: 4,
        type_id: variants.length > 1 ? "configurable" : "simple",
        created_at: product.created_at,
        updated_at: product.updated_at,
        weight: variant.weight ?? 0,
        custom_attributes: [
            {
                attribute_code: "small_image",
                value: product.thumbnail ?? product.images?.[0]?.url ?? "",
            },
            {
                attribute_code: "image",
                value: product.images?.[0]?.url ?? product.thumbnail ?? "",
            },
        ],
        media_gallery_entries: buildMediaEntries(product.images),
        extension_attributes: {
            stock_item: {
                qty: variant.inventory_quantity ?? 0,
            },
            product_category: product.categories?.[0]?.id ?? null,
            category_links: (product.categories ?? []).map((category) => ({
                category_id: category.id,
                position: 0,
            })),
            on_home: product.metadata?.on_home ?? 0,
        },
    };
};
const fetchMagentoProduct = async (sku) => {
    if (!MAGENTO_REST_BASE_URL || !MAGENTO_ADMIN_TOKEN) {
        throw new Error("Magento configuration missing.");
    }
    const client = (0, magentoClient_1.createMagentoB2CClient)({
        baseUrl: MAGENTO_REST_BASE_URL,
        axiosConfig: {
            headers: {
                Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
                "Content-Type": "application/json",
            },
        },
    });
    const response = await client.request({
        url: `products/${encodeURIComponent(sku)}`,
        method: "GET",
    });
    return response.data;
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const GET = async (req, res) => {
    setCors(req, res);
    const sku = req.params?.sku || req.params?.id;
    if (!sku) {
        return res.status(400).json({ message: "SKU is required." });
    }
    let productModule = null;
    let legacyProductService = null;
    let legacyVariantService = null;
    try {
        productModule = req.scope.resolve("product");
    }
    catch {
        productModule = null;
    }
    if (!productModule) {
        try {
            legacyProductService = req.scope.resolve("productService");
        }
        catch {
            legacyProductService = null;
        }
        try {
            legacyVariantService = req.scope.resolve("productVariantService");
        }
        catch {
            legacyVariantService = null;
        }
    }
    const ensureLegacyServices = () => {
        if (!legacyProductService || !legacyVariantService) {
            throw new Error("Product services are not available.");
        }
    };
    try {
        if (productModule) {
            const [variants] = await productModule.listAndCountProductVariants({ sku }, {
                relations: [
                    "product",
                    "product.variants",
                    "product.variants.prices",
                    "product.images",
                    "product.categories",
                ],
                take: 1,
            });
            const variant = variants[0];
            if (!variant) {
                throw new Error("Variant not found");
            }
            const productId = variant.product_id ?? variant.product?.id;
            if (!productId && !variant.product) {
                throw new Error("Variant missing product reference");
            }
            const product = variant.product ??
                (await productModule.retrieveProduct(productId, {
                    relations: [
                        "variants",
                        "variants.prices",
                        "images",
                        "categories",
                    ],
                }));
            if (product.variants?.length > 1) {
                const magentoProduct = await fetchMagentoProduct(sku);
                return res.json(magentoProduct);
            }
            const payload = buildProductResponse(product, sku);
            return res.json(payload);
        }
        ensureLegacyServices();
        const variant = await legacyVariantService.retrieveBySKU(sku, {});
        const product = await legacyProductService.retrieve(variant.product_id, {
            relations: ["variants", "variants.prices", "images", "categories"],
        });
        if (product.variants?.length > 1) {
            const magentoProduct = await fetchMagentoProduct(sku);
            return res.json(magentoProduct);
        }
        const payload = buildProductResponse(product, sku);
        return res.json(payload);
    }
    catch (error) {
        try {
            const magentoProduct = await fetchMagentoProduct(sku);
            return res.json(magentoProduct);
        }
        catch (magentoError) {
            const status = magentoError?.response?.status ?? 502;
            const message = magentoError?.response?.data?.message ||
                magentoError?.message ||
                "Failed to load product.";
            return res.status(status).json({ message });
        }
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvcmVkaW5ndG9uL3Byb2R1Y3RzL1tza3VdL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdBLGdFQUFxRTtBQUVyRSxNQUFNLHFCQUFxQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUE7QUFDL0QsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFBO0FBRTNELE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDMUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztTQUFNLENBQUM7UUFDTixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRCxHQUFHLENBQUMsTUFBTSxDQUNSLDhCQUE4QixFQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO1FBQzNDLDZCQUE2QixDQUNoQyxDQUFBO0lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxhQUFhLENBQUMsQ0FBQTtJQUN6RCxHQUFHLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3hELENBQUMsQ0FBQTtBQUVELE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBVyxFQUFFLEVBQUU7SUFDbkMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxD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