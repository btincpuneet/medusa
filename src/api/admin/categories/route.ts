import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

// Define types based on your Magento category response
interface MagentoCategory {
  id: number;
  parent_id: number;
  name: string;
  is_active: boolean;
  position: number;
  level: number;
  product_count: number;
  children_data: MagentoCategory[];
}

interface ImportResults {
  processed: number;
  categories: number;
  errors: string[];
  skipped: number;
  warnings: string[];
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🚀 Starting Magento category import...");

    await client.connect();

    const magentoCategories = await fetchMagentoCategories();
    console.log(`📂 Received root category from Magento`);

    const result = await processAndInsertCategories(client, magentoCategories);

    console.log("✅ Category import completed!");
    console.log(`📊 Results: ${result.processed} processed, ${result.categories} inserted/updated, ${result.errors.length} errors`);

    return res.json({
      success: true,
      message: `Processed ${result.processed} categories successfully`,
      total_categories: result.categories,
      details: result,
    });
  } catch (error: any) {
    console.error("❌ Error importing categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to import categories",
      error: error.message,
    });
  } finally {
    await client.end().catch(console.error);
  }
}

// Function to call Magento Categories API
async function fetchMagentoCategories(): Promise<MagentoCategory> {
  const magentoUrl = "http://local.b2c.com/rest/V1/categories";

  console.log(`🌐 Fetching categories from Magento: ${magentoUrl}`);

  const response = await fetch(magentoUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Magento API responded with status: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Successfully fetched categories from Magento`);
  return data;
}

// Main processing function
async function processAndInsertCategories(
  client: Client,
  magentoCategories: MagentoCategory
): Promise<ImportResults> {
  const results: ImportResults = {
    processed: 0,
    categories: 0,
    errors: [],
    skipped: 0,
    warnings: [],
  };

  try {
    // Count total categories first
    let totalCategoryCount = 0;
    const countCategories = (category: MagentoCategory) => {
      totalCategoryCount++;
      if (category.children_data && category.children_data.length > 0) {
        category.children_data.forEach(child => countCategories(child));
      }
    };
    countCategories(magentoCategories);
    console.log(`📋 Found ${totalCategoryCount} total categories in Magento response`);

    // Process all categories in level order (parents first)
    const allCategories: MagentoCategory[] = [];
    const flattenCategories = (category: MagentoCategory) => {
      allCategories.push(category);
      if (category.children_data && category.children_data.length > 0) {
        category.children_data.forEach(child => flattenCategories(child));
      }
    };
    flattenCategories(magentoCategories);

    // Sort by level to ensure parents are processed first
    allCategories.sort((a, b) => a.level - b.level);

    // Process categories in order
    for (const magentoCategory of allCategories) {
      try {
        console.log(`📝 Processing: ${magentoCategory.name} (Magento ID: ${magentoCategory.id}, Level: ${magentoCategory.level})`);

        // Validate required fields
        if (!magentoCategory.name) {
          results.warnings.push(`Skipping category with missing name: Magento ID ${magentoCategory.id}`);
          results.skipped++;
          continue;
        }

        // Generate unique URL slug
        const urlSlug = await generateUniqueSlug(client, magentoCategory.name, magentoCategory.id);

        // Insert or update category
        await upsertCategory(client, magentoCategory, urlSlug);
        
        results.categories++;
        results.processed++;

        console.log(`✅ Processed: ${magentoCategory.name}`);

      } catch (error: any) {
        const errorMsg = `Error processing category ${magentoCategory.name} (Magento ID: ${magentoCategory.id}): ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log(`✅ Imported ${results.categories} categories out of ${totalCategoryCount} found`);

    return results;
  } catch (error: any) {
    console.error("❌ Error in category processing:", error);
    results.errors.push(`Processing error: ${error.message}`);
    return results;
  }
}

// Generate unique URL slug
async function generateUniqueSlug(client: Client, name: string, magentoId: number): Promise<string> {
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // If slug is empty, use magento ID
  if (!baseSlug) {
    baseSlug = `category-${magentoId}`;
  }

  let slug = baseSlug;
  let counter = 1;

  // Check if slug already exists
  while (true) {
    const existing = await client.query(
      `SELECT id FROM category WHERE url = $1`,
      [slug]
    );

    if (existing.rows.length === 0) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety break to prevent infinite loop
    if (counter > 100) {
      slug = `${baseSlug}-${magentoId}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

// Upsert category into the category table - using magento_category_id for parent relationships
async function upsertCategory(
  client: Client,
  magentoCategory: MagentoCategory,
  urlSlug: string
): Promise<number> {
  // Determine parent_id - use magento parent_id directly (NULL for root categories)
  let parentId: number | null = magentoCategory.parent_id > 1 ? magentoCategory.parent_id : null;

  // Try to find existing category by magento_category_id
  const existingCategory = await client.query(
    `SELECT id FROM category WHERE magento_category_id = $1`,
    [magentoCategory.id]
  );

  const description = `Imported from Magento. Product count: ${magentoCategory.product_count}`;
  const status = magentoCategory.is_active;

  if (existingCategory.rows.length > 0) {
    // Update existing category
    const categoryId = existingCategory.rows[0].id;
    await client.query(
      `UPDATE category 
       SET name = $1, url = $2, parent_id = $3, description = $4, status = $5, 
           position = $6, level = $7, magento_category_id = $8, updated_at = NOW()
       WHERE id = $9`,
      [
        magentoCategory.name,
        urlSlug,
        parentId,
        description,
        status,
        magentoCategory.position,
        magentoCategory.level,
        magentoCategory.id,
        categoryId
      ]
    );
    return categoryId;
  } else {
    // Insert new category
    const result = await client.query(
      `INSERT INTO category (name, url, parent_id, description, status, position, level, magento_category_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id`,
      [
        magentoCategory.name,
        urlSlug,
        parentId,
        description,
        status,
        magentoCategory.position,
        magentoCategory.level,
        magentoCategory.id
      ]
    );
    return result.rows[0].id;
  }
}