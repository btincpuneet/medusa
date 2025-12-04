import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

// Define types based on your Magento order response
interface MagentoOrderItem {
  item_id: number;
  sku: string;
  name: string;
  qty_ordered: number;
  price: number;
  row_total: number;
  tax_amount: number;
  discount_amount: number;
  tax_percent: number;
  discount_percent: number;
  product_id: number;
  product_type: string;
  weight: number;
  qty_invoiced: number;
  qty_shipped: number;
  qty_canceled: number;
  qty_refunded: number;
  [key: string]: any;
}

interface MagentoAddress {
  address_type: string;
  city: string;
  country_id: string;
  email: string;
  entity_id: number;
  firstname: string;
  lastname: string;
  postcode: string;
  region: string;
  region_code: string;
  region_id: number;
  street: string[];
  telephone: string;
}

interface MagentoPayment {
  entity_id: number;
  method: string;
  amount_ordered: number;
  additional_information: string[];
  [key: string]: any;
}

interface MagentoStatusHistory {
  entity_id: number;
  comment: string;
  status: string;
  created_at: string;
  is_customer_notified: boolean;
  is_visible_on_front: boolean;
}

interface MagentoOrder {
  entity_id: number;
  increment_id: string;
  customer_email: string;
  customer_firstname: string;
  customer_lastname: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  grand_total: number;
  order_currency_code: string;
  status: string;
  state: string;
  created_at: string;
  updated_at: string;
  total_qty_ordered: number;
  total_item_count: number;
  customer_id: number;
  customer_is_guest: boolean;
  store_id: number;
  store_name: string;
  remote_ip: string;
  shipping_description: string;
  protect_code: string;
  quote_id: number;
  weight: number;
  
  // Cancellation fields
  total_canceled?: number;
  subtotal_canceled?: number;
  tax_canceled?: number;
  shipping_canceled?: number;
  
  // Nested objects
  items: MagentoOrderItem[];
  billing_address: MagentoAddress;
  payment: MagentoPayment;
  status_histories: MagentoStatusHistory[];
  extension_attributes: {
    shipping_assignments: Array<{
      shipping: {
        address: MagentoAddress;
        method: string;
      };
      items: MagentoOrderItem[];
    }>;
    payment_additional_info?: Array<{
      key: string;
      value: string;
    }>;
    applied_taxes?: Array<{
      code: string;
      title: string;
      percent: number;
      amount: number;
    }>;
    [key: string]: any;
  };
}

interface MagentoOrdersResponse {
  items: MagentoOrder[];
  search_criteria: {
    filter_groups: any[];
  };
  total_count: number;
}

interface ImportResults {
  processed: number;
  orders: number;
  order_items: number;
  addresses: number;
  payments: number;
  status_history: number;
  errors: string[];
  skipped: number;
  warnings: string[];
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  complete: number;
  canceled: number;
  closed: number;
  by_currency: Record<string, number>;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🚀 Starting Magento orders import...");

    await client.connect();

    const magentoOrders = await fetchMagentoOrders();
    console.log(`📂 Received ${magentoOrders.total_count} orders from Magento`);

    const result = await processAndInsertOrders(client, magentoOrders.items);

    console.log("✅ Orders import completed!");
    console.log(`📊 Results:`);
    console.log(`   - Orders: ${result.orders}`);
    console.log(`   - Order Items: ${result.order_items}`);
    console.log(`   - Addresses: ${result.addresses}`);
    console.log(`   - Payments: ${result.payments}`);
    console.log(`   - Status History: ${result.status_history}`);
    console.log(`   - Errors: ${result.errors.length}`);
    console.log(`   - Skipped: ${result.skipped}`);

    return res.json({
      success: true,
      message: `Processed ${result.processed} orders successfully`,
      details: result,
    });
  } catch (error: any) {
    console.error("❌ Error importing orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to import orders",
      error: error.message,
    });
  } finally {
    await client.end().catch(console.error);
  }
}

// Get Magento token from environment variables
function getMagentoToken(): string {
  const token = process.env.MAGENTO_ADMIN_TOKEN;
  if (!token) {
    throw new Error("MAGENTO_ADMIN_TOKEN environment variable is not set");
  }
  return token;
}

