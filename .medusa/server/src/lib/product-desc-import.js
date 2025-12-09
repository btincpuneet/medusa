"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyProductDescriptions = exports.extractProductDescriptionRows = void 0;
const adm_zip_1 = __importDefault(require("adm-zip"));
const sync_1 = require("csv-parse/sync");
const SKU_KEYS = ["sku", "product_sku", "item_sku"];
const DESCRIPTION_KEYS = [
    "description",
    "product_description",
    "html",
    "desc",
    "content",
];
const toUtfString = (buffer) => {
    if (buffer.length >= 2) {
        const b0 = buffer[0];
        const b1 = buffer[1];
        if (b0 === 0xff && b1 === 0xfe) {
            return buffer.toString("utf16le");
        }
        if (b0 === 0xfe && b1 === 0xff) {
            return buffer.swap16().toString("utf16le");
        }
    }
    return buffer.toString("utf8");
};
const pickField = (record, keys) => {
    for (const key of Object.keys(record)) {
        const normalized = key.trim().toLowerCase();
        if (keys.includes(normalized)) {
            const value = record[key];
            if (value === null || value === undefined) {
                return "";
            }
            return String(value);
        }
    }
    return "";
};
const parseCsvBuffer = (buffer, source) => {
    const text = toUtfString(buffer);
    const records = (0, sync_1.parse)(text, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
    });
    const rows = [];
    records.forEach((record, index) => {
        const sku = pickField(record, SKU_KEYS).trim();
        const description = pickField(record, DESCRIPTION_KEYS);
        if (!sku || !description.trim().length) {
            return;
        }
        rows.push({
            sku,
            description,
            source: `${source}#${index + 2}`,
        });
    });
    return rows;
};
const extractProductDescriptionRows = (buffer, filename) => {
    const normalizedName = filename.toLowerCase();
    if (normalizedName.endsWith(".zip")) {
        const archive = new adm_zip_1.default(buffer);
        const rows = [];
        archive.getEntries().forEach((entry) => {
            if (entry.isDirectory) {
                return;
            }
            if (!entry.entryName.toLowerCase().endsWith(".csv")) {
                return;
            }
            const data = entry.getData();
            rows.push(...parseCsvBuffer(data, entry.entryName));
        });
        if (!rows.length) {
            throw new Error("ZIP archive does not contain any CSV files.");
        }
        return rows;
    }
    if (normalizedName.endsWith(".csv")) {
        return parseCsvBuffer(buffer, filename);
    }
    throw new Error("Only .zip or .csv files are supported.");
};
exports.extractProductDescriptionRows = extractProductDescriptionRows;
const applyProductDescriptions = async (productService, rows) => {
    const results = [];
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    for (const row of rows) {
        const sku = row.sku.trim();
        if (!sku || !row.description.trim().length) {
            skipped++;
            results.push({
                sku,
                status: "skipped",
                message: "Missing SKU or description.",
                source: row.source,
            });
            continue;
        }
        try {
            const products = await productService.listProducts({ sku }, {
                take: 1,
                order: { created_at: "DESC" },
                relations: [],
            });
            const product = products[0];
            if (!product) {
                failed++;
                results.push({
                    sku,
                    status: "failed",
                    message: "Product not found for SKU.",
                    source: row.source,
                });
                continue;
            }
            const currentDescription = (product.description || "").trim();
            if (currentDescription === row.description.trim()) {
                skipped++;
                results.push({
                    sku,
                    status: "skipped",
                    message: "Description already up to date.",
                    source: row.source,
                });
                continue;
            }
            await productService.updateProducts(product.id, {
                description: row.description,
            });
            updated++;
            results.push({
                sku,
                status: "updated",
                source: row.source,
            });
        }
        catch (error) {
            failed++;
            const message = error instanceof Error ? error.message : "Unknown update error.";
            results.push({
                sku,
                status: "failed",
                message,
                source: row.source,
            });
        }
    }
    return {
        summary: {
            total: rows.length,
            updated,
            skipped,
            failed,
        },
        results,
    };
};
exports.applyProductDescriptions = applyProductDescriptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdC1kZXNjLWltcG9ydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcHJvZHVjdC1kZXNjLWltcG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxzREFBNEI7QUFDNUIseUNBQXNDO0FBRXRDLE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQTtBQUNuRCxNQUFNLGdCQUFnQixHQUFHO0lBQ3ZCLGFBQWE7SUFDYixxQkFBcUI7SUFDckIsTUFBTTtJQUNOLE1BQU07SUFDTixTQUFTO0NBQ1YsQ0FBQTtBQXVCRCxNQUFNLFdBQVcsR0FBRyxDQUFDLE1BQWMsRUFBVSxFQUFFO0lBQzdDLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUN2QixNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDcEIsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BCLElBQUksRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDL0IsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBQ25DLENBQUM7UUFDRCxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQy9CLE9BQU8sTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUM1QyxDQUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNoQyxDQUFDLENBQUE7QUFFRCxNQUFNLFNBQVMsR0FBRyxDQUFDLE1BQStCLEVBQUUsSUFBYyxFQUFFLEVBQUU7SUFDcEUsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDdEMsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQzNDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQzlCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUN6QixJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMxQyxPQUFPLEVBQUUsQ0FBQTtZQUNYLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN0QixDQUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sRUFBRSxDQUFBO0FBQ1gsQ0FBQyxDQUFBO0FBRUQsTUFBTSxjQUFjLEdBQUcsQ0FDckIsTUFBYyxFQUNkLE1BQWMsRUFDVyxFQUFFO0lBQzNCLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNoQyxNQUFNLE9BQU8sR0FBRyxJQUFBLFlBQUssRUFBQyxJQUFJLEVBQUU7UUFDMUIsT0FBTyxFQUFFLElBQUk7UUFDYixnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLGtCQUFrQixFQUFFLElBQUk7UUFDeEIsSUFBSSxFQUFFLElBQUk7S0FDWCxDQUE4QixDQUFBO0lBRS9CLE1BQU0sSUFBSSxHQUE0QixFQUFFLENBQUE7SUFFeEMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUNoQyxNQUFNLEdBQUcsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1FBQzlDLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQTtRQUN2RCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3ZDLE9BQU07UUFDUixDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNSLEdBQUc7WUFDSCxXQUFXO1lBQ1gsTUFBTSxFQUFFLEdBQUcsTUFBTSxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7U0FDakMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRixPQUFPLElBQUksQ0FBQTtBQUNiLENBQUMsQ0FBQTtBQUVNLE1BQU0sNkJBQTZCLEdBQUcsQ0FDM0MsTUFBYyxFQUNkLFFBQWdCLEVBQ1MsRUFBRTtJQUMzQixNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7SUFFN0MsSUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDcEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxpQkFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ2xDLE1BQU0sSUFBSSxHQUE0QixFQUFFLENBQUE7UUFDeEMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3JDLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN0QixPQUFNO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUNwRCxPQUFNO1lBQ1IsQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQTtZQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsY0FBYyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQTtRQUNyRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFBO1FBQ2hFLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNwQyxPQUFPLGNBQWMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDekMsQ0FBQztJQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQTtBQUMzRCxDQUFDLENBQUE7QUFoQ1ksUUFBQSw2QkFBNkIsaUNBZ0N6QztBQUVNLE1BQU0sd0JBQXdCLEdBQUcsS0FBSyxFQUMzQyxjQUFrRCxFQUNsRCxJQUE2QixFQUNZLEVBQUU7SUFDM0MsTUFBTSxPQUFPLEdBQThDLEVBQUUsQ0FBQTtJQUM3RCxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUE7SUFDZixJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUE7SUFDZixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUE7SUFFZCxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDMUIsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDM0MsT0FBTyxFQUFFLENBQUE7WUFDVCxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUNYLEdBQUc7Z0JBQ0gsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLE9BQU8sRUFBRSw2QkFBNkI7Z0JBQ3RDLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTthQUNuQixDQUFDLENBQUE7WUFDRixTQUFRO1FBQ1YsQ0FBQztRQUVELElBQUksQ0FBQztZQUNILE1BQU0sUUFBUSxHQUFHLE1BQU0sY0FBYyxDQUFDLFlBQVksQ0FDaEQsRUFBRSxHQUFHLEVBQUUsRUFDUDtnQkFDRSxJQUFJLEVBQUUsQ0FBQztnQkFDUCxLQUFLLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFO2dCQUM3QixTQUFTLEVBQUUsRUFBRTthQUNkLENBQ0YsQ0FBQTtZQUVELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUMzQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxFQUFFLENBQUE7Z0JBQ1IsT0FBTyxDQUFDLElBQUksQ0FBQztvQkFDWCxHQUFHO29CQUNILE1BQU0sRUFBRSxRQUFRO29CQUNoQixPQUFPLEVBQUUsNEJBQTRCO29CQUNyQyxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07aUJBQ25CLENBQUMsQ0FBQTtnQkFDRixTQUFRO1lBQ1YsQ0FBQztZQUVELE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1lBQzdELElBQUksa0JBQWtCLEtBQUssR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO2dCQUNsRCxPQUFPLEVBQUUsQ0FBQTtnQkFDVCxPQUFPLENBQUMsSUFBSSxDQUFDO29CQUNYLEdBQUc7b0JBQ0gsTUFBTSxFQUFFLFNBQVM7b0JBQ2pCLE9BQU8sRUFBRSxpQ0FBaUM7b0JBQzFDLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTtpQkFDbkIsQ0FBQyxDQUFBO2dCQUNGLFNBQVE7WUFDVixDQUFDO1lBRUQsTUFBTSxjQUFjLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUU7Z0JBQzlDLFdBQVcsRUFBRSxHQUFHLENBQUMsV0FBVzthQUM3QixDQUFDLENBQUE7WUFFRixPQUFPLEVBQUUsQ0FBQTtZQUNULE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ1gsR0FBRztnQkFDSCxNQUFNLEVBQUUsU0FBUztnQkFDakIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNO2FBQ25CLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsTUFBTSxFQUFFLENBQUE7WUFDUixNQUFNLE9BQU8sR0FDWCxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQTtZQUNsRSxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUNYLEdBQUc7Z0JBQ0gsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLE9BQU87Z0JBQ1AsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNO2FBQ25CLENBQUMsQ0FBQTtRQUNKLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTztRQUNMLE9BQU8sRUFBRTtZQUNQLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNsQixPQUFPO1lBQ1AsT0FBTztZQUNQLE1BQU07U0FDUDtRQUNELE9BQU87S0FDUixDQUFBO0FBQ0gsQ0FBQyxDQUFBO0FBeEZZLFFBQUEsd0JBQXdCLDRCQXdGcEMifQ==