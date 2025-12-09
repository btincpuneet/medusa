import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

// Define types based on your Magento attribute response
interface MagentoAttributeOption {
  label: string;
  value: string;
  is_default?: boolean;
}

interface MagentoAttributeValidationRule {
  // Define based on your validation_rules structure
  [key: string]: any;
}

interface MagentoFrontendLabel {
  store_id: number;
  label: string;
}

interface MagentoAttribute {
  attribute_id: number;
  attribute_code: string;
  frontend_input: string;
  entity_type_id: string;
  default_frontend_label: string;
  scope: string;
  
  // Boolean fields
  is_wysiwyg_enabled: boolean;
  is_html_allowed_on_front: boolean;
  used_for_sort_by: boolean;
  is_filterable: boolean;
  is_filterable_in_search: boolean;
  is_used_in_grid: boolean;
  is_visible_in_grid: boolean;
  is_filterable_in_grid: boolean;
  is_required: boolean;
  is_user_defined: boolean;
  is_visible: boolean;
  
  // String fields (for "0"/"1" values)
  is_searchable: string;
  is_visible_in_advanced_search: string;
  is_comparable: string;
  is_used_for_promo_rules: string;
  is_visible_on_front: string;
  used_in_product_listing: string;
  is_unique: string;
  
  // Other fields
  position: number;
  backend_type: string;
  backend_model?: string;
  source_model?: string;
  default_value?: string;
  
  // Arrays/JSON fields
  apply_to: string[];
  options: MagentoAttributeOption[];
  frontend_labels: MagentoFrontendLabel[];
  validation_rules: MagentoAttributeValidationRule[];
}

interface MagentoAttributesResponse {
  items: MagentoAttribute[];
  search_criteria: {
    filter_groups: any[];
  };
  total_count: number;
}

interface ImportResults {
  processed: number;
  attributes: number;
  errors: string[];
  skipped: number;
  warnings: string[];
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🚀 Starting Magento product attributes import (ALL attributes including non-visible)...");

    await client.connect();

    const magentoAttributes = await fetchMagentoAttributes();
    console.log(`📂 Received ${magentoAttributes.total_count} attributes from Magento`);

    const result = await processAndInsertAttributes(client, magentoAttributes.items);

    console.log("✅ Attributes import completed!");
    console.log(`📊 Results: ${result.processed} processed, ${result.attributes} inserted/updated, ${result.errors.length} errors, ${result.skipped} skipped`);

