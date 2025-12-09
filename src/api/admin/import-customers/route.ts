import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

// Define types based on your Magento customer response
interface MagentoAddress {
  id: number;
  customer_id: number;
  region: {
    region_code: string;
    region: string;
    region_id: number;
  };
  region_id: number;
  country_id: string;
  street: string[];
  telephone: string;
  postcode: string;
  city: string;
  firstname: string;
  lastname: string;
  default_shipping: boolean;
  default_billing: boolean;
  company?: string;
}

interface MagentoCustomAttribute {
  attribute_code: string;
  value: string;
}

interface MagentoCustomer {
  id: number;
  group_id: number;
  created_at: string;
  updated_at: string;
  created_in: string;
  email: string;
  firstname: string;
  lastname: string;
  prefix?: string;
  store_id: number;
  website_id: number;
  addresses: MagentoAddress[];
  disable_auto_group_change: number;
  extension_attributes: {
    is_subscribed: boolean;
  };
  custom_attributes?: MagentoCustomAttribute[];
  default_billing?: string;
  default_shipping?: string;
}

interface MagentoCustomersResponse {
  items: MagentoCustomer[];
  search_criteria: {
    filter_groups: any[];
  };
  total_count: number;
}

interface ImportResults {
  processed: number;
  customers: number;
  addresses: number;
  errors: string[];
  skipped: number;
  warnings: string[];
}

interface CustomerStats {
  total: number;
  with_addresses: number;
  without_addresses: number;
  subscribed: number;
  by_country: Record<string, number>;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🚀 Starting Magento customers import...");

    await client.connect();

    const magentoCustomers = await fetchMagentoCustomers();
    console.log(`📂 Received ${magentoCustomers.total_count} customers from Magento`);

    const result = await processAndInsertCustomers(client, magentoCustomers.items);

    console.log("✅ Customers import completed!");
    console.log(`📊 Results:`);
    console.log(`   - Customers: ${result.customers}`);
    console.log(`   - Addresses: ${result.addresses}`);
    console.log(`   - Errors: ${result.errors.length}`);
    console.log(`   - Skipped: ${result.skipped}`);

