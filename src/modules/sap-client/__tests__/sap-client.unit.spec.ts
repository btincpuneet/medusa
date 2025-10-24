import type { AxiosResponse } from "axios"
import { createSapClient } from ".."

const createMockAdapter = (collector: Array<any>) => {
  return async (config: any): Promise<AxiosResponse> => {
    collector.push(config)
    return {
      data: {},
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }
  }
}

describe("createSapClient", () => {
  const baseConfig = {
    apiUrl: "https://sap.example/api",
    clientId: "GENERAL_ID",
    clientSecret: "GENERAL_SECRET",
    invoiceApiUrl: "https://sap.example/invoice",
    invoicePdfApiUrl: "https://sap.example/invoice-pdf",
    invoiceClientId: "INVOICE_ID",
    invoiceClientSecret: "INVOICE_SECRET",
  }

  it("applies general headers to default axios instance", async () => {
    const captured: any[] = []
    const client = createSapClient({
      config: baseConfig,
      axiosConfig: {
        adapter: createMockAdapter(captured),
      },
    })

    await client.request({ method: "GET", url: "/health" })

    expect(captured).toHaveLength(1)
    expect(captured[0].headers).toMatchObject({
      ClientId: baseConfig.clientId,
      ClientSecret: baseConfig.clientSecret,
    })
    expect(captured[0].baseURL).toBe("https://sap.example/api/")
  })

  it("uses invoice credentials when fetching invoice metadata", async () => {
    const captured: any[] = []
    const client = createSapClient({
      config: baseConfig,
      axiosConfig: {
        adapter: createMockAdapter(captured),
      },
    })

    await client.fetchInvoice({
      salesOrder: "SO-123",
      companyCode: "COMP-1",
    })

    expect(captured).toHaveLength(1)
    expect(captured[0].headers).toMatchObject({
      Client_Id: baseConfig.invoiceClientId,
      Client_Secret: baseConfig.invoiceClientSecret,
      "Content-Type": "application/json",
    })
    expect(captured[0].data).toEqual(
      JSON.stringify({
        Customer: "",
        SalesOrg: "COMP-1",
        SalesOrder: "SO-123",
        FromDate: "",
        ToDate: "",
      })
    )
  })

  it("builds invoice PDF query parameters correctly", async () => {
    const captured: any[] = []
    const client = createSapClient({
      config: baseConfig,
      axiosConfig: {
        adapter: createMockAdapter(captured),
      },
    })

    await client.fetchInvoicePdf("INV-1", "2024-12-01", "COMP-1")

    expect(captured).toHaveLength(1)
    expect(captured[0].url).toBe(
      "?InvoiceNo=INV-1&CompanyCode=COMP-1&InvoiceDate=2024-12-01"
    )
  })
})
