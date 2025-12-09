"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const utils_1 = require("@medusajs/framework/utils");
const customer_auth_1 = require("../../../../lib/customer-auth");
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
    res.header("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const mapCustomAttributes = (attributes) => {
    if (!Array.isArray(attributes)) {
        return {};
    }
    return attributes.reduce((acc, attr) => {
        if (attr?.attribute_code) {
            acc[attr.attribute_code] = attr.value;
        }
        return acc;
    }, {});
};
const POST = async (req, res) => {
    setCors(req, res);
    const body = req.body;
    const payload = body.customer || {};
    const email = (payload.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();
    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }
    if (!password) {
        return res.status(400).json({ message: "Password is required." });
    }
    const firstName = payload.firstname || payload.first_name || "";
    const lastName = payload.lastname || payload.last_name || "";
    const scope = req.scope;
    const customAttributesMap = mapCustomAttributes(payload.custom_attributes);
    let customer;
    try {
        customer = await (0, customer_auth_1.createCustomerRecord)(scope, {
            email,
            first_name: firstName,
            last_name: lastName,
            metadata: {
                magento_custom_attributes: customAttributesMap,
                magento_payload_snapshot: {
                    store_id: payload.store_id ?? null,
                    website_id: payload.website_id ?? null,
                    prefix: payload.prefix ?? null,
                    suffix: payload.suffix ?? null,
                },
            },
        });
    }
    catch (error) {
        if (error instanceof utils_1.MedusaError &&
            error.type === utils_1.MedusaError.Types.DUPLICATE_ERROR) {
            return res.status(400).json({
                message: "A customer with the same email already exists.",
            });
        }
        return res.status(500).json({
            message: error?.message ?? "Unexpected error while creating the customer.",
        });
    }
    try {
        await (0, customer_auth_1.ensureEmailPasswordIdentity)(scope, email, password, customer.id);
    }
    catch (error) {
        await (0, customer_auth_1.deleteCustomerIfExists)(scope, customer.id);
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error registering customer credentials.",
        });
    }
    const response = {
        id: customer.id,
        group_id: payload.group_id ?? 0,
        default_billing: payload.default_billing ?? "0",
        default_shipping: payload.default_shipping ?? "0",
        confirmation: null,
        created_at: customer.created_at?.toISOString?.() ?? new Date().toISOString(),
        updated_at: customer.updated_at?.toISOString?.() ?? new Date().toISOString(),
        created_in: "Medusa",
        dob: null,
        email: customer.email,
        firstname: customer.first_name ?? firstName,
        lastname: customer.last_name ?? lastName,
        middlename: payload.middlename ?? null,
        prefix: payload.prefix ?? null,
        suffix: payload.suffix ?? null,
        gender: payload.gender ?? 0,
        store_id: payload.store_id ?? 1,
        website_id: payload.website_id ?? 1,
        addresses: payload.addresses ?? [],
        disable_auto_group_change: payload.disable_auto_group_change ?? 0,
        extension_attributes: payload.extension_attributes ?? {},
        custom_attributes: payload.custom_attributes ?? [],
    };
    return res.status(200).json(response);
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvY3VzdG9tZXJzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHFEQUF1RDtBQUd2RCxpRUFJc0M7QUEwQnRDLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDMUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztTQUFNLENBQUM7UUFDTixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRCxHQUFHLENBQUMsTUFBTSxDQUNSLDhCQUE4QixFQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO1FBQzNDLDZCQUE2QixDQUNoQyxDQUFBO0lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxjQUFjLENBQUMsQ0FBQTtJQUMxRCxHQUFHLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3hELENBQUMsQ0FBQTtBQUVNLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUN2RSxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2pCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDeEIsQ0FBQyxDQUFBO0FBSFksUUFBQSxPQUFPLFdBR25CO0FBRUQsTUFB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