import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// GET – Fetch single product with relations (fixed)
// ====================================

// export async function GET(req: MedusaRequest, res: MedusaResponse) {
//   const { id } = req.params;

//   try {
//     const db = client();
//     await db.connect();

//     const product = await db.query("SELECT * FROM mp_products WHERE id = $1", [id]);
//     if (product.rows.length === 0) {
//       return res.status(404).json({ success: false, message: "Product not found" });
//     }

//     const categories = await db.query(
//       `SELECT c.id, c.name FROM mp_categories c 
//        JOIN mp_product_categories pc ON pc.category_id = c.id
//        WHERE pc.product_id = $1`,
//       [id]
//     );

//     const gallery = await db.query("SELECT * FROM mp_product_gallery WHERE product_id = $1", [id]);

//     const attributes = await db.query(
//       `SELECT pa.*, a.label, av.value 
//        FROM mp_product_attributes pa
//        JOIN mp_attributes a ON a.id = pa.attribute_id
//        JOIN mp_attribute_values av ON av.id = pa.attribute_value_id
//        WHERE pa.product_id = $1`,
//       [id]
//     );

//     await db.end();

//     return res.json({
//       success: true,
//       product: product.rows[0],
//       gallery: gallery.rows,
//       categories: categories.rows,
//       categoryIds: categories.rows.map((c) => c.id), // <<< THIS LINE FIXES YOUR ISSUE
//       attributes: attributes.rows
//     });

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch product",
//       error: err.message
//     });
//   }
// }