    return res.json({
      success: true,
      message: `Processed ${result.processed} customers successfully`,
      details: result,
    });
  } catch (error: any) {
    console.error("❌ Error importing customers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to import customers",
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

// Function to call Magento Customers API with pagination
async function fetchMagentoCustomers(): Promise<MagentoCustomersResponse> {
  const baseUrl = "http://local.b2c.com/rest/V1/customers/search";
  const token = getMagentoToken();
  const pageSize = 100; // Max items per page
  let allItems: MagentoCustomer[] = [];
  let currentPage = 1;
  let totalCount = 0;

  try {
    console.log(`🌐 Starting Magento customers fetch with token authentication`);

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

      const data: MagentoCustomersResponse = await response.json();
      
      if (!data.items || data.items.length === 0) {
        break;
      }

      allItems = [...allItems, ...data.items];
      totalCount = data.total_count || allItems.length;

      console.log(`✅ Page ${currentPage}: Got ${data.items.length} customers (Total: ${allItems.length})`);

      // Check if we've fetched all items
      if (allItems.length >= totalCount) {
        break;
      }

      currentPage++;
      
      // Optional: Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Successfully fetched ${allItems.length} total customers from Magento`);
    
    return {
      items: allItems,
      search_criteria: { filter_groups: [] },
      total_count: allItems.length
    };

  } catch (error: any) {
    console.error("❌ Error fetching customers from Magento:", error.message);
    throw error;
  }
}

// Main processing function for customers
async function processAndInsertCustomers(
  client: Client,
  magentoCustomers: MagentoCustomer[]
): Promise<ImportResults> {
  const results: ImportResults = {
    processed: 0,
    customers: 0,
    addresses: 0,
    errors: [],
    skipped: 0,
    warnings: [],
  };

  const stats: CustomerStats = {
    total: 0,
    with_addresses: 0,
    without_addresses: 0,
    subscribed: 0,
    by_country: {}
  };

  try {
    console.log(`📋 Processing ${magentoCustomers.length} customers from Magento`);

    // First, analyze the customers
    magentoCustomers.forEach(customer => {
      stats.total++;
      if (customer.addresses && customer.addresses.length > 0) {
        stats.with_addresses++;
        // Count countries
        customer.addresses.forEach(addr => {
          stats.by_country[addr.country_id] = (stats.by_country[addr.country_id] || 0) + 1;
        });
      } else {
        stats.without_addresses++;
      }
      if (customer.extension_attributes.is_subscribed) {
        stats.subscribed++;
      }
    });

    console.log(`📊 Customer Stats:`);
    console.log(`   - Total: ${stats.total}`);
    console.log(`   - With addresses: ${stats.with_addresses}`);
    console.log(`   - Without addresses: ${stats.without_addresses}`);
    console.log(`   - Subscribed to newsletter: ${stats.subscribed}`);
    console.log(`   - By Country:`);
    Object.entries(stats.by_country).forEach(([country, count]) => {
      console.log(`     ${country}: ${count}`);
    });

    // Process customers in batches
    const batchSize = 50;
    for (let i = 0; i < magentoCustomers.length; i += batchSize) {
      const batch = magentoCustomers.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(magentoCustomers.length/batchSize)} (customers ${i+1}-${Math.min(i+batchSize, magentoCustomers.length)})`);
      
      for (const magentoCustomer of batch) {
        try {
          const customerEmail = magentoCustomer.email;
          
          // Check if customer already exists
          const existingCustomer = await client.query(
            `SELECT id FROM mp_customers WHERE email = $1`,
            [customerEmail]
          );

          if (existingCustomer.rows.length > 0) {
            console.log(`⏭️  Skipping existing customer: ${customerEmail}`);
            results.skipped++;
            continue;
          }

          // Insert customer
          const customerId = await insertCustomer(client, magentoCustomer);
          results.customers++;
          
          // Insert addresses if any
          const addressCount = await insertCustomerAddresses(client, customerId, magentoCustomer);
          results.addresses += addressCount;
          
          results.processed++;
          console.log(`✅ Processed: ${customerEmail} (${addressCount} addresses)`);

        } catch (error: any) {
          const errorMsg = `Error processing customer ${magentoCustomer.email} (Magento ID: ${magentoCustomer.id}): ${error.message}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }
    }

    console.log(`\n📊 IMPORT SUMMARY:`);
    console.log(`✅ Imported ${results.customers} customers out of ${magentoCustomers.length} total`);
    console.log(`📊 Breakdown:`);
    console.log(`   - Processed: ${results.processed}`);
    console.log(`   - Customers: ${results.customers}`);
    console.log(`   - Addresses: ${results.addresses}`);
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
    await printCustomerStats(client);

    return results;
  } catch (error: any) {
    console.error("❌ Error in customers processing:", error);
    results.errors.push(`Processing error: ${error.message}`);
    return results;
  }
}

// Insert customer into mp_customers table
async function insertCustomer(
  client: Client,
  customer: MagentoCustomer
): Promise<number> {
  // Extract phone number from addresses or custom attributes
  let phone = null;
  
  // Try to get phone from first address
  if (customer.addresses && customer.addresses.length > 0 && customer.addresses[0].telephone) {
    phone = customer.addresses[0].telephone;
  }
  
  // Try to get mobile number from custom attributes
  if (!phone && customer.custom_attributes) {
    const mobileAttr = customer.custom_attributes.find(attr => attr.attribute_code === 'mobile_number');
    if (mobileAttr) {
      phone = mobileAttr.value;
    }
  }
  
  // Extract gender from prefix or custom attributes
  let gender = null;
  if (customer.prefix) {
    gender = mapPrefixToGender(customer.prefix);
  }
  
  // Extract all customer preferences and Magento metadata
  const preferences = extractCustomerPreferences(customer);
  
  // Generate a simple password hash placeholder
  const passwordHash = `magento_migrated_${customer.id}_${Date.now()}`;
  const passwordSalt = 'magento_migration';
  
  // First, check if we need to add Magento-specific columns
  await ensureMagentoColumnsExist(client);
  
  // Insert customer with all Magento data
  const result = await client.query(
    `INSERT INTO mp_customers (
      email,
      password_hash,
      password_salt,
      first_name,
      last_name,
      phone,
      gender,
      account_status,
      email_verified,
      accepts_marketing,
      newsletter_subscribed,
      preferences,
      external_customer_id,
      source_platform,
      name_prefix,
      created_at,
      updated_at,
      -- Magento-specific columns (if they exist)
      magento_group_id,
      magento_store_id,
      magento_website_id,
      magento_created_in,
      magento_disable_auto_group_change,
      magento_default_billing_id,
      magento_default_shipping_id
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22, $23, $24
    ) RETURNING id`,
    [
      customer.email,
      passwordHash,
      passwordSalt,
      customer.firstname,
      customer.lastname,
      phone,
      gender,
      'active',
      false,
      customer.extension_attributes.is_subscribed,
      customer.extension_attributes.is_subscribed,
      JSON.stringify(preferences),
      customer.id.toString(),
      'magento',
      customer.prefix || null,
      customer.created_at ? new Date(customer.created_at) : new Date(),
      customer.updated_at ? new Date(customer.updated_at) : new Date(),
      // Magento-specific data
      customer.group_id,
      customer.store_id,
      customer.website_id,
      customer.created_in,
      customer.disable_auto_group_change === 1,
      customer.default_billing ? parseInt(customer.default_billing) : null,
      customer.default_shipping ? parseInt(customer.default_shipping) : null
    ]
  );
  
  const customerId = result.rows[0].id;
  
  // Also store raw data in a metadata table for complete preservation
  await storeCustomerMetadata(client, customerId, customer);
  
  console.log(`👤 Inserted customer: ${customer.email} (Magento ID: ${customer.id})`);
  return customerId;
}

