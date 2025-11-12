import type { AwilixContainer } from "awilix"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import type {
  IAuthModuleService,
  ICustomerModuleService,
  ProviderIdentityDTO,
} from "@medusajs/types"

const EMAILPASS_PROVIDER = "emailpass"

const normalizeEmail = (value?: string | null) =>
  (value || "").trim().toLowerCase()

const resolveCustomerModule = (
  scope: AwilixContainer
): ICustomerModuleService => {
  try {
    return scope.resolve(Modules.CUSTOMER) as ICustomerModuleService
  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Customer module is not registered. Make sure '@medusajs/customer' is enabled in medusa-config.js."
    )
  }
}

const resolveAuthModule = (scope: AwilixContainer): IAuthModuleService => {
  try {
    return scope.resolve(Modules.AUTH) as IAuthModuleService
  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Auth module is not registered. Make sure '@medusajs/auth' (emailpass provider) is enabled."
    )
  }
}

export const findRegisteredCustomerByEmail = async (
  scope: AwilixContainer,
  email: string
) => {
  const service = resolveCustomerModule(scope)
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    return null
  }

  const customers = await service.listCustomers({
    email: normalizedEmail,
    has_account: true,
  })

  return customers[0] ?? null
}

const getAuthIdentityId = (provider: ProviderIdentityDTO) =>
  provider.auth_identity_id ?? provider.auth_identity?.id

const ensureAppMetadata = async (
  authModule: IAuthModuleService,
  provider: ProviderIdentityDTO,
  customerId?: string
) => {
  if (!customerId) {
    return
  }

  const authIdentityId = getAuthIdentityId(provider)
  if (!authIdentityId) {
    return
  }

  let appMetadata =
    provider.auth_identity?.app_metadata ??
    (
      await authModule.retrieveAuthIdentity(authIdentityId).catch(() => null)
    )?.app_metadata ??
    {}

  if (appMetadata.customer_id === customerId) {
    return
  }

  await authModule.updateAuthIdentities({
    id: authIdentityId,
    app_metadata: {
      ...appMetadata,
      customer_id: customerId,
    },
  })
}

export const ensureEmailPasswordIdentity = async (
  scope: AwilixContainer,
  email: string,
  password: string,
  customerId?: string
) => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A valid email is required to register credentials."
    )
  }

  const authModule = resolveAuthModule(scope)

  const existingIdentities = await authModule.listProviderIdentities({
    provider: EMAILPASS_PROVIDER,
    entity_id: normalizedEmail,
  })
  const providerIdentity = existingIdentities[0]

  if (!providerIdentity) {
    const registration = await authModule.register(EMAILPASS_PROVIDER, {
      body: { email: normalizedEmail, password },
    })

    if (!registration?.success || !registration.authIdentity?.id) {
      const message =
        registration?.error ??
        "Unable to register email/password credentials for the customer."
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message)
    }

    await authModule.updateAuthIdentities({
      id: registration.authIdentity.id,
      app_metadata: {
        ...(registration.authIdentity.app_metadata ?? {}),
        customer_id: customerId,
      },
    })
    return
  }

  await authModule.updateProvider(EMAILPASS_PROVIDER, {
    entity_id: normalizedEmail,
    password,
  })

  await ensureAppMetadata(authModule, providerIdentity, customerId)
}

export const deleteCustomerIfExists = async (
  scope: AwilixContainer,
  customerId?: string
) => {
  if (!customerId) {
    return
  }
  const service = resolveCustomerModule(scope)
  await service.deleteCustomers(customerId).catch(() => undefined)
}

export const createCustomerRecord = async (
  scope: AwilixContainer,
  data: Parameters<ICustomerModuleService["createCustomers"]>[0]
) => {
  const service = resolveCustomerModule(scope)
  const customer = await service.createCustomers({
    ...data,
    has_account: data.has_account ?? true,
  })
  return customer
}

export const updateCustomerRecord = async (
  scope: AwilixContainer,
  customerId: string,
  data: Parameters<ICustomerModuleService["updateCustomers"]>[1]
) => {
  const service = resolveCustomerModule(scope)
  return service.updateCustomers(customerId, data)
}

export const getAuthModuleService = (scope: AwilixContainer) =>
  resolveAuthModule(scope)