// Also update your GET endpoint to fetch product with attributes and gallery
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const db = client();
  await db.connect();

  try {
    // Get product
    const productResult = await db.query(
      `SELECT * FROM mp_products WHERE id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const product = productResult.rows[0];
    console.log('products',product);
    // Get categories
    const categoriesResult = await db.query(
      `SELECT category_id FROM mp_product_categories WHERE product_id = $1`,
      [id]
    );
    const categoryIds = categoriesResult.rows.map(row => row.category_id);
      console.log('categoryIDS',categoryIds);
    // Get gallery
    const galleryResult = await db.query(
      `SELECT * FROM mp_product_gallery WHERE product_id = $1`,
      [id]
    );
    const gallery = galleryResult.rows;
console.log('gallery',gallery);
    // Get attributes
    const attributesResult = await db.query(
      `SELECT * FROM mp_product_attributes WHERE product_id = $1`,
      [id]
    );
    const attributes = attributesResult.rows;
    console.log('attributes',attributes);

    await db.end();

    return res.json({
      success: true,
      product,
      categoryIds,
      gallery,
      attributes
    });

  } catch (err) {
    await db.end();
    console.error("Product fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: err.message
    });
  }
}



// ====================================
// PUT – Update product + relations
// ====================================
// export async function PUT(req: MedusaRequest, res: MedusaResponse) {
//   const { id } = req.params;

//   const {
//     product_code,
//     name,
//     short_desc,
//     long_desc,
//     base_price,
//     status,
//     gallery = [],
//     categories = [],
//     attributes = []
//   } = req.body;

//   const db = client();
//   await db.connect();

//   try {
//     await db.query("BEGIN");

//     // 1. Update product
//     await db.query(
//       `UPDATE mp_products SET
//         product_code = $1,
//         name = $2,
//         short_desc = $3,
//         long_desc = $4,
//         base_price = $5,
//         status = $6,
//         updated_at = NOW()
//        WHERE id = $7`,
//       [product_code, name, short_desc, long_desc, base_price, status, id]
//     );

//     // 2. Reset & insert gallery
//     await db.query("DELETE FROM mp_product_gallery WHERE product_id = $1", [id]);
//     for (const g of gallery) {
//       await db.query(
//         `INSERT INTO mp_product_gallery (product_id, image_type, label, image_url, created_at, updated_at)
//          VALUES ($1,$2,$3,$4,NOW(),NOW())`,
//         [id, g.image_type, g.label, g.image_url]
//       );
//     }

//     // 3. Reset & insert categories
//     await db.query("DELETE FROM mp_product_categories WHERE product_id = $1", [id]);
//     for (const catId of categories) {
//       await db.query(
//         `INSERT INTO mp_product_categories (product_id, category_id, created_at)
//          VALUES ($1,$2,NOW())`,
//         [id, catId]
//       );
//     }

//     // 4. Reset & insert attributes
//     await db.query("DELETE FROM mp_product_attributes WHERE product_id = $1", [id]);
//     for (const a of attributes) {
//       await db.query(
//         `INSERT INTO mp_product_attributes (product_id, attribute_id, attribute_value_id, created_at, updated_at)
//          VALUES ($1,$2,$3,NOW(),NOW())`,
//         [id, a.attribute_id, a.attribute_value_id]
//       );
//     }

//     await db.query("COMMIT");
//     await db.end();

//     return res.json({
//       success: true,
//       message: "Product updated successfully"
//     });

//   } catch (err) {
//     await db.query("ROLLBACK");
//     await db.end();
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update product",
//       error: err.message
//     });
//   }
// }




// Configure multer for disk storage (same as POST)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'products');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const processFormData = (req, res) => {
  return new Promise((resolve, reject) => {
    upload.any()(req, res, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const db = client();
  await db.connect();

  try {
    // Process form data with multer
    await processFormData(req, res);

    // Extract form fields from req.body
    const product_code = req.body.product_code;
    const name = req.body.name;
    const short_desc = req.body.short_desc;
    const long_desc = req.body.long_desc;
    const base_price = req.body.base_price;
    const status = req.body.status || 'active';
    
    // Extract categories
    let categories = [];
    if (req.body.categories) {
      if (Array.isArray(req.body.categories)) {
        categories = req.body.categories.map(id => parseInt(id));
      } else if (typeof req.body.categories === 'string') {
        categories = [parseInt(req.body.categories)];
      }
    }

    // Handle categories[] format
    if (req.body['categories[]']) {
      if (Array.isArray(req.body['categories[]'])) {
        categories = req.body['categories[]'].map(id => parseInt(id));
      } else {
        categories = [parseInt(req.body['categories[]'])];
      }
    }

    // Parse attributes
    let attributes = [];
    if (req.body.attributes) {
      if (Array.isArray(req.body.attributes)) {
        attributes = req.body.attributes.map(attr => {
          try {
            return typeof attr === 'string' ? JSON.parse(attr) : attr;
          } catch (e) {
            console.error('Failed to parse attribute:', attr);
            return null;
          }
        }).filter(attr => attr !== null);
      } else if (typeof req.body.attributes === 'string') {
        try {
          attributes = [JSON.parse(req.body.attributes)];
        } catch (e) {
          console.error('Failed to parse attributes string:', e);
        }
      }
    }

    // Handle existing gallery images
    let existingGallery = [];
    if (req.body.existing_gallery) {
      try {
        existingGallery = typeof req.body.existing_gallery === 'string' 
          ? JSON.parse(req.body.existing_gallery) 
          : req.body.existing_gallery;
      } catch (e) {
        console.error('Failed to parse existing gallery:', e);
      }
    }

    // Handle new gallery files from req.files
    const galleryFiles = req.files || [];
    const newGallery = [];
    
    // Process new gallery files
    for (const file of galleryFiles) {
      if (file.fieldname === 'gallery') {
        const fileUrl = `/uploads/products/${file.filename}`;
        
        newGallery.push({
          image_type: "gallery",
          label: file.originalname || 'gallery_image',
          image: fileUrl,
        });
      }
    }

    // Validate required fields
    if (!product_code || !name || !base_price) {
      // Clean up uploaded files if validation fails
      galleryFiles.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      
      return res.status(400).json({
        success: false,
        message: "Missing required fields: product_code, name, and base_price are required"
      });
    }

    await db.query("BEGIN");

    // 1. Update product
    const productResult = await db.query(
      `UPDATE mp_products SET
        product_code = $1,
        name = $2,
        short_desc = $3,
        long_desc = $4,
        base_price = $5,
        status = $6,
        updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [product_code, name, short_desc, long_desc, parseFloat(base_price), status, id]
    );

    const product = productResult.rows[0];

    if (!product) {
      throw new Error("Product not found");
    }

    // 2. Handle gallery - delete all existing and insert combined gallery
    await db.query("DELETE FROM mp_product_gallery WHERE product_id = $1", [id]);
    
    // Combine existing and new gallery images
    const allGallery = [...existingGallery, ...newGallery];
    for (const g of allGallery) {
      await db.query(
        `INSERT INTO mp_product_gallery
          (product_id, image_type, label, image, created_at, updated_at)
         VALUES ($1,$2,$3,$4,NOW(),NOW())`,
        [id, g.image_type, g.label, g.image]
      );
    }

    // 3. Reset & insert categories
    await db.query("DELETE FROM mp_product_categories WHERE product_id = $1", [id]);
    for (const catId of categories) {
      await db.query(
        `INSERT INTO mp_product_categories
          (product_id, category_id, created_at)
         VALUES ($1,$2,NOW())`,
        [id, catId]
      );
    }

    // 4. Reset & insert attributes (supports ALL types)
    await db.query("DELETE FROM mp_product_attributes WHERE product_id = $1", [id]);
    for (const attr of attributes) {
      await db.query(
        `INSERT INTO mp_product_attributes
          (product_id, attribute_id, attribute_value_id, text_value, decimal_value, integer_value, boolean_value, date_value, datetime_value, media_path, sort_order, is_variant, locale, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
        [
          id,
          attr.attribute_id,
          attr.attribute_value_id || null,
          attr.text_value || null,
          attr.decimal_value || null,
          attr.integer_value || null,
          (attr.boolean_value === false || attr.boolean_value === true) ? attr.boolean_value : null,
          attr.date_value || null,
          attr.datetime_value || null,
          attr.media_path || null,
          attr.sort_order || 0,
          attr.is_variant ?? false,
          attr.locale || "en"
        ]
      );
    }

    await db.query("COMMIT");
    await db.end();

    return res.json({
      success: true,
      product,
      message: "Product updated successfully"
    });

  } catch (err) {
    await db.query("ROLLBACK");
    await db.end();
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    console.error("Product update error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: err.message
    });
  }
}



// ====================================
// DELETE – Remove product
// ====================================
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;

  try {
    const db = client();
    await db.connect();

    const result = await db.query(
      "DELETE FROM mp_products WHERE id = $1 RETURNING id",
      [id]
    );

    await db.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.json({
      success: true,
      message: "Product deleted",
      id: result.rows[0].id
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: err.message
    });
  }
}
