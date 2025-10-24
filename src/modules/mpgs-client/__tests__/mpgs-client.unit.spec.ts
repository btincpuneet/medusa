import type { AxiosResponse } from "axios"
import { createMpgsClient } from ".."

const captureAdapter = (collector: Array<any>) => {
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

describe("createMpgsClient", () => {
  const overrides = {
    apiUrl: "https://mpgs.example/api/rest/version/66/merchant",
    merchantId: "TEST_MERCHANT",
    password: "secret",
  }

  it("appends merchant id to base URL and configures basic auth", async () => {
    const captured: any[] = []
    const client = createMpgsClient({
      config: overrides,
      axiosConfig: {
        adapter: captureAdapter(captured),
      },
    })

    await client.request({ method: "GET", url: "/ping" })

    expect(captured).toHaveLength(1)
    expect(captured[0].baseURL).toBe(
      "https://mpgs.example/api/rest/version/66/merchant/TEST_MERCHANT"
    )
    expect(captured[0].auth).toEqual({
      username: `merchant.${overrides.merchantId}`,
      password: overrides.password,
    })
  })

  it("creates checkout session payload with defaults", async () => {
    const captured: any[] = []
    const client = createMpgsClient({
      config: overrides,
      axiosConfig: {
        adapter: captureAdapter(captured),
      },
    })

    await client.createCheckoutSession({
      amount: 120.5,
      currency: "SAR",
      orderId: "ORDER-1",
      returnUrl: "https://store/return",
    })

    expect(captured).toHaveLength(1)
    expect(captured[0].url).toBe("/session")
    expect(JSON.parse(captured[0].data)).toMatchObject({
      apiOperation: "INITIATE_CHECKOUT",
      interaction: {
        operation: "PURCHASE",
        returnUrl: "https://store/return",
      },
      order: {
        amount: 120.5,
        currency: "SAR",
        id: "ORDER-1",
        reference: "OrderRefORDER-1",
      },
      transaction: {
        reference: "TxnRefORDER-1",
      },
    })
  })
})
