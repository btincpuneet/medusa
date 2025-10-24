import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios"
import { buildRedingtonConfig } from "../redington-config"

type MpgsClientConfig = {
  apiUrl: string
  merchantId: string
  password: string
}

type MpgsClientOptions = {
  config?: Partial<MpgsClientConfig>
  axiosConfig?: AxiosRequestConfig
}

type CheckoutSessionArgs = {
  amount: number
  currency: string
  orderId: string
  orderReference?: string
  transactionReference?: string
  returnUrl: string
  interactionOperation?: "PURCHASE" | "AUTHORIZE"
  additionalData?: Record<string, unknown>
}

type CheckoutSessionResponse = AxiosResponse<any>

type PaymentStatusResponse = AxiosResponse<any>

const normalizeBaseUrl = (url: string): string => {
  if (!url) {
    return ""
  }
  return url.endsWith("/") ? url.slice(0, -1) : url
}

const toMpgsConfig = (): MpgsClientConfig => {
  const config = buildRedingtonConfig()
  return {
    apiUrl: config.payment.apiUrl ?? "",
    merchantId: config.payment.username ?? "",
    password: config.payment.password ?? "",
  }
}

export type MpgsClient = ReturnType<typeof createMpgsClient>

export const createMpgsClient = ({
  config: overrides = {},
  axiosConfig = {},
}: MpgsClientOptions = {}) => {
  const envConfig = toMpgsConfig()
  const config: MpgsClientConfig = {
    ...envConfig,
    ...overrides,
  }

  const baseUrl = `${normalizeBaseUrl(config.apiUrl)}/${config.merchantId}`

  const axiosInstance: AxiosInstance = axios.create({
    baseURL: baseUrl,
    auth: {
      username: `merchant.${config.merchantId}`,
      password: config.password,
    },
    headers: {
      "Content-Type": "application/json",
    },
    ...axiosConfig,
  })

  return {
    axios: axiosInstance,

    request: axiosInstance.request.bind(axiosInstance),

    createCheckoutSession: ({
      amount,
      currency,
      orderId,
      orderReference = `OrderRef${orderId}`,
      transactionReference = `TxnRef${orderId}`,
      returnUrl,
      interactionOperation = "PURCHASE",
      additionalData = {},
    }: CheckoutSessionArgs): Promise<CheckoutSessionResponse> => {
      const payload = {
        apiOperation: "INITIATE_CHECKOUT",
        interaction: {
          operation: interactionOperation,
          returnUrl,
        },
        order: {
          amount,
          currency,
          id: orderId,
          reference: orderReference,
        },
        transaction: {
          reference: transactionReference,
        },
        ...additionalData,
      }

      return axiosInstance.post("/session", payload)
    },

    getPaymentStatus: (
      sessionId: string
    ): Promise<PaymentStatusResponse> => {
      return axiosInstance.get(`/session/${encodeURIComponent(sessionId)}`)
    },
  }
}

export default createMpgsClient