// Function to call Magento Orders API with pagination
async function fetchMagentoOrders(): Promise<MagentoOrdersResponse> {
  const baseUrl = "http://local.b2c.com/rest/V1/orders";
  const token = getMagentoToken();
  const pageSize = 100; // Max items per page
  let allItems: MagentoOrder[] = [];
  let currentPage = 1;
  let totalCount = 0;

  try {
    console.log(`🌐 Starting Magento orders fetch with token authentication`);

    while (true) {
      const params = new URLSearchParams({
        'searchCriteria[currentPage]': currentPage.toString(),
        'searchCriteria[pageSize]': pageSize.toString(),
      });

      const url = `${baseUrl}?${params}`;
      console.log(`📄 Fetching page ${currentPage} from Magento...`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Magento API responded with status: ${response.status} - ${errorText}`);
      }

      const data: MagentoOrdersResponse = await response.json();
      
      if (!data.items || data.items.length === 0) {
        break;
      }

      allItems = [...allItems, ...data.items];
      totalCount = data.total_count || allItems.length;

      console.log(`✅ Page ${currentPage}: Got ${data.items.length} orders (Total: ${allItems.length})`);

      // Check if we've fetched all items
      if (allItems.length >= totalCount) {
        break;
      }

      currentPage++;
      
      // Optional: Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Successfully fetched ${allItems.length} total orders from Magento`);
    
    return {
      items: allItems,
      search_criteria: { filter_groups: [] },
      total_count: allItems.length
    };

  } catch (error: any) {
    console.error("❌ Error fetching orders from Magento:", error.message);
    throw error;
  }
}

// Main processing function for orders
async function processAndInsertOrders(
  client: Client,
  magentoOrders: MagentoOrder[]
): Promise<ImportResults> {
  const results: ImportResults = {
    processed: 0,
    orders: 0,
    order_items: 0,
    addresses: 0,
    payments: 0,
    status_history: 0,
    errors: [],
    skipped: 0,
    warnings: [],
  };

  const stats: OrderStats = {
    total: 0,
    pending: 0,
    processing: 0,
    complete: 0,
    canceled: 0,
    closed: 0,
    by_currency: {}
  };

  try {
    console.log(`📋 Processing ${magentoOrders.length} orders from Magento`);

    // First, analyze the orders
    magentoOrders.forEach(order => {
      stats.total++;
      stats[order.status] = (stats[order.status] || 0) + 1;
      stats.by_currency[order.order_currency_code] = (stats.by_currency[order.order_currency_code] || 0) + 1;
    });

    console.log(`📊 Order Stats:`);
    console.log(`   - Total: ${stats.total}`);
    console.log(`   - By Status:`);
    Object.entries(stats).forEach(([key, value]) => {
      if (!['total', 'by_currency'].includes(key) && typeof value === 'number') {
        console.log(`     ${key}: ${value}`);
      }
    });
    console.log(`   - By Currency:`);
    Object.entries(stats.by_currency).forEach(([currency, count]) => {
      console.log(`     ${currency}: ${count}`);
    });

    // Process orders in batches
    const batchSize = 20; // Reduced batch size for better error handling
    for (let i = 0; i < magentoOrders.length; i += batchSize) {
      const batch = magentoOrders.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(magentoOrders.length/batchSize)} (orders ${i+1}-${Math.min(i+batchSize, magentoOrders.length)})`);
      
      for (const magentoOrder of batch) {
        try {
          const orderName = `Order #${magentoOrder.increment_id}`;
          
          // Check if order already exists
          const existingOrder = await client.query(
            `SELECT id FROM mp_orders WHERE magento_order_id = $1`,
            [magentoOrder.increment_id]
          );

          if (existingOrder.rows.length > 0) {
            console.log(`⏭️  Skipping existing order: ${magentoOrder.increment_id}`);
            results.skipped++;
            continue;
          }

          // Get customer_id from mp_customers
          let customerId = null;
          if (magentoOrder.customer_email) {
            const customerResult = await client.query(
              `SELECT id FROM mp_customers WHERE email = $1`,
              [magentoOrder.customer_email]
            );
            if (customerResult.rows.length > 0) {
              customerId = customerResult.rows[0].id;
            } else {
              console.log(`⚠️  Customer not found for email: ${magentoOrder.customer_email}`);
              results.warnings.push(`Customer not found for email: ${magentoOrder.customer_email} in order ${magentoOrder.increment_id}`);
            }
          }

          // Insert order
          const orderId = await insertOrder(client, magentoOrder, customerId);
          results.orders++;
          
          // Insert order items
          const itemCount = await insertOrderItems(client, orderId, magentoOrder);
          results.order_items += itemCount;
          
          // Insert billing address
          await insertBillingAddress(client, orderId, magentoOrder);
          results.addresses++;
          
          // Insert shipping address
          await insertShippingAddress(client, orderId, magentoOrder);
          results.addresses++;
          
          // Insert payment
          await insertPayment(client, orderId, magentoOrder);
          results.payments++;
          
          // Insert status history
          const statusCount = await insertStatusHistory(client, orderId, magentoOrder);
          results.status_history += statusCount;
          
          results.processed++;
          console.log(`✅ Processed: ${orderName}`);

        } catch (error: any) {
          const errorMsg = `Error processing order ${magentoOrder.increment_id}: ${error.message}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
          // Continue with next order even if this one fails
        }
      }
    }

    console.log(`\n📊 IMPORT SUMMARY:`);
    console.log(`✅ Imported ${results.orders} orders out of ${magentoOrders.length} total`);
    console.log(`📊 Breakdown:`);
    console.log(`   - Processed: ${results.processed}`);
    console.log(`   - Orders: ${results.orders}`);
    console.log(`   - Order Items: ${results.order_items}`);
    console.log(`   - Addresses: ${results.addresses}`);
    console.log(`   - Payments: ${results.payments}`);
    console.log(`   - Status History: ${results.status_history}`);
    console.log(`   - Skipped: ${results.skipped} (duplicates)`);
    console.log(`   - Errors: ${results.errors.length}`);
    console.log(`   - Warnings: ${results.warnings.length}`);

    if (results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (first 10):`);
      results.warnings.slice(0, 10).forEach(warning => {
        console.log(`   - ${warning}`);
      });
      if (results.warnings.length > 10) {
        console.log(`   ... and ${results.warnings.length - 10} more warnings`);
      }
    }

    if (results.errors.length > 0) {
      console.log(`\n❌ Errors (first 10):`);
      results.errors.slice(0, 10).forEach(error => {
        console.log(`   - ${error}`);
      });
      if (results.errors.length > 10) {
        console.log(`   ... and ${results.errors.length - 10} more errors`);
      }
    }

    // Print statistics
    await printOrderStats(client);

    return results;
  } catch (error: any) {
    console.error("❌ Error in orders processing:", error);
    results.errors.push(`Processing error: ${error.message}`);
    return results;
  }
}

