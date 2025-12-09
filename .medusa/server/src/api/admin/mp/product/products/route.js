"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("pg");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function client() {
    return new pg_1.Client({ connectionString: process.env.DATABASE_URL });
}
// ====================================
// GET – Fetch all products
// ====================================
async function GET(req, res) {
    try {
        const db = client();
        await db.connect();
        // Read query parameter “q”
        const search = req.query.q ? String(req.query.q).trim() : "";
        let result;
        if (search !== "") {
            // 🔍 Filter by name or product_code
            result = await db.query(`
        SELECT * FROM mp_products
        WHERE 
          LOWER(name) LIKE LOWER($1)
          OR LOWER(product_code) LIKE LOWER($1)
        ORDER BY id DESC
        `, [`%${search}%`]);
        }
        else {
            // No search → return all products
            result = await db.query("SELECT * FROM mp_products ORDER BY id DESC");
        }
        await db.end();
        return res.json({ success: true, products: result.rows });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: err.message
        });
    }
}
// ====================================
// POST – Create product (multi-table insert)
// ====================================
// Configure multer for disk storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'products');
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});
// Middleware to handle multer processing
const processFormData = (req, res) => {
    return new Promise((resolve, reject) => {
        upload.any()(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve(true);
        });
    });
};
async function POST(req, res) {
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
        // Extract arrays - handle both string and array formats
        let categories = [];
        if (req.body.categories) {
            if (Array.isArray(req.body.categories)) {
                categories = req.body.categories.map(id => parseInt(id));
            }
            else if (typeof req.body.categories === 'string') {
                categories = [parseInt(req.body.categories)];
            }
        }
        // Handle categories[] format
        if (req.body['categories[]']) {
            if (Array.isArray(req.body['categories[]'])) {
                categories = req.body['categories[]'].map(id => parseInt(id));
            }
            else {
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
                    }
                    catch (e) {
                        console.error('Failed to parse attribute:', attr);
                        return null;
                    }
                }).filter(attr => attr !== null);
            }
            else if (typeof req.body.attributes === 'string') {
                try {
                    attributes = [JSON.parse(req.body.attributes)];
                }
                catch (e) {
                    console.error('Failed to parse attributes string:', e);
                }
            }
        }
        // Handle gallery files from req.files
        const galleryFiles = req.files || [];
        const gallery = [];
        // Process gallery files and save to local storage
        for (const file of galleryFiles) {
            if (file.fieldname === 'gallery' || file.fieldname.startsWith('gallery_')) {
                // File is already saved by multer, now we just need the path/URL
                const fileUrl = `/uploads/products/${file.filename}`;
                gallery.push({
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
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            });
            return res.status(400).json({
                success: false,
                message: "Missing required fields: product_code, name, and base_price are required"
            });
        }
        await db.query("BEGIN");
        // Insert product - FIXED: Using correct table name and columns
        const productResult = await db.query(`INSERT INTO mp_products
        (product_code, name, short_desc, long_desc, base_price, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
       RETURNING *`, [product_code, name, short_desc, long_desc, parseFloat(base_price), status]);
        const product = productResult.rows[0];
        const productId = product.id;
        // Insert gallery - FIXED: Using correct columns for mp_product_gallery
        for (const g of gallery) {
            await db.query(`INSERT INTO mp_product_gallery
          (product_id, image_type, label, image, created_at, updated_at)
         VALUES ($1,$2,$3,$4,NOW(),NOW())`, [productId, g.image_type, g.label, g.image]);
        }
        // Insert categories - FIXED: Using correct table name mp_product_categories
        for (const catId of categories) {
            await db.query(`INSERT INTO mp_product_categories
          (product_id, category_id, created_at)
         VALUES ($1,$2,NOW())`, [productId, catId]);
        }
        // Insert attributes - FIXED: Using correct table name mp_product_attributes
        for (const attr of attributes) {
            await db.query(`INSERT INTO mp_product_attributes
          (product_id, attribute_id, attribute_value_id, text_value, decimal_value, integer_value, boolean_value, date_value, datetime_value, media_path, sort_order, is_variant, locale, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`, [
                productId,
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
            ]);
        }
        await db.query("COMMIT");
        await db.end();
        return res.json({
            success: true,
            product,
            gallery: gallery.map(g => ({ image: g.image, label: g.label })),
            message: "Product created successfully"
        });
    }
    catch (err) {
        await db.query("ROLLBACK");
        await db.end();
        // Clean up uploaded files on error
        if (req.files) {
            req.files.forEach(file => {
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            });
        }
        console.error("Product creation error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: err.message
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3Byb2R1Y3QvcHJvZHVjdHMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFhQSxrQkF3Q0M7QUF1REQsb0JBaUxDO0FBM1JELDJCQUE0QjtBQUM1QixvREFBNEI7QUFDNUIsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUN4QixTQUFTLE1BQU07SUFDYixPQUFPLElBQUksV0FBTSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRCx1Q0FBdUM7QUFDdkMsMkJBQTJCO0FBQzNCLHVDQUF1QztBQUNoQyxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEdBQUcsTUFBTSxFQUFFLENBQUM7UUFDcEIsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFbkIsMkJBQTJCO1FBQzNCLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBRTdELElBQUksTUFBTSxDQUFDO1FBRVgsSUFBSSxNQUFNLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDbEIsb0NBQW9DO1lBQ3BDLE1BQU0sR0FBRyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQ3JCOzs7Ozs7U0FNQyxFQUNELENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUNoQixDQUFDO1FBQ0osQ0FBQzthQUFNLENBQUM7WUFDTixrQ0FBa0M7WUFDbEMsTUFBTSxHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FDckIs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