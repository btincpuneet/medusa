import axios, {
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios"
import { buildRedingtonConfig, RedingtonConfig } from "../redington-config"

type SapClientConfig = {
  apiUrl: string
  clientId: string
  clientSecret: string
  invoiceApiUrl: string
  invoicePdfApiUrl: string
  invoiceClientId: string
  invoiceClientSecret: string
}

type SapClientOptions = {
  config?: Partial<SapClientConfig>
  axiosConfig?: AxiosRequestConfig
}

type SapInvoiceRequest = {
  salesOrder: string
  companyCode: string
}

type SapInvoiceResponse = AxiosResponse<any>

type SapInvoicePdfResponse = AxiosResponse<any>

type SapVatResponse = AxiosResponse<any>

type SapProductSyncResponse = AxiosResponse<any>

type SapCustomerSyncResponse = AxiosResponse<any>

const normalizeUrl = (url: string): string => {
  if (!url) {
    return ""
  }
  return url.endsWith("/") ? url : `${url}/`
}

const toSapClientConfig = (cfg: RedingtonConfig): SapClientConfig => ({
  apiUrl: cfg.sap.apiUrl ?? "",
  clientId: cfg.sap.clientId ?? "",
  clientSecret: cfg.sap.clientSecret ?? "",
  invoiceApiUrl: cfg.sap.invoiceApiUrl ?? "",
  invoicePdfApiUrl: cfg.sap.invoicePdfApiUrl ?? "",
  invoiceClientId: cfg.sap.invoiceClientId ?? cfg.sap.clientId ?? "",
  invoiceClientSecret:
    cfg.sap.invoiceClientSecret ?? cfg.sap.clientSecret ?? "",
})

const applyGeneralHeaders = (
  instance: AxiosInstance,
  config: SapClientConfig
) => {
  instance.interceptors.request.use((request) => {
    const headers =
      request.headers instanceof AxiosHeaders
        ? request.headers
        : new AxiosHeaders(request.headers ?? {})

    headers.set("Content-Type", "application/json")
    headers.set("ClientId", config.clientId)
    headers.set("ClientSecret", config.clientSecret)

    request.headers = headers
    return request
  })
}

const applyInvoiceHeaders = (
  instance: AxiosInstance,
  config: SapClientConfig
) => {
  instance.interceptors.request.use((request) => {
    const headers =
      request.headers instanceof AxiosHeaders
        ? request.headers
        : new AxiosHeaders(request.headers ?? {})

    headers.set("Content-Type", "application/json")
    headers.set("Client_Id", config.invoiceClientId)
    headers.set("Client_Secret", config.invoiceClientSecret)

    request.headers = headers
    return request
  })
}

export type SapClient = ReturnType<typeof createSapClient>

export const createSapClient = ({
  config: overrides = {},
  axiosConfig = {},
}: SapClientOptions = {}) => {
  const envConfig = toSapClientConfig(buildRedingtonConfig())
  const config: SapClientConfig = {
    ...envConfig,
    ...overrides,
  }

  const generalAxios = axios.create({
    baseURL: normalizeUrl(config.apiUrl),
    ...axiosConfig,
  })
  applyGeneralHeaders(generalAxios, config)

  const invoiceAxios = axios.create({
    baseURL: normalizeUrl(config.invoiceApiUrl),
    ...axiosConfig,
  })
  applyInvoiceHeaders(invoiceAxios, config)

  const invoicePdfAxios = axios.create({
    baseURL: normalizeUrl(config.invoicePdfApiUrl),
    ...axiosConfig,
  })
  applyInvoiceHeaders(invoicePdfAxios, config)

  const postGeneral = <T = any>(
    path: string,
    payload: unknown,
    requestConfig: AxiosRequestConfig = {}
  ) => generalAxios.post<T>(path, payload, requestConfig)

  return {
    axios: generalAxios,
    invoiceAxios,
    invoicePdfAxios,

    request: generalAxios.request.bind(generalAxios),

    fetchInvoice: ({
      salesOrder,
      companyCode,
    }: SapInvoiceRequest): Promise<SapInvoiceResponse> => {
      const payload = {
        Customer: "",
        SalesOrg: companyCode,
        SalesOrder: salesOrder,
        FromDate: "",
        ToDate: "",
      }
      return invoiceAxios.post("", payload)
    },

    fetchInvoicePdf: (
      invoiceNo: string,
      invoiceDate: string,
      companyCode: string
    ): Promise<SapInvoicePdfResponse> => {
      const query = new URLSearchParams({
        InvoiceNo: invoiceNo,
        CompanyCode: companyCode,
        InvoiceDate: invoiceDate,
      })
      return invoicePdfAxios.post(`?${query.toString()}`, {})
    },

    calculateVat: (
      companyCode: string,
      totalPrice: number
    ): Promise<SapVatResponse> => {
      const payload = {
        Company_Code: companyCode,
        Total_Price: totalPrice,
      }
      return postGeneral("CalculateVat", payload)
    },

    createProduct: (
      companyCode: string,
      sku: string
    ): Promise<SapProductSyncResponse> => {
      const payload = {
        Im_Application: "B2C",
        Im_Indicator: "",
        Status: "SET",
        ATPItems: [
          {
            Companycode: companyCode,
            Material: sku,
          },
        ],
      }
      return postGeneral("SystemATP", payload)
    },

    createCustomer: (email: string): Promise<SapCustomerSyncResponse> => {
      const payload = {
        Email: email,
        Source: "B2C",
      }
      return postGeneral("CreateCustomer", payload)
    },
  }
}

export default createSapClient
