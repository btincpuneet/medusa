import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createMagentoB2CClient } from "../../magentoClient";

const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL;
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN;

function getQueryParam(value: unknown): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function ensureMagentoConfig() {
  if (!MAGENTO_REST_BASE_URL) {
    throw new Error("MAGENTO_REST_BASE_URL env var is required to query Magento orders.");
  }

  if (!MAGENTO_ADMIN_TOKEN) {
    throw new Error("MAGENTO_ADMIN_TOKEN env var is required to query Magento orders.");
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    ensureMagentoConfig();
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Magento configuration missing",
    });
  }

  const page = Number.parseInt(getQueryParam(req.query.page) || "1", 10) || 1;
  const pageSize = Number.parseInt(getQueryParam(req.query.page_size) || "20", 10) || 20;
  const status = getQueryParam(req.query.status);
  const email = getQueryParam(req.query.customer_email);
  const incrementId = getQueryParam(req.query.increment_id);

  const searchParams: Record<string, string | number> = {
    "searchCriteria[currentPage]": page,
    "searchCriteria[pageSize]": pageSize,
    "searchCriteria[sortOrders][0][field]": "created_at",
    "searchCriteria[sortOrders][0][direction]": "DESC",
  };

  let filterGroupIndex = 0;

  if (status) {
    searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = "status";
    searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = status;
    searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = "eq";
    filterGroupIndex += 1;
  }

  if (email) {
    searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = "customer_email";
    searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = email;
    searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = "eq";
    filterGroupIndex += 1;
  }

  if (incrementId) {
    searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = "increment_id";
    searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = incrementId;
    searchParams[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = "eq";
  }

  const magentoClient = createMagentoB2CClient({
    baseUrl: MAGENTO_REST_BASE_URL!,
    axiosConfig: {
      headers: {
        Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  });

  try {
    const response = await magentoClient.orders.listOrders({ params: searchParams });
    const { data } = response;

    return res.json({
      page,
      pageSize,
      totalCount: data?.total_count ?? 0,
      orders: data?.items ?? [],
      raw: data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while fetching Magento orders";

    return res.status(502).json({
      message,
    });
  }
}