    return res.json({
      success: true,
      message: `Processed ${result.processed} attributes successfully`,
      total_attributes: result.attributes,
      details: result,
    });
  } catch (error: any) {
    console.error("❌ Error importing attributes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to import attributes",
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

// Function to call Magento Attributes API with pagination
async function fetchMagentoAttributes(): Promise<MagentoAttributesResponse> {
  const baseUrl = "http://local.b2c.com/rest/V1/products/attributes";
  const token = getMagentoToken();
  const pageSize = 100; // Max items per page
  let allItems: MagentoAttribute[] = [];
  let currentPage = 1;
  let totalCount = 0;

  try {
    console.log(`🌐 Starting Magento attributes fetch with token authentication`);

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

      const data: MagentoAttributesResponse = await response.json();
      
      if (!data.items || data.items.length === 0) {
        break;
      }

      allItems = [...allItems, ...data.items];
      totalCount = data.total_count || allItems.length;

      console.log(`✅ Page ${currentPage}: Got ${data.items.length} attributes (Total: ${allItems.length})`);

      // Check if we've fetched all items
      if (allItems.length >= totalCount) {
        break;
      }

      currentPage++;
      
      // Optional: Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Successfully fetched ${allItems.length} total attributes from Magento`);
    
    return {
      items: allItems,
      search_criteria: { filter_groups: [] },
      total_count: allItems.length
    };

  } catch (error: any) {
    console.error("❌ Error fetching attributes from Magento:", error.message);
    throw error;
  }
}

// Main processing function - NOW IMPORTING ALL ATTRIBUTES
async function processAndInsertAttributes(
  client: Client,
  magentoAttributes: MagentoAttribute[]
): Promise<ImportResults> {
  const results: ImportResults = {
    processed: 0,
    attributes: 0,
    errors: [],
    skipped: 0,
    warnings: [],
  };

  // Track visibility stats
  const visibilityStats = {
    visible: 0,
    non_visible: 0,
    system: 0,
    user_defined: 0
  };

  try {
    console.log(`📋 Processing ${magentoAttributes.length} attributes from Magento`);
    console.log(`📌 IMPORTING ALL ATTRIBUTES (including non-visible)`);

    // First, let's check what types of attributes we have
    const attributeTypes = new Set(magentoAttributes.map(attr => attr.frontend_input));
    console.log(`🔧 Found attribute types: ${Array.from(attributeTypes).join(', ')}`);

    // Check stats before processing
    magentoAttributes.forEach(attr => {
      if (attr.is_visible) visibilityStats.visible++;
      else visibilityStats.non_visible++;
      
      if (attr.is_user_defined) visibilityStats.user_defined++;
      else visibilityStats.system++;
    });
    
    console.log(`👁️  Visibility stats: ${visibilityStats.visible} visible, ${visibilityStats.non_visible} non-visible attributes`);
    console.log(`👤 User-defined stats: ${visibilityStats.user_defined} user-defined, ${visibilityStats.system} system attributes`);

    // Process attributes in batches
    const batchSize = 50;
    for (let i = 0; i < magentoAttributes.length; i += batchSize) {
      const batch = magentoAttributes.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(magentoAttributes.length/batchSize)} (items ${i+1}-${Math.min(i+batchSize, magentoAttributes.length)})`);
      
      for (const magentoAttribute of batch) {
        try {
          const attributeName = magentoAttribute.default_frontend_label || magentoAttribute.attribute_code;
          
          // Validate required fields
          if (!magentoAttribute.attribute_code) {
            results.warnings.push(`Skipping attribute with missing attribute_code: Magento ID ${magentoAttribute.attribute_id}`);
            results.skipped++;
            continue;
          }

          // Log visibility status but don't skip
          if (!magentoAttribute.is_visible) {
            console.log(`👁️  Importing NON-VISIBLE attribute: ${magentoAttribute.attribute_code}`);
          }

          if (!magentoAttribute.is_user_defined) {
            console.log(`⚙️  System attribute: ${magentoAttribute.attribute_code}`);
          }

          // Special handling for certain attribute types
          if (magentoAttribute.apply_to && magentoAttribute.apply_to.length > 0) {
            console.log(`🎯 Attribute applies to: ${magentoAttribute.apply_to.join(', ')}`);
          }

          // Insert or update attribute
          await upsertAttribute(client, magentoAttribute);
          
          results.attributes++;
          results.processed++;

          console.log(`✅ Processed: ${magentoAttribute.attribute_code} ${!magentoAttribute.is_visible ? '(non-visible)' : ''}`);

        } catch (error: any) {
          const errorMsg = `Error processing attribute ${magentoAttribute.attribute_code} (Magento ID: ${magentoAttribute.attribute_id}): ${error.message}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }
    }

    console.log(`\n📊 IMPORT SUMMARY:`);
    console.log(`✅ Imported ${results.attributes} attributes out of ${magentoAttributes.length} total`);
    console.log(`📊 Breakdown:`);
    console.log(`   - Processed: ${results.processed}`);
    console.log(`   - Skipped: ${results.skipped} (only if missing attribute_code)`);
    console.log(`   - Errors: ${results.errors.length}`);
    console.log(`👁️  Visibility:`);
    console.log(`   - Visible attributes: ${visibilityStats.visible}`);
    console.log(`   - Non-visible attributes: ${visibilityStats.non_visible}`);
    console.log(`👤 Type:`);
    console.log(`   - User-defined: ${visibilityStats.user_defined}`);
    console.log(`   - System: ${visibilityStats.system}`);

    // Clean up any duplicate attributes (just in case)
    await cleanupDuplicates(client);

    // Print some statistics
    await printAttributeStats(client);

    return results;
  } catch (error: any) {
    console.error("❌ Error in attributes processing:", error);
    results.errors.push(`Processing error: ${error.message}`);
    return results;
  }
}

