"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectMetadataChanges = exports.buildRedingtonProductSummary = exports.buildMetadataUpdate = exports.extractRedingtonProductMetadata = exports.normalizeMetadataValue = void 0;
const META_KEYS = {
    company_code: "company_code",
    distribution_channel: "distribution_channel",
};
const isRecord = (value) => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};
const normalizeMetadataValue = (value) => {
    if (value === null || value === undefined) {
        return null;
    }
    const stringValue = typeof value === "string" ? value : String(value);
    const trimmed = stringValue.trim();
    return trimmed.length ? trimmed : null;
};
exports.normalizeMetadataValue = normalizeMetadataValue;
const extractRedingtonProductMetadata = (product) => {
    const metadata = isRecord(product.metadata)
        ? product.metadata
        : {};
    return {
        company_code: (0, exports.normalizeMetadataValue)(metadata[META_KEYS.company_code]),
        distribution_channel: (0, exports.normalizeMetadataValue)(metadata[META_KEYS.distribution_channel]),
    };
};
exports.extractRedingtonProductMetadata = extractRedingtonProductMetadata;
const buildMetadataUpdate = (product, updates) => {
    const metadata = isRecord(product.metadata)
        ? { ...product.metadata }
        : {};
    if (updates.company_code !== undefined) {
        const normalized = (0, exports.normalizeMetadataValue)(updates.company_code);
        if (normalized === null) {
            delete metadata[META_KEYS.company_code];
        }
        else {
            metadata[META_KEYS.company_code] = normalized;
        }
    }
    if (updates.distribution_channel !== undefined) {
        const normalized = (0, exports.normalizeMetadataValue)(updates.distribution_channel);
        if (normalized === null) {
            delete metadata[META_KEYS.distribution_channel];
        }
        else {
            metadata[META_KEYS.distribution_channel] = normalized;
        }
    }
    return metadata;
};
exports.buildMetadataUpdate = buildMetadataUpdate;
const buildRedingtonProductSummary = (product) => {
    const { company_code, distribution_channel } = (0, exports.extractRedingtonProductMetadata)(product);
    const variantSkus = Array.isArray(product.variants)
        ? Array.from(new Set(product.variants
            .map((variant) => (0, exports.normalizeMetadataValue)(variant.sku))
            .filter((sku) => sku !== null)))
        : [];
    const metadata = isRecord(product.metadata)
        ? { ...product.metadata }
        : {};
    return {
        id: product.id,
        title: product.title,
        handle: product.handle ?? null,
        status: product.status,
        subtitle: product.subtitle ?? null,
        description: product.description ?? null,
        thumbnail: product.thumbnail ?? null,
        company_code,
        distribution_channel,
        variant_skus: variantSkus,
        updated_at: product.updated_at,
        created_at: product.created_at,
        metadata,
    };
};
exports.buildRedingtonProductSummary = buildRedingtonProductSummary;
const detectMetadataChanges = (current, next) => ({
    company_code: current.company_code !== next.company_code,
    distribution_channel: current.distribution_channel !== next.distribution_channel,
});
exports.detectMetadataChanges = detectMetadataChanges;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9yZWRpbmd0b24tcHJvZHVjdC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUF1QkEsTUFBTSxTQUFTLEdBQUc7SUFDaEIsWUFBWSxFQUFFLGNBQWM7SUFDNUIsb0JBQW9CLEVBQUUsc0JBQXNCO0NBQ3BDLENBQUE7QUFFVixNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQWMsRUFBb0MsRUFBRTtJQUNwRSxPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUM3RSxDQUFDLENBQUE7QUFFTSxNQUFNLHNCQUFzQixHQUFHLENBQUMsS0FBYyxFQUFpQixFQUFFO0lBQ3RFLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDMUMsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsTUFBTSxXQUFXLEdBQ2YsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNuRCxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDbEMsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtBQUN4QyxDQUFDLENBQUE7QUFUWSxRQUFBLHNCQUFzQiwwQkFTbEM7QUFFTSxNQUFNLCtCQUErQixHQUFHLENBQzdDLE9BQWdDLEVBQ04sRUFBRTtJQUM1QixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztRQUN6QyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVE7UUFDbEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtJQUVOLE9BQU87UUFDTCxZQUFZLEVBQUUsSUFBQSw4QkFBc0IsRUFBQyxRQUFRLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3RFLG9CQUFvQixFQUFFLElBQUEsOEJBQXNCLEVBQzFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FDekM7S0FDRixDQUFBO0FBQ0gsQ0FBQyxDQUFBO0FBYlksUUFBQSwrQkFBK0IsbUNBYTNDO0FBRU0sTUFBTSxtQkFBbUIsR0FBRyxDQUNqQyxPQUFnQyxFQUNoQyxPQUEwQyxFQUNqQixFQUFFO0lBQzNCLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxFQUFFLEdBQUcsT0FBTyxDQUFDLFFBQVEsRUFBRTtRQUN6QixDQUFDLENBQUMsRUFBRSxDQUFBO0lBRU4sSUFBSSxPQUFPLENBQUMsWUFBWSxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ3ZDLE1BQU0sVUFBVSxHQUFHLElBQUEsOEJBQXNCLEVBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQy9ELElBQUksVUFBVSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3hCLE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUN6QyxDQUFDO2FBQU0sQ0FBQztZQUNOLFFBQVEsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLEdBQUcsVUFBVSxDQUFBO1FBQy9DLENBQUM7SUFDSCxDQUFDO0lBRUQsSUFBSSxPQUFPLENBQUMsb0JBQW9CLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDL0MsTUFBTSxVQUFVLEdBQUcsSUFBQSw4QkFBc0IsRUFDdkMsT0FBTyxDQUFDLG9CQUFvQixDQUM3QixDQUFBO1FBQ0QsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDeEIsT0FBTyxRQUFRLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLENBQUE7UUFDakQsQ0FBQzthQUFNLENBQUM7WUFDTixRQUFRLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsVUFBVSxDQUFBO1FBQ3ZELENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxRQUFRLENBQUE7QUFDakIsQ0FBQyxDQUFBO0FBN0JZLFFBQUEsbUJBQW1CLHVCQTZCL0I7QUFFTSxNQUFNLDRCQUE0QixHQUFHLENBQzFDLE9BQWdDLEVBQ1AsRUFBRTtJQUMzQixNQUFNLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixFQUFFLEdBQzFDLElBQUEsdUNBQStCLEVBQUMsT0FBTyxDQUFDLENBQUE7SUFFMUMsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1FBQ2pELENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUNSLElBQUksR0FBRyxDQUNMLE9BQU8sQ0FBQyxRQUFRO2FBQ2IsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFBLDhCQUFzQixFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNyRCxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQWlCLEVBQUUsQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQ2hELENBQ0Y7UUFDSCxDQUFDLENBQUMsRUFBRSxDQUFBO0lBRU4sTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7UUFDekMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFO1FBQ3pCLENBQUMsQ0FBQyxFQUFFLENBQUE7SUFFTixPQUFPO1FBQ0wsRUFBRSxFQUFFLE9BQU8sQ0FBQyxFQUFFO1FBQ2QsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3BCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxJQUFJLElBQUk7UUFDOUIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNO1FBQ3RCLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxJQUFJLElBQUk7UUFDbEMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXLElBQUksSUFBSTtRQUN4QyxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJO1FBQ3BDLFlBQVk7UUFDWixvQkFBb0I7UUFDcEIsWUFBWSxFQUFFLFdBQVc7UUFDekIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1FBQzlCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtRQUM5QixRQUFRO0tBQ1QsQ0FBQTtBQUNILENBQUMsQ0FBQTtBQW5DWSxRQUFBLDRCQUE0QixnQ0FtQ3hDO0FBRU0sTUFBTSxxQkFBcUIsR0FBRyxDQUNuQyxPQUFpQyxFQUNqQyxJQUE4QixFQUM5QixFQUFFLENBQUMsQ0FBQztJQUNKLFlBQVksRUFBRSxPQUFPLENBQUMsWUFBWSxLQUFLLElBQUksQ0FBQyxZQUFZO0lBQ3hELG9CQUFvQixFQUNsQixPQUFPLENBQUMsb0JBQW9CLEtBQUssSUFBSSxDQUFDLG9CQUFvQjtDQUM3RCxDQUFDLENBQUE7QUFQVyxRQUFBLHFCQUFxQix5QkFPaEMifQ==