// Ensure Magento-specific columns exist
async function ensureMagentoColumnsExist(client: Client): Promise<void> {
  const columns = [
    { name: 'magento_group_id', type: 'INTEGER' },
    { name: 'magento_store_id', type: 'INTEGER' },
    { name: 'magento_website_id', type: 'INTEGER' },
    { name: 'magento_created_in', type: 'TEXT' },
    { name: 'magento_disable_auto_group_change', type: 'BOOLEAN DEFAULT FALSE' },
    { name: 'magento_default_billing_id', type: 'INTEGER' },
    { name: 'magento_default_shipping_id', type: 'INTEGER' }
  ];
  
  for (const column of columns) {
    try {
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'mp_customers' AND column_name = '${column.name}'
          ) THEN
            ALTER TABLE mp_customers ADD COLUMN ${column.name} ${column.type};
          END IF;
        END $$;
      `);
      console.log(`✅ Ensured column mp_customers.${column.name} exists`);
    } catch (error) {
      console.log(`⚠️  Could not add column ${column.name}:`, error.message);
    }
  }
}

// Store complete customer metadata
async function storeCustomerMetadata(
  client: Client,
  customerId: number,
  customer: MagentoCustomer
): Promise<void> {
  try {
    // Create metadata table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS mp_magento_customer_metadata (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES mp_customers(id) ON DELETE CASCADE,
        magento_customer_id INTEGER NOT NULL,
        magento_group_id INTEGER,
        magento_store_id INTEGER,
        magento_website_id INTEGER,
        magento_created_in TEXT,
        disable_auto_group_change BOOLEAN DEFAULT FALSE,
        default_billing_id INTEGER,
        default_shipping_id INTEGER,
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(magento_customer_id),
        INDEX idx_magento_customer_metadata_customer_id (customer_id)
      )
    `);
    
    // Insert metadata
    await client.query(
      `INSERT INTO mp_magento_customer_metadata (
        customer_id,
        magento_customer_id,
        magento_group_id,
        magento_store_id,
        magento_website_id,
        magento_created_in,
        disable_auto_group_change,
        default_billing_id,
        default_shipping_id,
        raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        customerId,
        customer.id,
        customer.group_id,
        customer.store_id,
        customer.website_id,
        customer.created_in,
        customer.disable_auto_group_change === 1,
        customer.default_billing ? parseInt(customer.default_billing) : null,
        customer.default_shipping ? parseInt(customer.default_shipping) : null,
        JSON.stringify(customer) // Store complete raw data
      ]
    );
    
    console.log(`💾 Stored complete metadata for customer ${customer.id}`);
  } catch (error) {
    console.log(`⚠️  Could not store customer metadata:`, error.message);
  }
}

// Insert customer addresses into mp_customer_addresses table
async function insertCustomerAddresses(
  client: Client,
  customerId: number,
  customer: MagentoCustomer
): Promise<number> {
  let insertedCount = 0;
  
  if (!customer.addresses || customer.addresses.length === 0) {
    console.log(`📭 No addresses for customer: ${customer.email}`);
    return 0;
  }
  
  for (const address of customer.addresses) {
    try {
      // Determine address type based on default flags
      let addressType = 'shipping'; // Default to shipping
      if (address.default_billing && address.default_shipping) {
        addressType = 'both'; // We'll handle this as both
      } else if (address.default_billing) {
        addressType = 'billing';
      } else if (address.default_shipping) {
        addressType = 'shipping';
      }
      
      // For addresses that are both billing and shipping, we need to insert two records
      if (address.default_billing && address.default_shipping) {
        // Insert billing address
        await insertSingleAddress(client, customerId, address, 'billing', true, true);
        insertedCount++;
        
        // Insert shipping address
        await insertSingleAddress(client, customerId, address, 'shipping', true, true);
        insertedCount++;
      } else {
        // Single address type
        await insertSingleAddress(
          client, 
          customerId, 
          address, 
          addressType as 'shipping' | 'billing',
          address.default_shipping,
          address.default_billing
        );
        insertedCount++;
      }
      
    } catch (error: any) {
      console.error(`❌ Error inserting address for customer ${customer.email}:`, error.message);
      results.warnings.push(`Failed to insert address for customer ${customer.email}: ${error.message}`);
    }
  }
  
  return insertedCount;
}

// Insert a single address record
async function insertSingleAddress(
  client: Client,
  customerId: number,
  address: MagentoAddress,
  addressType: 'shipping' | 'billing',
  isDefaultShipping: boolean,
  isDefaultBilling: boolean
): Promise<void> {
  
  // Ensure Magento columns exist in addresses table
  await ensureAddressMagentoColumnsExist(client);
  
  // Look up country_id from mp_countries table
  let countryRecordId = null;
  if (address.country_id) {
    const countryResult = await client.query(
      `SELECT id FROM mp_countries WHERE name ILIKE $1 OR id::text = $2`,
      [address.country_id, address.country_id]
    );
    if (countryResult.rows.length > 0) {
      countryRecordId = countryResult.rows[0].id;
    }
  }
  
  // Look up region_id from mp_regions table
  let regionRecordId = null;
  if (address.region_id && countryRecordId) {
    const regionResult = await client.query(
      `SELECT id FROM mp_regions WHERE country_id = $1 AND (name ILIKE $2 OR code = $3 OR id = $4)`,
      [countryRecordId, address.region?.region || '', address.region?.region_code || '', address.region_id]
    );
    if (regionResult.rows.length > 0) {
      regionRecordId = regionResult.rows[0].id;
    }
  }
  
  await client.query(
    `INSERT INTO mp_customer_addresses (
      customer_id,
      address_type,
      label,
      is_default_shipping,
      is_default_billing,
      first_name,
      last_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country_id,
      is_validated,
      is_active,
      created_at,
      updated_at,
      -- Magento-specific columns
      magento_address_id,
      magento_region_code,
      magento_region_name,
      metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
      $19, $20, $21, $22
    )`,
    [
      customerId,
      addressType,
      `${addressType.charAt(0).toUpperCase() + addressType.slice(1)} Address`,
      isDefaultShipping,
      isDefaultBilling,
      address.firstname || address.firstname,
      address.lastname || address.lastname,
      address.telephone,
      address.street?.[0] || '',
      address.street?.[1] || '',
      address.city,
      address.region?.region || '',
      address.postcode,
      address.country_id,
      true,
      true,
      new Date(),
      new Date(),
      // Magento-specific data
      address.id,
      address.region?.region_code || '',
      address.region?.region || '',
      JSON.stringify({
        magento_customer_id: address.customer_id,
        magento_region_id: address.region_id,
        original_street: address.street,
        imported_at: new Date().toISOString()
      })
    ]
  );
  
  console.log(`📍 Inserted ${addressType} address (Magento ID: ${address.id}) for customer ID ${customerId}`);
}

// Ensure Magento columns exist in addresses table
async function ensureAddressMagentoColumnsExist(client: Client): Promise<void> {
  const columns = [
    { name: 'magento_address_id', type: 'INTEGER' },
    { name: 'magento_region_code', type: 'VARCHAR(20)' },
    { name: 'magento_region_name', type: 'VARCHAR(100)' }
  ];
  
  for (const column of columns) {
    try {
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'mp_customer_addresses' AND column_name = '${column.name}'
          ) THEN
            ALTER TABLE mp_customer_addresses ADD COLUMN ${column.name} ${column.type};
          END IF;
        END $$;
      `);
      console.log(`✅ Ensured column mp_customer_addresses.${column.name} exists`);
    } catch (error) {
      console.log(`⚠️  Could not add column ${column.name}:`, error.message);
    }
  }
}