// Upsert attribute into the product_attributes table
async function upsertAttribute(
  client: Client,
  magentoAttribute: MagentoAttribute
): Promise<number> {
  // Prepare the data for insertion
  const {
    attribute_id,
    attribute_code,
    frontend_input,
    entity_type_id,
    default_frontend_label,
    scope,
    is_wysiwyg_enabled,
    is_html_allowed_on_front,
    used_for_sort_by,
    is_filterable,
    is_filterable_in_search,
    is_used_in_grid,
    is_visible_in_grid,
    is_filterable_in_grid,
    is_required,
    is_user_defined,
    is_visible,
    is_searchable,
    is_visible_in_advanced_search,
    is_comparable,
    is_used_for_promo_rules,
    is_visible_on_front,
    used_in_product_listing,
    is_unique,
    position,
    backend_type,
    backend_model,
    source_model,
    default_value,
    apply_to,
    options,
    frontend_labels,
    validation_rules
  } = magentoAttribute;

  // Try to find existing attribute by magento_attribute_id
  const existingAttribute = await client.query(
    `SELECT id FROM mp_magento_attributes_migrate WHERE attribute_id = $1`,
    [attribute_id]
  );

  if (existingAttribute.rows.length > 0) {
    // Update existing attribute
    const attributeRowId = existingAttribute.rows[0].id;
    await client.query(
      `UPDATE mp_magento_attributes_migrate
       SET attribute_code = $1, frontend_input = $2, default_frontend_label = $3, scope = $4,
           is_filterable = $5, is_visible = $6, is_required = $7, position = $8,
           is_searchable = $9, is_visible_in_advanced_search = $10, is_comparable = $11,
           backend_type = $12, options = $13::jsonb, apply_to = $14, raw_data = $15::jsonb,
           is_user_defined = $16, backend_model = $17, source_model = $18,
           updated_at = NOW()
       WHERE id = $19`,
      [
        attribute_code,
        frontend_input,
        default_frontend_label || attribute_code,
        scope,
        is_filterable,
        is_visible,
        is_required,
        position,
        is_searchable,
        is_visible_in_advanced_search,
        is_comparable,
        backend_type,
        JSON.stringify(options || []),
        apply_to || [],
        JSON.stringify(magentoAttribute), // Store raw data
        is_user_defined,
        backend_model || null,
        source_model || null,
        attributeRowId
      ]
    );
    console.log(`🔄 Updated attribute: ${attribute_code} ${!is_visible ? '(non-visible)' : ''}`);
    return attributeRowId;
  } else {
    // Insert new attribute
    const result = await client.query(
      `INSERT INTO mp_magento_attributes_migrate (
        attribute_id, attribute_code, frontend_input, entity_type_id,
        default_frontend_label, scope, is_wysiwyg_enabled, is_html_allowed_on_front,
        used_for_sort_by, is_filterable, is_filterable_in_search, is_used_in_grid,
        is_visible_in_grid, is_filterable_in_grid, is_required, is_user_defined,
        is_visible, is_searchable, is_visible_in_advanced_search, is_comparable,
        is_used_for_promo_rules, is_visible_on_front, used_in_product_listing,
        is_unique, position, backend_type, backend_model, source_model,
        default_value, apply_to, options, frontend_labels, validation_rules,
        raw_data, created_at, updated_at
       )
       VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31::jsonb, $32::jsonb, $33::jsonb, $34::jsonb, NOW(), NOW()
       )
       RETURNING id`,
      [
        attribute_id,
        attribute_code,
        frontend_input,
        entity_type_id,
        default_frontend_label || attribute_code,
        scope,
        is_wysiwyg_enabled,
        is_html_allowed_on_front,
        used_for_sort_by,
        is_filterable,
        is_filterable_in_search,
        is_used_in_grid,
        is_visible_in_grid,
        is_filterable_in_grid,
        is_required,
        is_user_defined,
        is_visible,
        is_searchable,
        is_visible_in_advanced_search,
        is_comparable,
        is_used_for_promo_rules,
        is_visible_on_front,
        used_in_product_listing,
        is_unique,
        position,
        backend_type,
        backend_model || null,
        source_model || null,
        default_value || null,
        apply_to || [],
        JSON.stringify(options || []),
        JSON.stringify(frontend_labels || []),
        JSON.stringify(validation_rules || []),
        JSON.stringify(magentoAttribute) // Store raw data
      ]
    );
    console.log(`🆕 Inserted attribute: ${attribute_code} ${!is_visible ? '(non-visible)' : ''}`);
    return result.rows[0].id;
  }
}

