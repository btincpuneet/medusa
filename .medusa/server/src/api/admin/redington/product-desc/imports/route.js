"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.GET = void 0;
const product_desc_import_1 = require("../../../../../lib/product-desc-import");
const pg_1 = require("../../../../../lib/pg");
const clampLimit = (value, fallback = 20, max = 50) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.min(Math.trunc(parsed), max);
};
const clampOffset = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }
    return Math.trunc(parsed);
};
const GET = async (req, res) => {
    const limit = clampLimit(req.query?.limit);
    const offset = clampOffset(req.query?.offset);
    const { logs, count } = await (0, pg_1.listProductDescImportLogs)({
        limit,
        offset,
    });
    res.json({
        imports: logs,
        count,
        limit,
        offset,
    });
};
exports.GET = GET;
const POST = async (req, res) => {
    const body = (req.body || {});
    const filename = (body.filename || "").trim();
    const content = (body.content || "").trim();
    const notes = body.notes?.trim() || null;
    if (!filename.length || !content.length) {
        return res.status(400).json({
            message: "filename and content (base64) are required.",
        });
    }
    let buffer;
    try {
        buffer = Buffer.from(content, "base64");
    }
    catch {
        return res.status(400).json({
            message: "content must be a valid base64 string.",
        });
    }
    let rows;
    try {
        rows = (0, product_desc_import_1.extractProductDescriptionRows)(buffer, filename);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to parse uploaded file.";
        return res.status(400).json({ message });
    }
    if (!rows.length) {
        return res.status(400).json({
            message: "No valid rows were found in the uploaded file.",
        });
    }
    if (rows.length > 5000) {
        return res.status(400).json({
            message: "Import batches are limited to 5,000 rows at a time.",
        });
    }
    const productService = req.scope.resolve("product");
    const job = await (0, pg_1.insertProductDescImportLog)({
        file_name: filename,
        status: "processing",
        notes,
        total_rows: rows.length,
    });
    try {
        const result = await (0, product_desc_import_1.applyProductDescriptions)(productService, rows);
        await (0, pg_1.updateProductDescImportLog)(job.id, {
            status: "completed",
            total_rows: result.summary.total,
            success_rows: result.summary.updated,
            failed_rows: result.summary.failed,
            log: result.results,
        });
        res.status(201).json({
            import_id: job.id,
            summary: result.summary,
            results: result.results,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Failed to process import.";
        await (0, pg_1.updateProductDescImportLog)(job.id, {
            status: "failed",
            log: [
                {
                    status: "failed",
                    message,
                },
            ],
        });
        res.status(500).json({ message });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9wcm9kdWN0LWRlc2MvaW1wb3J0cy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFNQSxnRkFHK0M7QUFFL0MsOENBSThCO0FBRTlCLE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBYyxFQUFFLFFBQVEsR0FBRyxFQUFFLEVBQUUsR0FBRyxHQUFHLEVBQUUsRUFBRSxFQUFFO0lBQzdELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDNUMsT0FBTyxRQUFRLENBQUE7SUFDakIsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQzFDLENBQUMsQ0FBQTtBQUVELE1BQU0sV0FBVyxHQUFHLENBQUMsS0FBYyxFQUFFLEVBQUU7SUFDckMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUMzQyxPQUFPLENBQUMsQ0FBQTtJQUNWLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDM0IsQ0FBQyxDQUFBO0FBRU0sTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ25FLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQzFDLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBRTdDLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsTUFBTSxJQUFBLDhCQUF5QixFQUFDO1FBQ3RELEtBQUs7UUFDTCxNQUFNO0tBQ1AsQ0FBQyxDQUFBO0lBRUYsR0FBRyxDQUFDLElBQUksQ0FBQztRQUNQLE9BQU8sRUFBRSxJQUFJO1FBQ2IsS0FBSztRQUNMLEtBQUs7UUFDTCxNQUFNO0tBQ1AsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBO0FBZlksUUFBQSxHQUFHLE9BZWY7QUFRTSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBc0IsQ0FBQTtJQUNsRCxNQUFNLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDN0MsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQzNDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFBO0lBRXhDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3hDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLDZDQUE2QztTQUN2RCxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsSUFBSSxNQUFjLENBQUE7SUFDbEIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ3pDLENBQUM7SUFBQyxNQUFNLENBQUM7UUFDUCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSx3Q0FBd0M7U0FDbEQsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELElBQUksSUFBNkIsQ0FBQTtJQUNqQyxJQUFJLENBQUM7UUFDSCxJQUFJLEdBQUcsSUFBQSxtREFBNkIsRUFBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDeEQsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixNQUFNLE9BQU8sR0FDWCxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxnQ0FBZ0MsQ0FBQTtRQUMzRSxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtJQUMxQyxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNqQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxnREFBZ0Q7U0FDMUQsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQztRQUN2QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxxREFBcUQ7U0FDL0QsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUN0QyxTQUFTLENBQzRCLENBQUE7SUFFdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFBLCtCQUEwQixFQUFDO1FBQzNDLFNBQVMsRUFBRSxRQUFRO1FBQ25CLE1BQU0sRUFBRSxZQUFZO1FBQ3BCLEtBQUs7UUFDTCxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU07S0FDeEIsQ0FBQyxDQUFBO0lBRUYsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLDhDQUF3QixFQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUVuRSxNQUFNLElBQUEsK0JBQTBCLEVBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRTtZQUN2QyxNQUFNLEVBQUUsV0FBVztZQUNuQixVQUFVLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLO1lBQ2hDLFlBQVksRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU87WUFDcEMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTTtZQUNsQyxHQUFHLEVBQUUsTUFBTSxDQUFDLE9BQU87U0FDcEIsQ0FBQyxDQUFBO1FBRUYsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsU0FBUyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ2pCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTztZQUN2QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87U0FDeEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixNQUFNLE9BQU8sR0FDWCxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQywyQkFBMkIsQ0FBQTtRQUV0RSxNQUFNLElBQUEsK0JBQTBCLEVBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRTtZQUN2QyxNQUFNLEVBQUUsUUFBUTtZQUNoQixHQUFHLEVBQUU7Z0JBQ0g7b0JBQ0UsTUFBTSxFQUFFLFFBQVE7b0JBQ2hCLE9BQU87aUJBQ1I7YUFDRjtTQUNGLENBQUMsQ0FBQTtRQUVGLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBckZZLFFBQUEsSUFBSSxRQXFGaEIifQ==