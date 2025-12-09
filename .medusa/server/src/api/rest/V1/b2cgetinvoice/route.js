"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const sap_client_1 = __importDefault(require("../../../../modules/sap-client"));
const redington_config_1 = require("../../../../modules/redington-config");
const pg_1 = require("../../../../lib/pg");
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
const extractInvoiceEntry = (salesOrder, payload) => {
    if (!payload) {
        return null;
    }
    const invoices = Array.isArray(payload.Invoices) && payload.Invoices.length
        ? payload.Invoices
        : Array.isArray(payload[0])
            ? payload[0]
            : [];
    const matcher = (entry) => {
        const soNumber = entry?.Sonumber ??
            entry?.SoNumber ??
            entry?.salesOrder ??
            entry?.SalesOrder ??
            entry?.OrderNo;
        if (!soNumber) {
            return false;
        }
        return String(soNumber).trim().toLowerCase() === salesOrder.toLowerCase();
    };
    const record = invoices.find(matcher) ??
        (Array.isArray(invoices) && invoices.length ? invoices[0] : null);
    if (!record) {
        return null;
    }
    return {
        invoiceNo: record.Invoiceno ??
            record.InvoiceNo ??
            record.invoiceNo ??
            record.invoice_number ??
            record.InvoiceNumber,
        invoiceDate: record.Invoicedate ??
            record.InvoiceDate ??
            record.invoiceDate ??
            record.invoice_date,
    };
};
const POST = async (req, res) => {
    setCors(req, res);
    const body = (req.body || {});
    const salesOrder = (body.sales_order || "").trim();
    let companyCode = (body.company_code || "").trim() ||
        redington_config_1.redingtonConfig.sap.customerNumber ||
        "";
    if (!salesOrder) {
        await (0, pg_1.recordInvoiceAudit)({
            order_id: body.order_id ?? null,
            success: false,
            message: "sales_order is required",
            payload: { body },
        });
        return res.status(400).json({
            success: false,
            message: "sales_order is required",
        });
    }
    const sapClient = (0, sap_client_1.default)();
    let invoiceNumber = body.invoice_number?.trim();
    let invoiceDate = body.invoice_date?.trim();
    let sapInvoicePayload = null;
    let sapPdfPayload = null;
    const domainId = await resolveDomainId(body);
    let bccEmails = [];
    try {
        bccEmails = await loadBccEmails(domainId);
        if (!invoiceNumber || !invoiceDate) {
            const invoiceResponse = await sapClient.fetchInvoice({
                salesOrder,
                companyCode,
            });
            sapInvoicePayload = invoiceResponse.data;
            const extracted = extractInvoiceEntry(salesOrder, invoiceResponse.data);
            if (extracted) {
                invoiceNumber = invoiceNumber || extracted.invoiceNo || "";
                invoiceDate = invoiceDate || extracted.invoiceDate || "";
            }
        }
        if (!invoiceNumber || !invoiceDate) {
            throw new Error("Invoice number or invoice date not found in SAP response.");
        }
        const pdfResponse = await sapClient.fetchInvoicePdf(invoiceNumber, invoiceDate, companyCode);
        sapPdfPayload = pdfResponse.data;
        const pdfContent = pdfResponse.data?.Content ??
            pdfResponse.data?.content ??
            pdfResponse.data?.PDF ??
            pdfResponse.data?.pdf ??
            pdfResponse.data;
        await (0, pg_1.recordInvoiceAudit)({
            order_id: body.order_id ?? salesOrder,
            invoice_number: invoiceNumber,
            company_code: companyCode,
            success: true,
            message: "Invoice retrieved successfully.",
            payload: {
                invoice_lookup: sapInvoicePayload,
                pdf_lookup: Array.isArray(pdfContent) ? undefined : { meta: "omitted" },
                bcc: bccEmails,
            },
        });
        return res.json({
            success: true,
            invoice_number: invoiceNumber,
            invoice_date: invoiceDate,
            pdf: pdfContent,
            bcc: bccEmails,
        });
    }
    catch (error) {
        const message = error?.response?.data?.message ||
            error?.message ||
            "Failed to retrieve invoice.";
        await (0, pg_1.recordInvoiceAudit)({
            order_id: body.order_id ?? salesOrder,
            invoice_number: invoiceNumber ?? null,
            company_code: companyCode || null,
            success: false,
            message,
            payload: {
                invoice_lookup: sapInvoicePayload,
                pdf_lookup: sapPdfPayload,
                bcc: bccEmails,
                error: error?.response?.data ?? { message },
            },
        });
        const status = error?.response?.status && Number.isInteger(error.response.status)
            ? error.response.status
            : 502;
        return res.status(status).json({
            success: false,
            message,
            bcc: bccEmails,
        });
    }
};
exports.POST = POST;
const parseNumeric = (value) => {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    const parsed = Number.parseInt(String(value).trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
};
const resolveDomainId = async (body) => {
    const explicit = parseNumeric(body.domain_id ?? null);
    if (explicit) {
        return explicit;
    }
    const rawAccessId = body.access_id ?? null;
    const accessId = rawAccessId === null || rawAccessId === undefined
        ? ""
        : String(rawAccessId).trim();
    if (!accessId) {
        return null;
    }
    await (0, pg_1.ensureRedingtonAccessMappingTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT domain_id
      FROM redington_access_mapping
      WHERE access_id = $1
      LIMIT 1
    `, [accessId]);
    const domainId = rows[0]?.domain_id;
    return Number.isFinite(domainId) ? Number(domainId) : null;
};
const loadBccEmails = async (domainId) => {
    if (!domainId) {
        return [];
    }
    await (0, pg_1.ensureRedingtonAddBccTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT *
      FROM redington_add_bcc
      WHERE domain_id = $1
      LIMIT 1
    `, [domainId]);
    if (!rows[0]) {
        return [];
    }
    return (0, pg_1.mapAddBccRow)(rows[0]).bcc_emails;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvYjJjZ2V0aW52b2ljZS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSxnRkFBNEQ7QUFDNUQsMkVBQXNFO0FBQ3RFLDJDQU0yQjtBQUUzQixNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQzFELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0lBQ2pDLElBQUksTUFBTSxFQUFFLENBQUM7UUFDWCxHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ2pELEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQzlCLENBQUM7U0FBTSxDQUFDO1FBQ04sR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNoRCxDQUFDO0lBRUQsR0FBRyxDQUFDLE1BQU0sQ0FDUiw4QkFBOEIsRUFDOUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQztRQUMzQyw2QkFBNkIsQ0FDaEMsQ0FBQTtJQUNELEdBQUcsQ0FBQyxNQUFNLENBQUMsOEJBQThCLEVBQUUsY0FBYyxDQUFDLENBQUE7SUFDMUQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxrQ0FBa0MsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUN4RCxDQUFDLENBQUE7QUFFTSxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDdkUsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNqQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ3hCLENBQUMsQ0FBQTtBQUhZLFFBQUEs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