// Insert order into mp_orders
async function insertOrder(
  client: Client,
  order: MagentoOrder,
  customerId: number | null
): Promise<number> {
  const result = await client.query(
    `INSERT INTO mp_orders (
      customer_id,
      customer_email,
      customer_first_name,
      customer_last_name,
      subtotal,
      discount_total,
      tax_total,
      shipping_total,
      grand_total,
      currency,
      order_status,
      payment_status,
      fulfillment_status,
      magento_order_id,
      notes,
      created_at,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) RETURNING id`,
    [
      customerId,
      order.customer_email,
      order.customer_firstname,
      order.customer_lastname,
      parseFloat(order.subtotal.toFixed(2)),
      parseFloat(order.discount_amount.toFixed(2)),
      parseFloat(order.tax_amount.toFixed(2)),
      parseFloat(order.shipping_amount.toFixed(2)),
      parseFloat(order.grand_total.toFixed(2)),
      order.order_currency_code,
      mapOrderStatus(order.status),
      mapPaymentStatus(order),
      mapFulfillmentStatus(order),
      order.increment_id,
      getLatestStatusComment(order.status_histories),
      order.created_at ? new Date(order.created_at) : new Date(),
      order.updated_at ? new Date(order.updated_at) : new Date()
    ]
  );
  
  return result.rows[0].id;
}

