"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthModuleService = exports.updateCustomerRecord = exports.createCustomerRecord = exports.deleteCustomerIfExists = exports.ensureEmailPasswordIdentity = exports.findRegisteredCustomerByEmail = void 0;
const utils_1 = require("@medusajs/framework/utils");
const EMAILPASS_PROVIDER = "emailpass";
const normalizeEmail = (value) => (value || "").trim().toLowerCase();
const resolveCustomerModule = (scope) => {
    try {
        return scope.resolve(utils_1.Modules.CUSTOMER);
    }
    catch (error) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, "Customer module is not registered. Make sure '@medusajs/customer' is enabled in medusa-config.js.");
    }
};
const resolveAuthModule = (scope) => {
    try {
        return scope.resolve(utils_1.Modules.AUTH);
    }
    catch (error) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, "Auth module is not registered. Make sure '@medusajs/auth' (emailpass provider) is enabled.");
    }
};
const findRegisteredCustomerByEmail = async (scope, email) => {
    const service = resolveCustomerModule(scope);
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        return null;
    }
    const selector = {
        email: normalizedEmail,
        has_account: true,
    };
    let customers = await service.listCustomers(selector);
    if (customers[0]) {
        return customers[0];
    }
    // Some migrated customers still have upper-case emails stored in Magento's format.
    // Retry with a case-insensitive match so password resets and logins keep working.
    const fallbackSelector = {
        has_account: true,
        email: { $ilike: normalizedEmail },
    };
    customers = await service.listCustomers(fallbackSelector);
    if (!customers.length) {
        return null;
    }
    return (customers.find((customer) => customer.email?.trim().toLowerCase() === normalizedEmail) || customers[0]);
};
exports.findRegisteredCustomerByEmail = findRegisteredCustomerByEmail;
const getAuthIdentityId = (provider) => provider.auth_identity_id ?? provider.auth_identity?.id;
const ensureAppMetadata = async (authModule, provider, customerId) => {
    if (!customerId) {
        return;
    }
    const authIdentityId = getAuthIdentityId(provider);
    if (!authIdentityId) {
        return;
    }
    let appMetadata = provider.auth_identity?.app_metadata ??
        (await authModule.retrieveAuthIdentity(authIdentityId).catch(() => null))?.app_metadata ??
        {};
    if (appMetadata.customer_id === customerId) {
        return;
    }
    await authModule.updateAuthIdentities({
        id: authIdentityId,
        app_metadata: {
            ...appMetadata,
            customer_id: customerId,
        },
    });
};
const ensureEmailPasswordIdentity = async (scope, email, password, customerId) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "A valid email is required to register credentials.");
    }
    const authModule = resolveAuthModule(scope);
    const existingIdentities = await authModule.listProviderIdentities({
        provider: EMAILPASS_PROVIDER,
        entity_id: normalizedEmail,
    });
    const providerIdentity = existingIdentities[0];
    if (!providerIdentity) {
        const registration = await authModule.register(EMAILPASS_PROVIDER, {
            body: { email: normalizedEmail, password },
        });
        if (!registration?.success || !registration.authIdentity?.id) {
            const message = registration?.error ??
                "Unable to register email/password credentials for the customer.";
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, message);
        }
        await authModule.updateAuthIdentities({
            id: registration.authIdentity.id,
            app_metadata: {
                ...(registration.authIdentity.app_metadata ?? {}),
                customer_id: customerId,
            },
        });
        return;
    }
    await authModule.updateProvider(EMAILPASS_PROVIDER, {
        entity_id: normalizedEmail,
        password,
    });
    await ensureAppMetadata(authModule, providerIdentity, customerId);
};
exports.ensureEmailPasswordIdentity = ensureEmailPasswordIdentity;
const deleteCustomerIfExists = async (scope, customerId) => {
    if (!customerId) {
        return;
    }
    const service = resolveCustomerModule(scope);
    await service.deleteCustomers(customerId).catch(() => undefined);
};
exports.deleteCustomerIfExists = deleteCustomerIfExists;
const createCustomerRecord = async (scope, data) => {
    const service = resolveCustomerModule(scope);
    const customer = await service.createCustomers({
        ...data,
        has_account: data.has_account ?? true,
    });
    return customer;
};
exports.createCustomerRecord = createCustomerRecord;
const updateCustomerRecord = async (scope, customerId, data) => {
    const service = resolveCustomerModule(scope);
    return service.updateCustomers(customerId, data);
};
exports.updateCustomerRecord = updateCustomerRecord;
const getAuthModuleService = (scope) => resolveAuthModule(scope);
exports.getAuthModuleService = getAuthModuleService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tZXItYXV0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvY3VzdG9tZXItYXV0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxREFBZ0U7QUFPaEUsTUFBTSxrQkFBa0IsR0FBRyxXQUFXLENBQUE7QUFFdEMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFxQixFQUFFLEVBQUUsQ0FDL0MsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFcEMsTUFBTSxxQkFBcUIsR0FBRyxDQUM1QixLQUFzQixFQUNFLEVBQUU7SUFDMUIsSUFBSSxDQUFDO1FBQ0gsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxRQUFRLENBQTJCLENBQUE7SUFDbEUsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixNQUFNLElBQUksbUJBQVcsQ0FDbkIsbUJBQVcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQ2xDLG1HQUFtRyxDQUNwRyxDQUFBO0lBQ0gsQ0FBQztBQUNILENBQUMsQ0FBQTtBQUVELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxLQUFzQixFQUFzQixFQUFFO0lBQ3ZFLElBQUksQ0FBQztRQUNILE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUF1QixDQUFBO0lBQzFELENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsTUFBTSxJQUFJLG1CQUFXLENBQ25CLG1CQUFXLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUNsQyw0RkFBNEYsQ0FDN0YsQ0FBQTtJQUNILENBQUM7QUFDSCxDQUFDLENBQUE7QUFFTSxNQUFNLDZCQUE2QixHQUFHLEtBQUssRUFDaEQsS0FBc0IsRUFDdEIsS0FBYSxFQUNiLEVBQUU7SUFDRixNQUFNLE9BQU8sR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMs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