// Clean up duplicate attributes
async function cleanupDuplicates(client: Client): Promise<void> {
  console.log("🧹 Checking for duplicate attributes...");
  
  // Check for duplicates by attribute_code
  const duplicateCheck = await client.query(`
    SELECT attribute_code, COUNT(*) as count
    FROM mp_magento_attributes_migrate
    GROUP BY attribute_code
    HAVING COUNT(*) > 1
  `);

  if (duplicateCheck.rows.length > 0) {
    console.log(`⚠️  Found ${duplicateCheck.rows.length} attributes with duplicates:`);
    duplicateCheck.rows.forEach(row => {
      console.log(`   - ${row.attribute_code}: ${row.count} occurrences`);
    });

    // Keep the most recent record for each attribute_code
    await client.query(`
      DELETE FROM mp_magento_attributes_migrate p1
      USING mp_magento_attributes_migrate p2
      WHERE p1.attribute_code = p2.attribute_code
      AND p1.id < p2.id
      AND p1.attribute_id = p2.attribute_id
    `);
    console.log("✅ Removed duplicate attributes");
  } else {
    console.log("✅ No duplicate attributes found");
  }
}

// Print statistics about imported attributes
async function printAttributeStats(client: Client): Promise<void> {
  console.log("\n📈 IMPORTED ATTRIBUTES STATISTICS:");
  
  const stats = await client.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN is_visible THEN 1 END) as visible_count,
      COUNT(CASE WHEN NOT is_visible THEN 1 END) as non_visible_count,
      COUNT(CASE WHEN is_user_defined THEN 1 END) as user_defined_count,
      COUNT(CASE WHEN NOT is_user_defined THEN 1 END) as system_count,
      COUNT(CASE WHEN is_filterable THEN 1 END) as filterable_count,
      COUNT(CASE WHEN is_required THEN 1 END) as required_count,
      COUNT(DISTINCT frontend_input) as input_types_count,
      COUNT(DISTINCT scope) as scope_types_count
    FROM mp_magento_attributes_migrate
  `);

  if (stats.rows[0]) {
    const row = stats.rows[0];
    console.log(`📊 Totals:`);
    console.log(`   Total attributes in DB: ${row.total}`);
    console.log(`   Visible attributes: ${row.visible_count}`);
    console.log(`   Non-visible attributes: ${row.non_visible_count}`);
    console.log(`   User-defined attributes: ${row.user_defined_count}`);
    console.log(`   System attributes: ${row.system_count}`);
    console.log(`   Filterable attributes: ${row.filterable_count}`);
    console.log(`   Required attributes: ${row.required_count}`);
    console.log(`   Different input types: ${row.input_types_count}`);
    console.log(`   Different scope types: ${row.scope_types_count}`);
  }

  // Get breakdown by frontend_input type
  const typeBreakdown = await client.query(`
    SELECT frontend_input, COUNT(*) as count
    FROM mp_magento_attributes_migrate
    GROUP BY frontend_input
    ORDER BY count DESC
  `);

  console.log(`\n🔧 Attribute types breakdown:`);
  typeBreakdown.rows.forEach(row => {
    console.log(`   - ${row.frontend_input}: ${row.count}`);
  });

  // Show non-visible attributes
  const nonVisibleAttrs = await client.query(`
    SELECT attribute_code, default_frontend_label, frontend_input
    FROM mp_magento_attributes_migrate 
    WHERE NOT is_visible 
    ORDER BY attribute_code
  `);

  if (nonVisibleAttrs.rows.length > 0) {
    console.log(`\n👁️  Non-visible attributes imported (${nonVisibleAttrs.rows.length}):`);
    nonVisibleAttrs.rows.forEach(row => {
      console.log(`   - ${row.attribute_code}: ${row.default_frontend_label || row.attribute_code} (${row.frontend_input})`);
    });
  }

  // Show system attributes
  const systemAttrs = await client.query(`
    SELECT attribute_code, default_frontend_label, is_visible
    FROM mp_magento_attributes_migrate 
    WHERE NOT is_user_defined 
    ORDER BY attribute_code
  `);

  if (systemAttrs.rows.length > 0) {
    console.log(`\n⚙️  System attributes imported (${systemAttrs.rows.length}):`);
    systemAttrs.rows.forEach(row => {
      console.log(`   - ${row.attribute_code}: ${row.default_frontend_label || row.attribute_code} ${row.is_visible ? '' : '(non-visible)'}`);
    });
  }
}