import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from 'pg';

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Get counts from all tables
    const productCount = await client.query('SELECT COUNT(*) as count FROM products');
    const variantCount = await client.query('SELECT COUNT(*) as count FROM product_variants');
    const sellerCount = await client.query('SELECT COUNT(*) as count FROM sellers');
    const attributeCount = await client.query('SELECT COUNT(*) as count FROM attributes');
    const attributeValueCount = await client.query('SELECT COUNT(*) as count FROM attribute_values');
    const listingCount = await client.query('SELECT COUNT(*) as count FROM product_listings');

    // Get recent products
    const recentProducts = await client.query(`
      SELECT p.product_code, p.name, p.status, p.created_at, COUNT(pva.id) as attribute_count
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_variant_attributes pva ON pv.id = pva.variant_id
      GROUP BY p.id, p.product_code, p.name, p.status, p.created_at
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    return res.json({
      success: true,
      counts: {
        products: parseInt(productCount.rows[0].count),
        variants: parseInt(variantCount.rows[0].count),
        sellers: parseInt(sellerCount.rows[0].count),
        attributes: parseInt(attributeCount.rows[0].count),
        attribute_values: parseInt(attributeValueCount.rows[0].count),
        listings: parseInt(listingCount.rows[0].count),
      },
      recent_products: recentProducts.rows
    });

  } catch (error) {
    console.error("Error checking status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check import status",
      error: error.message
    });
  } finally {
    await client.end();
  }
}