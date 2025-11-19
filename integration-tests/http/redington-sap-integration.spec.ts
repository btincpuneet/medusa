import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import http from "node:http"

const SAP_PORT = 4115
const SAP_HOST = "127.0.0.1"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    REDINGTON_SAP_API_URL: `http://${SAP_HOST}:${SAP_PORT}/`,
    REDINGTON_SAP_API_CLIENT_ID: "INTEGRATION_ID",
    REDINGTON_SAP_API_CLIENT_SECRET: "INTEGRATION_SECRET",
    REDINGTON_SAP_INVOICE_API_URL: `http://${SAP_HOST}:${SAP_PORT}/invoice`,
    REDINGTON_SAP_INVOICE_PDF_API_URL: `http://${SAP_HOST}:${SAP_PORT}/invoice-pdf`,
  },
  testSuite: ({ api }) => {
    let server: http.Server

    beforeAll((done) => {
      server = http.createServer((req, res) => {
        const { method, url } = req
        const respond = (status: number, payload: any) => {
          res.writeHead(status, { "Content-Type": "application/json" })
          res.end(JSON.stringify(payload))
        }

        if (method === "GET" && url === "/health") {
          return respond(200, { Status: "PASS" })
        }

        if (method === "POST" && url === "/CreateOrder") {
          return respond(200, { Status: "PASS", OrderNo: "SAP-ORDER-1" })
        }

        if (method === "POST" && url === "/SystemATP") {
          return respond(200, { Status: "PASS", ATPItems: [] })
        }

        return respond(200, { Status: "PASS" })
      })
      server.listen(SAP_PORT, SAP_HOST, done)
    })

    afterAll((done) => {
      server.close(done)
    })

    describe("Redington SAP Integration API", () => {
      it("returns default configuration", async () => {
        const response = await api.get(
          "/admin/redington/sap-integration"
        )
        expect(response.status).toBe(200)
        expect(response.data.config.api_url).toContain(
          `http://${SAP_HOST}:${SAP_PORT}`
        )
      })

      it("updates configuration, tests connection, and queues sync", async () => {
        const update = await api.put("/admin/redington/sap-integration", {
          api_url: `http://${SAP_HOST}:${SAP_PORT}/`,
          client_id: "API_ID",
          client_secret: "API_SECRET",
          notification_emails: ["ops@example.com"],
        })
        expect(update.status).toBe(200)
        expect(update.data.config.client_id).toBe("API_ID")

        const testResponse = await api.post(
          "/admin/redington/sap-integration/test"
        )
        expect(testResponse.status).toBe(200)
        expect(testResponse.data.ok).toBe(true)

        const syncResponse = await api.post(
          "/admin/redington/sap-integration/sync",
          {
            order_id: null,
          }
        )
        expect(syncResponse.status).toBe(202)
      })
    })
  },
})
