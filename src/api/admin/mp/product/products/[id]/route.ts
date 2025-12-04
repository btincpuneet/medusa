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


// Also update your GET endpoint to fetch product with attributes and gallery
// export async function GET(req: MedusaRequest, res: MedusaResponse) {
//   const { id } = req.params;
//   const db = client();
//   await db.connect();

//   try {
//     // Get product
//     const productResult = await db.query(
//       `SELECT * FROM mp_products WHERE id = $1`,
//       [id]
//     );

//     if (productResult.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found"
//       });
//     }

//     const product = productResult.rows[0];

//     // Get categories
//     const categoriesResult = await db.query(
//       `SELECT category_id FROM mp_product_categories WHERE product_id = $1`,
//       [id]
//     );
//     const categoryIds = categoriesResult.rows.map(row => row.category_id);

//     // Get gallery
//     const galleryResult = await db.query(
//       `SELECT * FROM mp_product_gallery WHERE product_id = $1`,
//       [id]
//     );
//     const gallery = galleryResult.rows;

//     // Get attributes
//     const attributesResult = await db.query(
//       `SELECT * FROM mp_product_attributes WHERE product_id = $1`,
//       [id]
//     );
//     const attributes = attributesResult.rows;

//     await db.end();

//     return res.json({
//       success: true,
//       product,
//       categoryIds,
//       gallery,
//       attributes
//     });

