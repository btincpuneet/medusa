// Redington configuration bridge
//
// This module mirrors the custom Magento configuration screens found under
// B2C/app/code/Redington/**/etc/adminhtml/system.xml.
// Each setting is exposed as an environment variable so the Medusa stack can
// consume the same values without hard-coding Magento dependencies.

type Nullable<T> = T | null | undefined

const truthyValues = new Set(["1", "true", "yes", "on"])

const readEnv = (key: string): string | undefined => {
  const raw = process.env[key]
  if (!raw) {
    return undefined
  }
  const trimmed = raw.trim()
  return trimmed.length ? trimmed : undefined
}

const readBool = (key: string, fallback = false): boolean => {
  const raw = readEnv(key)
  if (!raw) {
    return fallback
  }
  return truthyValues.has(raw.toLowerCase())
}

const readNumber = (key: string, fallback?: number): number | undefined => {
  const raw = readEnv(key)
  if (!raw) {
    return fallback
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

const readList = (
  key: string,
  options: { separator?: RegExp; fallback?: string[] } = {}
): string[] => {
  const raw = readEnv(key)
  if (!raw) {
    return options.fallback ?? []
  }
  const separator = options.separator ?? /[,\n]+/
  return raw
    .split(separator)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export type RedingtonConfig = {
  product: {
    disableDefaultStock: boolean
    domainStockControlEnabled: boolean
    domainAuthenticationEnabled: boolean
    maxOrderDurationMonths?: number
    restrictedCategoryId?: string
  }
  enquiries: {
    getInTouchReceiver?: string
    outOfStock: {
      requestTemplate?: string
      notifyTemplate?: string
      requestSubject?: string
      notifySubject?: string
      senderIdentity?: string
    }
  }
  payment: {
    apiUrl?: string
    username?: string
    password?: string
    availableMethods: string[]
  }
  sap: {
    domain?: string
    ksaCompanyCode?: string
    notificationRecipients: string[]
    apiUrl?: string
    clientId?: string
    clientSecret?: string
    customerNumber?: string
    invoiceApiUrl?: string
    invoiceClientId?: string
    invoiceClientSecret?: string
    invoicePdfApiUrl?: string
  }
  guestUsers: {
    allowedDomains: string[]
  }
  smsOtp: {
    enabled: boolean
    apiUrl?: string
    clientId?: string
    clientSecret?: string
    senderId?: string
    application?: string
    otpText?: string
  }
}

const buildRedingtonConfig = (): RedingtonConfig => {
  return {
    product: {
      disableDefaultStock: readBool("REDINGTON_PRODUCT_DISABLE_DEFAULT_STOCK"),
      domainStockControlEnabled: readBool(
        "REDINGTON_DOMAIN_STOCK_CONTROL_ENABLED"
      ),
      domainAuthenticationEnabled: readBool(
        "REDINGTON_DOMAIN_AUTH_ENABLED"
      ),
      maxOrderDurationMonths: readNumber(
        "REDINGTON_PRODUCT_MAX_ORDER_DURATION"
      ),
      restrictedCategoryId: readEnv("REDINGTON_PRODUCT_CATEGORY_ROOT_ID"),
    },
    enquiries: {
      getInTouchReceiver: readEnv("REDINGTON_GET_IN_TOUCH_EMAIL"),
      outOfStock: {
        requestTemplate: readEnv(
          "REDINGTON_STOCK_ENQUIRY_EMAIL_TEMPLATE"
        ),
        notifyTemplate: readEnv(
          "REDINGTON_STOCK_ENQUIRY_NOTIFY_TEMPLATE"
        ),
        requestSubject: readEnv(
          "REDINGTON_STOCK_ENQUIRY_EMAIL_SUBJECT"
        ),
        notifySubject: readEnv(
          "REDINGTON_STOCK_ENQUIRY_NOTIFY_SUBJECT"
        ),
        senderIdentity: readEnv("REDINGTON_STOCK_ENQUIRY_EMAIL_SENDER"),
      },
    },
    payment: {
      apiUrl: readEnv("REDINGTON_PAYMENT_API_URL"),
      username: readEnv("REDINGTON_PAYMENT_USERNAME"),
      password: readEnv("REDINGTON_PAYMENT_PASSWORD"),
      availableMethods: readList("REDINGTON_AVAILABLE_PAYMENT_METHODS"),
    },
    sap: {
      domain: readEnv("REDINGTON_SAP_DOMAIN"),
      ksaCompanyCode: readEnv("REDINGTON_SAP_KSA_COMPANY_CODE"),
      notificationRecipients: readList(
        "REDINGTON_SAP_NOTIFICATION_RECIPIENTS"
      ),
      apiUrl: readEnv("REDINGTON_SAP_API_URL"),
      clientId: readEnv("REDINGTON_SAP_API_CLIENT_ID"),
      clientSecret: readEnv("REDINGTON_SAP_API_CLIENT_SECRET"),
      customerNumber: readEnv("REDINGTON_SAP_CUSTOMER_NUMBER"),
      invoiceApiUrl: readEnv("REDINGTON_SAP_INVOICE_API_URL"),
      invoiceClientId: readEnv("REDINGTON_SAP_INVOICE_CLIENT_ID"),
      invoiceClientSecret: readEnv("REDINGTON_SAP_INVOICE_CLIENT_SECRET"),
      invoicePdfApiUrl: readEnv("REDINGTON_SAP_INVOICE_PDF_API_URL"),
    },
    guestUsers: {
      allowedDomains: readList("REDINGTON_GUEST_ALLOWED_DOMAINS", {
        separator: /[\n,]+/,
      }),
    },
    smsOtp: {
      enabled: readBool("REDINGTON_SMS_ENABLE_OTP"),
      apiUrl: readEnv("REDINGTON_SMS_API_URL"),
      clientId: readEnv("REDINGTON_SMS_CLIENT_ID"),
      clientSecret: readEnv("REDINGTON_SMS_CLIENT_SECRET"),
      senderId: readEnv("REDINGTON_SMS_SENDER_ID"),
      application: readEnv("REDINGTON_SMS_APPLICATION"),
      otpText: readEnv("REDINGTON_SMS_OTP_TEXT"),
    },
  }
}

// Snapshot of the Redington configuration derived from environment variables.
// Call buildRedingtonConfig() if you need to re-evaluate during runtime.
export const redingtonConfig = buildRedingtonConfig()

export { buildRedingtonConfig }
