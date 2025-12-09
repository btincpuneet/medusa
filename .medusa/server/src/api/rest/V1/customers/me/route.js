"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = exports.PUT = exports.GET = exports.OPTIONS = void 0;
const utils_1 = require("@medusajs/utils");
const customer_auth_1 = require("../../../../../lib/customer-auth");
const pg_1 = require("../../../../../lib/pg");
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
    res.header("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
};
const decodeJwtPayload = (token) => {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) {
            return null;
        }
        const normalizeBase64 = (value) => {
            let normalized = value.replace(/-/g, "+").replace(/_/g, "/");
            while (normalized.length % 4 !== 0) {
                normalized += "=";
            }
            return normalized;
        };
        const payload = Buffer.from(normalizeBase64(parts[1]), "base64").toString("utf8");
        return JSON.parse(payload);
    }
    catch {
        return null;
    }
};
const fetchCustomerByEmail = async (email) => {
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id, email, first_name, last_name, metadata, created_at, updated_at
      FROM "customer"
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `, [email]);
    return rows[0] ?? null;
};
const fetchCustomerAddresses = async (customerId) => {
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        id,
        customer_id,
        first_name,
        last_name,
        address_1,
        address_2,
        city,
        country_code,
        province,
        postal_code,
        phone,
        metadata,
        is_default_shipping,
        is_default_billing
      FROM customer_address
      WHERE customer_id = $1
        AND deleted_at IS NULL
      ORDER BY created_at ASC, id ASC
    `, [customerId]);
    return rows;
};
const formatDateTime = (value) => {
    const candidate = value ? new Date(value) : new Date();
    const date = Number.isNaN(candidate.getTime()) ? new Date() : candidate;
    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const sanitizeString = (value, fallback = "") => {
    if (typeof value === "string") {
        return value.trim();
    }
    if (value === null || value === undefined) {
        return fallback;
    }
    return String(value).trim();
};
const toNullableString = (value) => {
    const trimmed = sanitizeString(value);
    return trimmed.length ? trimmed : null;
};
const coerceNumber = (value, fallback) => {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
};
const coerceNullableNumber = (value) => {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const coerceBoolean = (value, fallback = false) => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1"].includes(normalized)) {
            return true;
        }
        if (["false", "0"].includes(normalized)) {
            return false;
        }
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    return fallback;
};
const parseMetadata = (value) => {
    if (!value) {
        return {};
    }
    if (typeof value === "object") {
        return value;
    }
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        }
        catch {
            return {};
        }
    }
    return {};
};
const mapAddressToMagento = (row, customerId) => {
    const metadata = parseMetadata(row.metadata);
    const regionCode = toNullableString(metadata.region_code);
    const regionLabel = toNullableString(metadata.region_label) ||
        toNullableString(metadata.region) ||
        toNullableString(row.province);
    const regionId = coerceNullableNumber(metadata.region_id ?? metadata.regionId);
    const street = [
        sanitizeString(row.address_1),
        sanitizeString(row.address_2),
    ];
    const country = sanitizeString(row.country_code);
    return {
        id: row.id,
        customer_id: customerId,
        region: {
            region_code: regionCode,
            region: regionLabel,
            region_id: regionId,
        },
        region_id: regionId,
        country_id: country ? country.toUpperCase() : "",
        street,
        telephone: sanitizeString(row.phone),
        postcode: sanitizeString(row.postal_code),
        city: sanitizeString(row.city),
        firstname: sanitizeString(row.first_name),
        lastname: sanitizeString(row.last_name),
        default_shipping: coerceBoolean(metadata.default_shipping ?? row.is_default_shipping, false),
        default_billing: coerceBoolean(metadata.default_billing ?? row.is_default_billing, false),
    };
};
const buildMagentoCustomerPayload = (row, addresses) => {
    const metadata = parseMetadata(row.metadata);
    const mappedAddresses = addresses.map((address) => mapAddressToMagento(address, row.id));
    const defaultBillingAddress = mappedAddresses.find((address) => address.default_billing);
    const defaultShippingAddress = mappedAddresses.find((address) => address.default_shipping);
    const attributeDefinitions = [
        { code: "mobile_verify", fallback: "0" },
        { code: "customer_approve", fallback: "0" },
        { code: "sap_sync", fallback: "0" },
        { code: "mobile_number", fallback: "" },
        { code: "sap_customer_code", fallback: "" },
        { code: "company_code", fallback: "" },
        { code: "access_id", fallback: "" },
    ];
    const customAttributes = attributeDefinitions.map(({ code, fallback }) => ({
        attribute_code: code,
        value: sanitizeString(metadata[code], fallback),
    }));
    return {
        id: row.id,
        group_id: coerceNumber(metadata.group_id, 1),
        default_billing: defaultBillingAddress
            ? String(defaultBillingAddress.id)
            : null,
        default_shipping: defaultShippingAddress
            ? String(defaultShippingAddress.id)
            : null,
        created_at: formatDateTime(row.created_at),
        updated_at: formatDateTime(row.updated_at),
        created_in: sanitizeString(metadata.created_in, "Default Store View"),
        email: sanitizeString(row.email),
        firstname: sanitizeString(row.first_name),
        lastname: sanitizeString(row.last_name),
        prefix: toNullableString(metadata.prefix),
        gender: coerceNumber(metadata.gender, 0),
        store_id: coerceNumber(metadata.store_id, 1),
        website_id: coerceNumber(metadata.website_id, 1),
        addresses: mappedAddresses,
        disable_auto_group_change: coerceNumber(metadata.disable_auto_group_change, 0),
        extension_attributes: {
            is_subscribed: coerceBoolean(metadata.is_subscribed, false),
        },
        custom_attributes: customAttributes,
    };
};
const extractToken = (req) => {
    const raw = req.headers.authorization || req.headers["x-auth-token"] || "";
    return Array.isArray(raw) ? raw[0] || "" : raw;
};
const resolveCustomerContext = async (req, { requireExisting = true } = {}) => {
    const tokenHeader = extractToken(req);
    if (!tokenHeader) {
        throw {
            status: 401,
            message: "Missing Authorization header.",
        };
    }
    const token = tokenHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token.length) {
        throw {
            status: 401,
            message: "Invalid Authorization header.",
        };
    }
    const guestToken = await (0, pg_1.findActiveGuestToken)(token).catch(() => null);
    let email = null;
    if (guestToken?.email) {
        email = guestToken.email;
    }
    else {
        const payload = decodeJwtPayload(token);
        if (payload?.email) {
            email = payload.email;
        }
    }
    if (email) {
        email = email.trim().toLowerCase();
    }
    if (!email) {
        throw {
            status: 401,
            message: "Invalid or expired token.",
        };
    }
    const customer = await fetchCustomerByEmail(email);
    if (requireExisting && !customer) {
        throw {
            status: 404,
            message: "Customer not found.",
        };
    }
    return {
        token,
        email,
        customer,
    };
};
const normalizeCustomAttributesInput = (value) => {
    if (!value) {
        return {};
    }
    if (Array.isArray(value)) {
        return value.reduce((acc, attr) => {
            if (attr &&
                typeof attr.attribute_code === "string" &&
                attr.attribute_code.length) {
                acc[attr.attribute_code] = attr.value;
            }
            return acc;
        }, {});
    }
    if (typeof value === "object") {
        return value;
    }
    return {};
};
const normalizeAddressInput = (address) => {
    if (!address || typeof address !== "object") {
        return null;
    }
    const streetArray = Array.isArray(address.street)
        ? address.street
            .map((line) => typeof line === "string" ? line.trim() : String(line || ""))
            .filter((line) => line.length)
        : typeof address.street === "string" && address.street.trim().length
            ? [address.street.trim()]
            : [];
    const regionObject = (address.region && typeof address.region === "object") || null;
    const regionName = regionObject?.region ??
        regionObject?.region_name ??
        (typeof address.region === "string" ? address.region : null);
    const regionCode = regionObject?.region_code ??
        regionObject?.code ??
        (typeof address.region_code === "string" ? address.region_code : null) ??
        null;
    const regionId = regionObject?.region_id ??
        address.region_id ??
        (typeof address.regionId === "number" ? address.regionId : null);
    return {
        id: address.id ? String(address.id) : undefined,
        first_name: address.firstname ?? address.first_name ?? "",
        last_name: address.lastname ?? address.last_name ?? "",
        phone: address.telephone ?? address.phone ?? "",
        address_1: streetArray[0] ?? "",
        address_2: streetArray.slice(1).join(", ") || null,
        city: address.city ?? "",
        country_code: (address.country_id ?? address.country_code ?? "")
            .toString()
            .toUpperCase(),
        postal_code: address.postcode ?? address.post_code ?? "",
        province: regionName ?? null,
        is_default_shipping: Boolean(address.default_shipping),
        is_default_billing: Boolean(address.default_billing),
        metadata: {
            magento_region: regionName,
            magento_region_code: regionCode,
            magento_region_id: regionId,
            magento_region_object: regionObject,
            magento_street: streetArray,
        },
    };
};
const syncCustomerAddresses = async (customerId, addresses) => {
    const pool = (0, pg_1.getPgPool)();
    const { rows: existingRows } = await pool.query(`
      SELECT id, metadata
      FROM customer_address
      WHERE customer_id = $1
    `, [customerId]);
    const existingMap = new Map(existingRows.map((row) => [row.id, row]));
    const keepIds = new Set();
    for (const address of addresses) {
        const normalized = normalizeAddressInput(address);
        if (!normalized) {
            continue;
        }
        const baseId = normalized.id && existingMap.has(normalized.id)
            ? normalized.id
            : (0, utils_1.generateEntityId)(undefined, "cuaddr");
        keepIds.add(baseId);
        const existingMetadata = (existingMap.get(baseId)?.metadata &&
            typeof existingMap.get(baseId).metadata === "object" &&
            existingMap.get(baseId).metadata !== null
            ? existingMap.get(baseId).metadata
            : {}) ?? {};
        const metadata = {
            ...existingMetadata,
            ...normalized.metadata,
            company: typeof address.company === "string" ? address.company : existingMetadata.company,
        };
        if (existingMap.has(baseId)) {
            await pool.query(`
          UPDATE customer_address
          SET
            first_name = $1,
            last_name = $2,
            address_1 = $3,
            address_2 = $4,
            city = $5,
            country_code = $6,
            province = $7,
            postal_code = $8,
            phone = $9,
            is_default_shipping = $10,
            is_default_billing = $11,
            metadata = $12,
            updated_at = NOW(),
            deleted_at = NULL
          WHERE id = $13
            AND customer_id = $14
        `, [
                normalized.first_name,
                normalized.last_name,
                normalized.address_1,
                normalized.address_2,
                normalized.city,
                normalized.country_code || null,
                normalized.province,
                normalized.postal_code,
                normalized.phone,
                normalized.is_default_shipping,
                normalized.is_default_billing,
                metadata,
                baseId,
                customerId,
            ]);
        }
        else {
            await pool.query(`
          INSERT INTO customer_address (
            id,
            customer_id,
            address_name,
            first_name,
            last_name,
            address_1,
            address_2,
            city,
            country_code,
            province,
            postal_code,
            phone,
            metadata,
            is_default_shipping,
            is_default_billing
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          )
        `, [
                baseId,
                customerId,
                `${normalized.first_name ?? ""} ${normalized.last_name ?? ""}`.trim() ||
                    null,
                normalized.first_name,
                normalized.last_name,
                normalized.address_1,
                normalized.address_2,
                normalized.city,
                normalized.country_code || null,
                normalized.province,
                normalized.postal_code,
                normalized.phone,
                metadata,
                normalized.is_default_shipping,
                normalized.is_default_billing,
            ]);
        }
    }
    for (const row of existingRows) {
        if (!keepIds.has(row.id)) {
            await pool.query(`
          UPDATE customer_address
          SET deleted_at = NOW(), updated_at = NOW()
          WHERE id = $1
            AND customer_id = $2
        `, [row.id, customerId]);
        }
    }
};
const softDeleteCustomer = async (customerId) => {
    await (0, pg_1.getPgPool)().query(`
      UPDATE "customer"
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [customerId]);
    await (0, pg_1.getPgPool)().query(`
      UPDATE customer_address
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE customer_id = $1
    `, [customerId]);
};
const handleContextError = (res, error) => {
    if (error?.status) {
        return res.status(error.status).json({ message: error.message });
    }
    return res
        .status(500)
        .json({ message: error?.message ?? "Unexpected customer error." });
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const GET = async (req, res) => {
    setCors(req, res);
    let context;
    try {
        context = await resolveCustomerContext(req);
    }
    catch (error) {
        return handleContextError(res, error);
    }
    try {
        const addresses = await fetchCustomerAddresses(context.customer.id);
        return res.json(buildMagentoCustomerPayload(context.customer, addresses));
    }
    catch (error) {
        return res.status(500).json({
            message: error?.message ?? "Failed to load customer profile.",
        });
    }
};
exports.GET = GET;
const PUT = async (req, res) => {
    setCors(req, res);
    let context;
    try {
        context = await resolveCustomerContext(req);
    }
    catch (error) {
        return handleContextError(res, error);
    }
    const body = (req.body || {});
    const payload = (body.customer || {});
    const customAttributes = normalizeCustomAttributesInput(payload.custom_attributes);
    const updateData = {};
    const metadataUpdates = {};
    let passwordUpdate;
    if (typeof payload.firstname === "string") {
        updateData.first_name = payload.firstname;
    }
    if (typeof payload.lastname === "string") {
        updateData.last_name = payload.lastname;
    }
    if (typeof payload.middlename === "string") {
        metadataUpdates.middlename = payload.middlename;
    }
    if (Object.keys(customAttributes).length) {
        metadataUpdates.magento_custom_attributes = {
            ...((context.customer.metadata || {}).magento_custom_attributes || {}),
            ...customAttributes,
        };
    }
    if (typeof payload.store_id === "number" ||
        typeof payload.website_id === "number") {
        metadataUpdates.store_id =
            typeof payload.store_id === "number"
                ? payload.store_id
                : context.customer.metadata?.store_id;
        metadataUpdates.website_id =
            typeof payload.website_id === "number"
                ? payload.website_id
                : context.customer.metadata?.website_id;
    }
    if (Object.keys(metadataUpdates).length) {
        updateData.metadata = {
            ...(context.customer.metadata || {}),
            ...metadataUpdates,
        };
    }
    if (typeof body.password === "string" && body.password.trim().length) {
        passwordUpdate = body.password.trim();
    }
    const hasAddressesField = Object.prototype.hasOwnProperty.call(payload, "addresses");
    if (!Object.keys(updateData).length &&
        !hasAddressesField) {
        return res.status(400).json({
            message: "Provide customer fields or addresses to update.",
        });
    }
    try {
        if (Object.keys(updateData).length) {
            await (0, customer_auth_1.updateCustomerRecord)(req.scope, context.customer.id, updateData);
        }
        if (passwordUpdate) {
            await (0, customer_auth_1.ensureEmailPasswordIdentity)(req.scope, context.email, passwordUpdate, context.customer.id);
        }
        if (hasAddressesField) {
            const addressesArray = Array.isArray(payload.addresses)
                ? payload.addresses
                : [];
            await syncCustomerAddresses(context.customer.id, addressesArray);
        }
        const updatedCustomer = await fetchCustomerByEmail(context.email);
        if (!updatedCustomer) {
            throw new Error("Updated customer could not be reloaded.");
        }
        const addresses = await fetchCustomerAddresses(context.customer.id);
        return res.json(buildMagentoCustomerPayload(updatedCustomer, addresses));
    }
    catch (error) {
        return res.status(500).json({
            message: error?.message || "Failed to update customer profile.",
        });
    }
};
exports.PUT = PUT;
const DELETE = async (req, res) => {
    setCors(req, res);
    let context;
    try {
        context = await resolveCustomerContext(req);
    }
    catch (error) {
        return handleContextError(res, error);
    }
    try {
        await softDeleteCustomer(context.customer.id);
        return res.json(true);
    }
    catch (error) {
        return res.status(500).json({
            message: error?.message || "Failed to delete customer.",
        });
    }
};
exports.DELETE = DELETE;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvY3VzdG9tZXJzL21lL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUFrRDtBQUVsRCxvRUFHeUM7QUFDekMsOENBQXVFO0FBRXZFLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDMUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztTQUFNLENBQUM7UUFDTixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRCxHQUFHLENBQUMsTUFBTSxDQUNSLDhCQUE4QixFQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO1FBQzNDLDZCQUE2QixDQUNoQyxDQUFBO0lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSx3QkFBd0IsQ0FBQyxDQUFBO0lBQ3BFLEdBQUcsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDeEQsQ0FBQyxDQUFBO0FBRUQsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEtBQWEsRUFBOEIsRUFBRTtJQUNyRSxJQUFJLENBQUM7UUFDSCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzlCLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN2QixPQUFPLElBQUksQ0FB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