//   } catch (err) {
//     await db.end();
//     console.error("Product fetch error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch product",
//       error: err.message
//     });
//   }
// }
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const db = client();
  await db.connect();

  try {
    // Get product with attribute set name
    const productResult = await db.query(
      `SELECT 
        p.*,
        aset.name as attribute_set_name
       FROM mp_products p
       LEFT JOIN mp_attribute_sets aset ON p.attribute_set_id = aset.id
       WHERE p.id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const product = productResult.rows[0];

    // Get categories with full category info
    const categoriesResult = await db.query(
      `SELECT 
        c.*,
        pc.category_id
       FROM mp_product_categories pc
       JOIN mp_categories c ON pc.category_id = c.id
       WHERE pc.product_id = $1`,
      [id]
    );
    const categories = categoriesResult.rows;
    const categoryIds = categories.map(row => row.category_id);

    // Get gallery
    const galleryResult = await db.query(
      `SELECT * FROM mp_product_gallery WHERE product_id = $1 ORDER BY id`,
      [id]
    );
    const gallery = galleryResult.rows.map(img => ({
      ...img,
      image_url: img.image,
      path: img.image
    }));

    // Get attributes with attribute details - FIXED: removed reference to non-existent table
    const attributesResult = await db.query(
      `SELECT 
        pa.*,
        a.label as attribute_label,
        a.attribute_type,
        a.is_required,
        av.value as attribute_value_label
       FROM mp_product_attributes pa
       LEFT JOIN mp_attributes a ON pa.attribute_id = a.id
       LEFT JOIN mp_attribute_values av ON pa.attribute_value_id = av.id
       WHERE pa.product_id = $1
       ORDER BY pa.attribute_id, pa.id`,
      [id]
    );
    
    // Process attributes - group multiselect values
    const rawAttributes = attributesResult.rows;
    const processedAttributes = [];
    
    // Group by attribute_id to handle multiselect
    const attributeGroups = {};
    
    for (const attr of rawAttributes) {
      if (!attributeGroups[attr.attribute_id]) {
        attributeGroups[attr.attribute_id] = {
          ...attr,
          // For multiselect, we need to collect all attribute_value_ids
          attribute_value_ids: attr.attribute_value_id ? [attr.attribute_value_id] : []
        };
      } else {
        // For multiselect, add to existing group
        if (attr.attribute_value_id) {
          attributeGroups[attr.attribute_id].attribute_value_ids.push(attr.attribute_value_id);
        }
      }
    }
    
    // Convert groups to array and clean up structure
    Object.values(attributeGroups).forEach(attr => {
      const processedAttr = {
        attribute_id: attr.attribute_id,
        text_value: attr.text_value,
        decimal_value: attr.decimal_value,
        integer_value: attr.integer_value,
        boolean_value: attr.boolean_value,
        attribute_value_id: attr.attribute_value_id,
        attribute_value_ids: attr.attribute_value_ids.length > 1 ? attr.attribute_value_ids : [],
        media_path: attr.media_path,
        date_value: attr.date_value,
        datetime_value: attr.datetime_value,
        // Include attribute details for frontend
        attribute_label: attr.attribute_label,
        attribute_type: attr.attribute_type,
        is_required: attr.is_required,
        attribute_value_label: attr.attribute_value_label
      };
      
      // For multiselect, clear the single attribute_value_id if we have multiple
      if (processedAttr.attribute_value_ids.length > 1) {
        processedAttr.attribute_value_id = null;
      }
      
      processedAttributes.push(processedAttr);
    });

    // Get attribute set details if product has one
    let attributeSet = null;
    if (product.attribute_set_id) {
      const attributeSetResult = await db.query(
        `SELECT * FROM mp_attribute_sets WHERE id = $1`,
        [product.attribute_set_id]
      );
      
      if (attributeSetResult.rows.length > 0) {
        attributeSet = attributeSetResult.rows[0];
      }
    }

    // Get attribute values for attributes (for dropdowns) - FIXED: simplified query
    const attributeIds = processedAttributes.map(attr => attr.attribute_id);
    let attributeValues = {};
    
    if (attributeIds.length > 0) {
      const valuesResult = await db.query(
        `SELECT 
          av.attribute_id,
          av.id as value_id,
          av.value
         FROM mp_attribute_values av
         WHERE av.attribute_id IN (${attributeIds.map((_, i) => `$${i + 1}`).join(',')})
         ORDER BY av.attribute_id, av.sort_order`,
        attributeIds
      );
      
      // Group values by attribute_id
      valuesResult.rows.forEach(row => {
        if (!attributeValues[row.attribute_id]) {
          attributeValues[row.attribute_id] = [];
        }
        attributeValues[row.attribute_id].push({
          id: row.value_id,
          value: row.value,
          label: row.value  // Using value as label since there's no separate label table
        });
      });
      
      // Add values to each attribute
      processedAttributes.forEach(attr => {
        if (attributeValues[attr.attribute_id]) {
          attr.values = attributeValues[attr.attribute_id];
        }
      });
    }

    await db.end();

    return res.json({
      success: true,
      product: {
        ...product,
        // Return attribute_set_id as string for the form
        attribute_set: product.attribute_set_id ? product.attribute_set_id.toString() : "",
        // Keep the full attribute set object
        attribute_set_obj: product.attribute_set_id ? {
          id: product.attribute_set_id,
          name: product.attribute_set_name
        } : null
      },
      categories,
      categoryIds,
      gallery,
      attributes: processedAttributes,
      attributeSet
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

// Process multipart form data
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
    const short_desc = req.body.short_desc || null;
    const long_desc = req.body.long_desc || null;
    const base_price = req.body.base_price;
    const status = req.body.status || 'active';
    const visibility = req.body.visibility || 'catalogsearch';
    const attribute_set = req.body.attribute_set || null;
    
    // Extract categories
    let categories = [];
    
    // Check for categories array format
    if (req.body.categories && Array.isArray(req.body.categories)) {
      categories = req.body.categories.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    } else if (req.body.categories && typeof req.body.categories === 'string') {
      // Check if it's a comma-separated string first
      if (req.body.categories.includes(',')) {
        categories = req.body.categories
          .split(',')
          .map(id => parseInt(id.trim(), 10))
          .filter(id => !isNaN(id));
      } else {
        const parsed = parseInt(req.body.categories, 10);
        if (!isNaN(parsed)) categories = [parsed];
      }
    }
    
    // Check for 'categories[]' format
    if (categories.length === 0 && req.body['categories[]']) {
      if (Array.isArray(req.body['categories[]'])) {
        categories = req.body['categories[]']
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));
      } else if (typeof req.body['categories[]'] === 'string') {
        const parsed = parseInt(req.body['categories[]'], 10);
        if (!isNaN(parsed)) categories = [parsed];
      }
    }

    // Parse attributes - FIXED: Handle the way form sends attributes
    let attributes = [];
    if (req.body.attributes) {
      if (Array.isArray(req.body.attributes)) {
        attributes = req.body.attributes.map(attr => {
          try {
            if (typeof attr === 'string') {
              return JSON.parse(attr);
            }
            return attr;
          } catch (e) {
            console.error('Failed to parse attribute:', attr);
            return null;
          }
        }).filter(attr => attr !== null);
      } else if (typeof req.body.attributes === 'string') {
        try {
          // Handle both JSON array and single object
          const parsed = JSON.parse(req.body.attributes);
          if (Array.isArray(parsed)) {
            attributes = parsed;
          } else if (parsed && typeof parsed === 'object') {
            attributes = [parsed];
          }
        } catch (e) {
          console.error('Failed to parse attributes string:', e);
        }
      }
    }

    // Handle existing gallery images - FIXED: Parse correctly from form data
    let existingGalleryIds = [];
    if (req.body.existing_gallery) {
      if (Array.isArray(req.body.existing_gallery)) {
        existingGalleryIds = req.body.existing_gallery
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));
      } else if (typeof req.body.existing_gallery === 'string') {
        try {
          // Try parsing as JSON first
          const parsed = JSON.parse(req.body.existing_gallery);
          if (Array.isArray(parsed)) {
            existingGalleryIds = parsed
              .map(id => parseInt(id, 10))
              .filter(id => !isNaN(id));
          } else {
            const id = parseInt(req.body.existing_gallery, 10);
            if (!isNaN(id)) existingGalleryIds = [id];
          }
        } catch (e) {
          // If not JSON, treat as single ID or comma-separated
          if (req.body.existing_gallery.includes(',')) {
            existingGalleryIds = req.body.existing_gallery
              .split(',')
              .map(id => parseInt(id.trim(), 10))
              .filter(id => !isNaN(id));
          } else {
            const id = parseInt(req.body.existing_gallery, 10);
            if (!isNaN(id)) existingGalleryIds = [id];
          }
        }
      }
    }

    // Handle new gallery files - FIXED: Check for correct field names
    const galleryFiles = Array.isArray(req.files) ? req.files : [];
    const newGallery = [];
    
    // Process new gallery files
    for (const file of galleryFiles) {
      // Check for both naming patterns
      if (file.fieldname.startsWith('new_gallery') || 
          file.fieldname.startsWith('gallery') || 
          file.fieldname === 'gallery') {
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
        if (file.path && fs.existsSync(file.path)) {
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
        visibility = $7,
        attribute_set_id = $8,
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        product_code, 
        name, 
        short_desc, 
        long_desc, 
        parseFloat(base_price), 
        status,
        visibility,
        attribute_set,
        id
      ]
    );

    const product = productResult.rows[0];

    if (!product) {
      throw new Error("Product not found");
    }

    // 2. Handle gallery - delete only non-existing images and add new ones
    if (existingGalleryIds.length > 0) {
      // Delete only images that are not in the existingGalleryIds list
      await db.query(
        `DELETE FROM mp_product_gallery 
         WHERE product_id = $1 
         AND id NOT IN (${existingGalleryIds.map((_, i) => `$${i + 2}`).join(',')})`,
        [id, ...existingGalleryIds]
      );
    } else {
      // If no existing images specified, delete all
      await db.query("DELETE FROM mp_product_gallery WHERE product_id = $1", [id]);
    }
    
    // Insert new gallery images
    if (newGallery.length > 0) {
      for (const g of newGallery) {
        await db.query(
          `INSERT INTO mp_product_gallery
            (product_id, image_type, label, image, created_at, updated_at)
           VALUES ($1,$2,$3,$4,NOW(),NOW())`,
          [id, g.image_type || 'gallery', g.label || 'Image', g.image]
        );
      }
    }

    // 3. Reset & insert categories
    await db.query("DELETE FROM mp_product_categories WHERE product_id = $1", [id]);
    if (categories.length > 0) {
      for (const catId of categories) {
        await db.query(
          `INSERT INTO mp_product_categories
            (product_id, category_id, created_at)
           VALUES ($1,$2,NOW())`,
          [id, catId]
        );
      }
    }

    // 4. Reset & insert attributes - FIXED: Handle text_value and other fields properly
    await db.query("DELETE FROM mp_product_attributes WHERE product_id = $1", [id]);
    if (attributes.length > 0) {
      for (const attr of attributes) {
        // Validate required attribute_id
        if (!attr.attribute_id) {
          console.warn('Skipping attribute without attribute_id:', attr);
          continue;
        }

        // Handle attribute_value_ids for multiselect
        if (attr.attribute_value_ids && Array.isArray(attr.attribute_value_ids) && attr.attribute_value_ids.length > 0) {
          // For multiselect, insert multiple rows
          for (const valueId of attr.attribute_value_ids) {
            await db.query(
              `INSERT INTO mp_product_attributes
                (product_id, attribute_id, attribute_value_id, text_value, decimal_value, integer_value, boolean_value, date_value, datetime_value, media_path, sort_order, is_variant, locale, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
              [
                id,
                attr.attribute_id,
                valueId,
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
        } else {
          // For single value attributes
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
      }
    }

    await db.query("COMMIT");
    await db.end();

    return res.json({
      success: true,
      product,
      message: "Product updated successfully"
    });

  } catch (err) {
    // Ensure we rollback and end connection
    try {
      await db.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }
    
    try {
      await db.end();
    } catch (endErr) {
      console.error("Connection end error:", endErr);
    }
    
    // Clean up uploaded files on error
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        if (file && file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkErr) {
            console.error("Failed to delete file:", unlinkErr);
          }
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
