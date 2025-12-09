"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const pg_1 = require("pg");
async function POST(req, res) {
    const client = new pg_1.Client({
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
    }
    catch (error) {
        console.error("❌ Error importing categories:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to import categories",
            error: error.message,
        });
    }
    finally {
        await client.end().catch(console.error);
    }
}
// Function to call Magento Categories API
async function fetchMagentoCategories() {
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
async function processAndInsertCategories(client, magentoCategories) {
    const results = {
        processed: 0,
        categories: 0,
        errors: [],
        skipped: 0,
        warnings: [],
    };
    try {
        // Count total categories first
        let totalCategoryCount = 0;
        const countCategories = (category) => {
            totalCategoryCount++;
            if (category.children_data && category.children_data.length > 0) {
                category.children_data.forEach(child => countCategories(child));
            }
        };
        countCategories(magentoCategories);
        console.log(`📋 Found ${totalCategoryCount} total categories in Magento response`);
        // Process all categories in level order (parents first)
        const allCategories = [];
        const flattenCategories = (category) => {
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
            }
            catch (error) {
                const errorMsg = `Error processing category ${magentoCategory.name} (Magento ID: ${magentoCategory.id}): ${error.message}`;
                console.error(`❌ ${errorMsg}`);
                results.errors.push(errorMsg);
            }
        }
        console.log(`✅ Imported ${results.categories} categories out of ${totalCategoryCount} found`);
        return results;
    }
    catch (error) {
        console.error("❌ Error in category processing:", error);
        results.errors.push(`Processing error: ${error.message}`);
        return results;
    }
}
// Generate unique URL slug
async function generateUniqueSlug(client, name, magentoId) {
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
        const existing = await client.query(`SELECT id FROM category WHERE url = $1`, [slug]);
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
async function upsertCategory(client, magentoCategory, urlSlug) {
    // Determine parent_id - use magento parent_id directly (NULL for root categories)
    let parentId = magentoCategory.parent_id > 1 ? magentoCategory.parent_id : null;
    // Try to find existing category by magento_category_id
    const existingCategory = await client.query(`SELECT id FROM category WHERE magento_category_id = $1`, [magentoCategory.id]);
    const description = `Imported from Magento. Product count: ${magentoCategory.product_count}`;
    const status = magentoCategory.is_active;
    if (existingCategory.rows.length > 0) {
        // Update existing category
        const categoryId = existingCategory.rows[0].id;
        await client.query(`UPDATE category 
       SET name = $1, url = $2, parent_id = $3, description = $4, status = $5, 
           position = $6, level = $7, magento_category_id = $8, updated_at = NOW()
       WHERE id = $9`, [
            magentoCategory.name,
            urlSlug,
            parentId,
            description,
            status,
            magentoCategory.position,
            magentoCategory.level,
            magentoCategory.id,
            categoryId
        ]);
        return categoryId;
    }
    else {
        // Insert new category
        const result = await client.query(`INSERT INTO category (name, url, parent_id, description, status, position, level, magento_category_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id`, [
            magentoCategory.name,
            urlSlug,
            parentId,
            description,
            status,
            magentoCategory.position,
            magentoCategory.level,
            magentoCategory.id
        ]);
        return result.rows[0].id;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2NhdGVnb3JpZXMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUF1QkEsb0JBa0NDO0FBeERELDJCQUE0QjtBQXNCckIsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sTUFBTSxHQUFHLElBQUksV0FBTSxDQUFDO1FBQ3hCLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWTtLQUMzQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7UUFFdEQsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdkIsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLHNCQUFzQixFQUFFLENBQUM7UUFDekQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1FBRXRELE1BQU0sTUFBTSxHQUFHLE1BQU0sMEJBQTBCLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFFM0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxNQUFNLENBQUMsU0FBUyxlQUFlLE1BQU0sQ0FBQyxVQUFVLHNCQUFzQixNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sU0FBUyxDQUFDLENBQUM7UUFFaEksT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2QsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUUsYUFBYSxNQUFNLENBQUMsU0FBUywwQkFBMEI7WUFDaEUsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLFVBQVU7WUFDbkMsT0FBTyxFQUFFLE1BQU07U0FDaEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENB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