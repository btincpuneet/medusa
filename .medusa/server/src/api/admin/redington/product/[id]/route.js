"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATCH = exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const sap_client_1 = __importDefault(require("../../../../../modules/sap-client"));
const redington_product_1 = require("../../../../../modules/redington-product");
const loadProduct = async (productService, productId) => {
    return await productService.retrieveProduct(productId, {
        relations: ["variants", "options"],
    });
};
const logWarning = (req, message) => {
    try {
        const logger = req.scope.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
        logger?.warn?.(message);
    }
    catch (_) {
        // ignore logging errors
    }
};
const logError = (req, message) => {
    try {
        const logger = req.scope.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
        logger?.error?.(message);
    }
    catch (_) {
        // ignore logging errors
    }
};
const GET = async (req, res) => {
    const productService = req.scope.resolve("product");
    const { id } = req.params;
    try {
        const product = await loadProduct(productService, id);
        res.json({
            product: (0, redington_product_1.buildRedingtonProductSummary)(product),
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Product not found.";
        res.status(404).json({ message });
    }
};
exports.GET = GET;
const PATCH = async (req, res) => {
    const productService = req.scope.resolve("product");
    const { id } = req.params;
    const body = (req.body || {});
    const hasCompanyCode = Object.prototype.hasOwnProperty.call(body, "company_code");
    const hasDistribution = Object.prototype.hasOwnProperty.call(body, "distribution_channel");
    if (!hasCompanyCode && !hasDistribution) {
        return res.status(400).json({
            message: "Provide company_code and/or distribution_channel to update the product metadata.",
        });
    }
    let product;
    try {
        product = await loadProduct(productService, id);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Product not found.";
        return res.status(404).json({ message });
    }
    const currentMetadata = (0, redington_product_1.extractRedingtonProductMetadata)(product);
    const updates = {};
    if (hasCompanyCode) {
        updates.company_code = (0, redington_product_1.normalizeMetadataValue)(body.company_code);
    }
    if (hasDistribution) {
        updates.distribution_channel = (0, redington_product_1.normalizeMetadataValue)(body.distribution_channel);
    }
    const nextMetadata = {
        company_code: updates.company_code !== undefined
            ? updates.company_code
            : currentMetadata.company_code,
        distribution_channel: updates.distribution_channel !== undefined
            ? updates.distribution_channel
            : currentMetadata.distribution_channel,
    };
    const metadataChanges = (0, redington_product_1.detectMetadataChanges)(currentMetadata, nextMetadata);
    if (!metadataChanges.company_code && !metadataChanges.distribution_channel) {
        return res.json({
            product: (0, redington_product_1.buildRedingtonProductSummary)(product),
            metadata_changes: metadataChanges,
            message: "No changes detected.",
        });
    }
    try {
        const metadataPayload = (0, redington_product_1.buildMetadataUpdate)(product, updates);
        await productService.updateProducts(id, {
            metadata: metadataPayload,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Failed to update product metadata.";
        return res.status(500).json({ message });
    }
    const updated = await loadProduct(productService, id);
    const summary = (0, redington_product_1.buildRedingtonProductSummary)(updated);
    const sapSync = {
        triggered: false,
        results: [],
    };
    if ((metadataChanges.company_code || metadataChanges.distribution_channel) &&
        summary.company_code &&
        summary.variant_skus.length) {
        const sapClient = (0, sap_client_1.default)();
        sapSync.triggered = true;
        for (const sku of summary.variant_skus) {
            try {
                await sapClient.createProduct(summary.company_code, sku);
                sapSync.results.push({
                    sku,
                    status: "success",
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Unknown SAP sync error.";
                sapSync.results.push({
                    sku,
                    status: "error",
                    message,
                });
                logError(req, `[redington-product] Failed to sync SKU "${sku}" with SAP: ${message}`);
            }
        }
    }
    else if (metadataChanges.company_code &&
        !summary.company_code) {
        logWarning(req, "[redington-product] company_code removed; SAP sync skipped.");
    }
    else if (!summary.variant_skus.length) {
        logWarning(req, "[redington-product] Product has no variants with SKUs; SAP sync skipped.");
    }
    res.json({
        product: summary,
        metadata_changes: metadataChanges,
        sap_sync: sapSync.triggered ? sapSync : undefined,
    });
};
exports.PATCH = PATCH;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9wcm9kdWN0L1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEscURBQXFFO0FBT3JFLG1GQUErRDtBQUMvRCxnRkFRaUQ7QUF3QmpELE1BQU0sV0FBVyxHQUFHLEtBQUssRUFDdkIsY0FBa0QsRUFDbEQsU0FBaUIsRUFDakIsRUFBRTtJQUNGLE9BQU8sTUFBTSxjQUFjLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRTtRQUNyRCxTQUFTLEVBQUUsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDO0tBQ25DLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQTtBQUVELE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxPQUFlLEVBQUUsRUFBRTtJQUN6RCxJQUFJLENBQUM7UUFDSCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FDOUIsaUNBQXlCLENBQUMsTUFBTSxDQUNVLENBQUE7UUFDNUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3pCLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1gsd0JBQXdCO0lBQzFCLENBQUM7QUFDSCxDQUFDLENBQUE7QUFFRCxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQWtCLEVBQUUsT0FBZSxFQUFFLEVBQUU7SUFDdkQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQzlCLGlDQUF5QixDQUFDLE1BQU0sQ0FDVyxDQUFBO1FBQzdDLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUMxQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNYLHdCQUF3QjtJQUMxQixDQUFDO0FBQ0gsQ0FB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