// Helper functions
function mapPrefixToGender(prefix: string): string | null {
  const prefixMap: Record<string, string> = {
    'Mr.': 'male',
    'Mr': 'male',
    'Mrs.': 'female',
    'Mrs': 'female',
    'Miss': 'female',
    'Ms.': 'female',
    'Ms': 'female',
  };
  
  return prefixMap[prefix] || null;
}

function extractCustomerPreferences(customer: MagentoCustomer): Record<string, any> {
  const preferences: Record<string, any> = {
    source: 'magento',
    migrated_at: new Date().toISOString(),
    magento_id: customer.id,
    magento_group_id: customer.group_id,
    store_id: customer.store_id,
    website_id: customer.website_id,
  };
  
  // Extract custom attributes
  if (customer.custom_attributes) {
    customer.custom_attributes.forEach(attr => {
      preferences[attr.attribute_code] = attr.value;
    });
  }
  
  return preferences;
}

// Print statistics about imported customers
async function printCustomerStats(client: Client): Promise<void> {
  console.log("\n📈 IMPORTED CUSTOMERS STATISTICS:");
  
  try {
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN newsletter_subscribed THEN 1 END) as subscribed_count,
        COUNT(CASE WHEN email_verified THEN 1 END) as verified_count,
        COUNT(DISTINCT source_platform) as platforms_count,
        COUNT(CASE WHEN gender = 'male' THEN 1 END) as male_count,
        COUNT(CASE WHEN gender = 'female' THEN 1 END) as female_count,
        COUNT(CASE WHEN gender IS NULL THEN 1 END) as unknown_gender_count
      FROM mp_customers
      WHERE source_platform = 'magento'
    `);

    if (stats.rows[0]) {
      const row = stats.rows[0];
      console.log(`📊 Customer Statistics:`);
      console.log(`   Total customers: ${row.total_customers}`);
      console.log(`   Subscribed to newsletter: ${row.subscribed_count}`);
      console.log(`   Email verified: ${row.verified_count}`);
      console.log(`   Platforms: ${row.platforms_count}`);
      console.log(`   Gender breakdown:`);
      console.log(`     - Male: ${row.male_count}`);
      console.log(`     - Female: ${row.female_count}`);
      console.log(`     - Unknown: ${row.unknown_gender_count}`);
    }

    // Get address statistics
    const addressStats = await client.query(`
      SELECT 
        COUNT(*) as total_addresses,
        COUNT(DISTINCT customer_id) as customers_with_addresses,
        COUNT(CASE WHEN address_type = 'shipping' THEN 1 END) as shipping_addresses,
        COUNT(CASE WHEN address_type = 'billing' THEN 1 END) as billing_addresses,
        COUNT(CASE WHEN is_default_shipping THEN 1 END) as default_shipping,
        COUNT(CASE WHEN is_default_billing THEN 1 END) as default_billing,
        COUNT(DISTINCT country_id) as countries_count
      FROM mp_customer_addresses ca
      JOIN mp_customers c ON ca.customer_id = c.id
      WHERE c.source_platform = 'magento'
    `);

    if (addressStats.rows[0]) {
      const row = addressStats.rows[0];
      console.log(`\n📍 Address Statistics:`);
      console.log(`   Total addresses: ${row.total_addresses}`);
      console.log(`   Customers with addresses: ${row.customers_with_addresses}`);
      console.log(`   Shipping addresses: ${row.shipping_addresses}`);
      console.log(`   Billing addresses: ${row.billing_addresses}`);
      console.log(`   Default shipping addresses: ${row.default_shipping}`);
      console.log(`   Default billing addresses: ${row.default_billing}`);
      console.log(`   Countries represented: ${row.countries_count}`);
    }

    // Get top countries
    const topCountries = await client.query(`
      SELECT 
        ca.country_id,
        COUNT(*) as address_count
      FROM mp_customer_addresses ca
      JOIN mp_customers c ON ca.customer_id = c.id
      WHERE c.source_platform = 'magento'
      AND ca.country_id IS NOT NULL
      GROUP BY ca.country_id
      ORDER BY address_count DESC
      LIMIT 10
    `);

    if (topCountries.rows.length > 0) {
      console.log(`\n🌍 Top 10 Countries by Address Count:`);
      topCountries.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.country_id}: ${row.address_count} addresses`);
      });
    }

  } catch (error: any) {
    console.log(`⚠️  Could not fetch statistics: ${error.message}`);
  }
}

// Fix: Add missing 'results' variable that's used in insertCustomerAddresses
const results = {
  warnings: [] as string[]
};