// Insert order items into mp_order_items
async function insertOrderItems(
  client: Client,
  orderId: number,
  order: MagentoOrder
): Promise<number> {
  let insertedCount = 0;
  
  for (const item of order.items) {
    // Get product_id from mp_products using SKU
    let productId = null;
    let sellerId = null;
    
    if (item.sku) {
      try {
        // First check if mp_products has seller_id column
        const tableInfo = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'mp_products' 
          AND column_name = 'seller_id'
        `);
        
        const hasSellerId = tableInfo.rows.length > 0;
        
        let productQuery = `SELECT id`;
        if (hasSellerId) {
          productQuery += `, seller_id`;
        }
        productQuery += ` FROM mp_products WHERE sku = $1 LIMIT 1`;
        
        const productResult = await client.query(productQuery, [item.sku]);
        
        if (productResult.rows.length > 0) {
          productId = productResult.rows[0].id;
          if (hasSellerId) {
            sellerId = productResult.rows[0].seller_id;
          }
        } else {
          console.log(`⚠️  Product not found for SKU: ${item.sku}`);
          results.warnings.push(`Product not found for SKU: ${item.sku} in order ${order.increment_id}`);
        }
      } catch (error) {
        console.log(`⚠️  Error fetching product for SKU ${item.sku}:`, error.message);
        // Continue without product_id
      }
    }
    
    try {
      await client.query(
        `INSERT INTO mp_order_items (
          order_id,
          product_id,
          seller_id,
          sku,
          name,
          quantity,
          price,
          row_total,
          discount_amount,
          tax_amount,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )`,
        [
          orderId,
          productId,
          sellerId,
          item.sku,
          item.name,
          item.qty_ordered,
          parseFloat(item.price.toFixed(2)),
          parseFloat(item.row_total.toFixed(2)),
          parseFloat(item.discount_amount.toFixed(2)),
          parseFloat(item.tax_amount.toFixed(2)),
          order.created_at ? new Date(order.created_at) : new Date()
        ]
      );
      
      insertedCount++;
    } catch (error: any) {
      console.error(`❌ Error inserting item ${item.sku}:`, error.message);
      // Continue with next item
    }
  }
  
  return insertedCount;
}

// Insert billing address into mp_order_addresses
async function insertBillingAddress(
  client: Client,
  orderId: number,
  order: MagentoOrder
): Promise<void> {
  const address = order.billing_address;
  
  try {
    await client.query(
      `INSERT INTO mp_order_addresses (
        order_id,
        address_type,
        first_name,
        last_name,
        phone,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country_code,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )`,
      [
        orderId,
        'billing',
        address.firstname,
        address.lastname,
        address.telephone,
        address.street?.[0] || '',
        address.street?.[1] || '',
        address.city,
        address.region,
        address.postcode,
        address.country_id,
        order.created_at ? new Date(order.created_at) : new Date()
      ]
    );
  } catch (error: any) {
    console.error(`❌ Error inserting billing address for order ${order.increment_id}:`, error.message);
    throw error;
  }
}

// Insert shipping address into mp_order_addresses
async function insertShippingAddress(
  client: Client,
  orderId: number,
  order: MagentoOrder
): Promise<void> {
  const shippingAssignment = order.extension_attributes?.shipping_assignments?.[0];
  
  if (!shippingAssignment?.shipping?.address) {
    console.log(`⚠️  No shipping address found for order ${order.increment_id}, using billing address`);
    // Use billing address as shipping address
    try {
      await client.query(
        `INSERT INTO mp_order_addresses (
          order_id,
          address_type,
          first_name,
          last_name,
          phone,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country_code,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )`,
        [
          orderId,
          'shipping',
          order.billing_address.firstname,
          order.billing_address.lastname,
          order.billing_address.telephone,
          order.billing_address.street?.[0] || '',
          order.billing_address.street?.[1] || '',
          order.billing_address.city,
          order.billing_address.region,
          order.billing_address.postcode,
          order.billing_address.country_id,
          order.created_at ? new Date(order.created_at) : new Date()
        ]
      );
    } catch (error: any) {
      console.error(`❌ Error inserting shipping address for order ${order.increment_id}:`, error.message);
      throw error;
    }
    return;
  }
  
  const address = shippingAssignment.shipping.address;
  
  try {
    await client.query(
      `INSERT INTO mp_order_addresses (
        order_id,
        address_type,
        first_name,
        last_name,
        phone,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country_code,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )`,
      [
        orderId,
        'shipping',
        address.firstname,
        address.lastname,
        address.telephone,
        address.street?.[0] || '',
        address.street?.[1] || '',
        address.city,
        address.region,
        address.postcode,
        address.country_id,
        order.created_at ? new Date(order.created_at) : new Date()
      ]
    );
  } catch (error: any) {
    console.error(`❌ Error inserting shipping address for order ${order.increment_id}:`, error.message);
    throw error;
  }
}

// Insert payment into mp_order_payments
async function insertPayment(
  client: Client,
  orderId: number,
  order: MagentoOrder
): Promise<void> {
  const payment = order.payment;
  const methodTitle = order.extension_attributes?.payment_additional_info?.find(
    info => info.key === 'method_title'
  )?.value || payment.method;
  
  try {
    await client.query(
      `INSERT INTO mp_order_payments (
        order_id,
        method,
        transaction_id,
        amount,
        status,
        raw_response,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )`,
      [
        orderId,
        methodTitle,
        null, // transaction_id - not available in basic Magento response
        parseFloat(payment.amount_ordered.toFixed(2)),
        mapPaymentStatus(order),
        JSON.stringify(payment),
        order.created_at ? new Date(order.created_at) : new Date()
      ]
    );
  } catch (error: any) {
    console.error(`❌ Error inserting payment for order ${order.increment_id}:`, error.message);
    throw error;
  }
}

// Insert status history into mp_order_status_history
async function insertStatusHistory(
  client: Client,
  orderId: number,
  order: MagentoOrder
): Promise<number> {
  let insertedCount = 0;
  
  for (const history of order.status_histories) {
    try {
      await client.query(
        `INSERT INTO mp_order_status_history (
          order_id,
          status,
          comment,
          notify_customer,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5
        )`,
        [
          orderId,
          history.status || order.status,
          history.comment || '',
          history.is_customer_notified || false,
          history.created_at ? new Date(history.created_at) : new Date()
        ]
      );
      
      insertedCount++;
    } catch (error: any) {
      console.error(`❌ Error inserting status history for order ${order.increment_id}:`, error.message);
      // Continue with next history record
    }
  }
  
  return insertedCount;
}

// Helper functions
function mapOrderStatus(magentoStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'processing': 'processing',
    'complete': 'completed',
    'closed': 'closed',
    'canceled': 'cancelled',
    'holded': 'on_hold',
    'fraud': 'fraud',
    'payment_review': 'payment_review'
  };
  
  return statusMap[magentoStatus] || 'pending';
}

function mapPaymentStatus(order: MagentoOrder): string {
  if (order.status === 'canceled') return 'failed';
  if (order.status === 'complete') return 'completed';
  if (order.status === 'processing') return 'processing';
  if (order.status === 'holded') return 'on_hold';
  return 'pending';
}

function mapFulfillmentStatus(order: MagentoOrder): string {
  // Check if any items have been shipped
  const hasShippedItems = order.items.some(item => item.qty_shipped > 0);
  
  if (hasShippedItems) return 'fulfilled';
  if (order.status === 'complete') return 'fulfilled';
  if (order.status === 'canceled') return 'cancelled';
  if (order.status === 'closed') return 'closed';
  return 'unfulfilled';
}

function getLatestStatusComment(histories: MagentoStatusHistory[]): string {
  if (!histories || histories.length === 0) return '';
  
  // Sort by created_at desc and get the latest comment
  const sorted = [...histories].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  return sorted[0].comment || '';
}

// Print statistics about imported orders
async function printOrderStats(client: Client): Promise<void> {
  console.log("\n📈 IMPORTED ORDERS STATISTICS:");
  
  try {
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(DISTINCT customer_email) as unique_customers,
        SUM(grand_total) as total_revenue,
        AVG(grand_total) as avg_order_value,
        COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN order_status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(DISTINCT currency) as currencies_count
      FROM mp_orders
    `);

    if (stats.rows[0]) {
      const row = stats.rows[0];
      console.log(`📊 Order Statistics:`);
      console.log(`   Total orders: ${row.total_orders}`);
      console.log(`   Unique customers: ${row.unique_customers}`);
      console.log(`   Total revenue: ${parseFloat(row.total_revenue || 0).toFixed(2)}`);
      console.log(`   Average order value: ${parseFloat(row.avg_order_value || 0).toFixed(2)}`);
      console.log(`   Status breakdown:`);
      console.log(`     - Pending: ${row.pending}`);
      console.log(`     - Processing: ${row.processing}`);
      console.log(`     - Completed: ${row.completed}`);
      console.log(`     - Cancelled: ${row.cancelled}`);
      console.log(`   Currencies: ${row.currencies_count}`);
    }

    // Get item statistics
    const itemStats = await client.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity,
        AVG(price) as avg_item_price,
        COUNT(DISTINCT sku) as unique_skus
      FROM mp_order_items
    `);

    if (itemStats.rows[0]) {
      const row = itemStats.rows[0];
      console.log(`\n📦 Item Statistics:`);
      console.log(`   Total items: ${row.total_items}`);
      console.log(`   Total quantity: ${row.total_quantity}`);
      console.log(`   Average item price: ${parseFloat(row.avg_item_price || 0).toFixed(2)}`);
      console.log(`   Unique SKUs: ${row.unique_skus}`);
    }

    // Get top products by quantity
    const topProducts = await client.query(`
      SELECT 
        sku,
        name,
        SUM(quantity) as total_quantity,
        COUNT(DISTINCT order_id) as order_count
      FROM mp_order_items
      GROUP BY sku, name
      ORDER BY total_quantity DESC
      LIMIT 10
    `);

    if (topProducts.rows.length > 0) {
      console.log(`\n🏆 Top 10 Products by Quantity Sold:`);
      topProducts.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.name} (${row.sku}): ${row.total_quantity} units in ${row.order_count} orders`);
      });
    }
  } catch (error: any) {
    console.log(`⚠️  Could not fetch statistics: ${error.message}`);
  }
}

// Fix: Add missing 'results' variable that's used in insertOrderItems
const results = {
  warnings: [] as string[]
};