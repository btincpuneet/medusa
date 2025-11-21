import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from 'pg';

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("=== Starting PostgreSQL connection test ===");
  
  try {
    const databaseUrl = process.env.DATABASE_URL;
    console.log("DATABASE_URL available:", !!databaseUrl);

    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        message: "DATABASE_URL environment variable is not set"
      });
    }

    const client = new Client({
      connectionString: databaseUrl,
    });

    console.log("Attempting to connect to PostgreSQL...");
    await client.connect();
    console.log("✅ Connected to PostgreSQL successfully!");

    // Test simple query first
    console.log("Testing simple query...");
    const testQuery = await client.query('SELECT NOW() as current_time');
    console.log("✅ Time query successful:", testQuery.rows[0]);

    // Check if sellers table exists
    console.log("Checking if sellers table exists...");
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sellers'
      )
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log("Sellers table exists:", tableExists);

    if (!tableExists) {
      console.log("Creating sellers table...");
      await client.query(`
        CREATE TABLE sellers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          address TEXT,
          phone VARCHAR(50),
          email VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("✅ Sellers table created!");
    }

    // Now insert the test record
    console.log("Inserting test seller...");
    const result = await client.query(
      `INSERT INTO sellers (name, email, address, phone, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING id, name, email`,
      [
        'Test Seller',
        'test@example.com', 
        '123 Test Address',
        '+1234567890'
      ]
    );

    console.log("✅ Insertion successful:", result.rows[0]);

    await client.end();
    console.log("✅ Connection closed");

    return res.json({
      success: true,
      message: "Seller inserted successfully",
      seller: result.rows[0],
      tableCreated: !tableExists
    });

  } catch (error) {
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: "Failed to insert seller",
      error: error.message,
      code: error.code
    });
  }
}