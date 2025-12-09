"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const log_viewer_1 = require("../../../../../lib/log-viewer");
const clampLimit = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return undefined;
    }
    return Math.min(2000, Math.max(50, Math.trunc(parsed)));
};
const GET = async (req, res) => {
    const rawName = req.params?.name;
    if (!rawName || !rawName.length) {
        return res.status(400).json({ message: "Log name is required." });
    }
    const wantsDownload = "download" in (req.query ?? {}) ||
        (typeof req.query?.download === "string" &&
            req.query.download.toLowerCase() !== "false");
    try {
        if (wantsDownload) {
            const handle = await (0, log_viewer_1.getLogDownloadHandle)(rawName);
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${handle.name}"`);
            res.setHeader("Content-Length", handle.size.toString());
            handle.stream.on("error", (err) => {
                res.destroy(err);
            });
            handle.stream.pipe(res);
            return;
        }
        const limit = clampLimit(req.query?.limit) ?? undefined;
        const log = await (0, log_viewer_1.tailLogFile)(rawName, {
            lines: limit,
        });
        return res.json({
            log,
            limit: limit ?? log.lines.length,
        });
    }
    catch (error) {
        if (error instanceof log_viewer_1.LogViewerError) {
            return res.status(error.status).json({ message: error.message });
        }
        return res.status(500).json({
            message: error?.message || "Unable to read log file.",
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9sb2dzL1tuYW1lXS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSw4REFJc0M7QUFFdEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRTtJQUNwQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUM3QixPQUFPLFNBQVMsQ0FBQTtJQUNsQixDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN6RCxDQUFDLENBQUE7QUFFTSxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUE7SUFFaEMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQTtJQUNuRSxDQUFDO0lBRUQsTUFBTSxhQUFhLEdBQ2pCLFVBQVUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQy9CLENBQUMsT0FBTyxHQUFHLENBQUMsS0FBSyxFQUFFLFFBQVEsS0FBSyxRQUFRO1lBQ3RDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLE9BQU8sQ0FBQyxDQUFBO0lBRWpELElBQUksQ0FBQztRQUNILElBQUksYUFBYSxFQUFFLENBQUM7WUFDbEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLGlDQUFvQixFQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ2xELEdBQUcsQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLDJCQUEyQixDQUFDLENBQUE7WUFDMUQsR0FBRyxDQUFDLFNBQVMsQ0FDWCxxQkFBcUIsRUFDckIseUJBQXlCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FDeEMsQ0FBQTtZQUNELEdBQUcsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1lBQ3ZELE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNoQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ2xCLENBQUMsQ0FBQyxDQUFBO1lBQ0YsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDdkIsT0FBTTtRQUNSLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxTQUFTLENBQUE7UUFDdkQsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFBLHdCQUFXLEVBQUMsT0FBTyxFQUFFO1lBQ3JDLEtBQUssRUFBRSxLQUFLO1NBQ2IsQ0FBQyxDQUFBO1FBQ0YsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2QsR0FBRztZQUNILEtBQUssRUFBRSxLQUFLLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNO1NBQ2pDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLElBQUksS0FBSyxZQUFZLDJCQUFjLEVBQUUsQ0FBQztZQUNwQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtRQUNsRSxDQUFDO1FBQ0QsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sSUFBSSwwQkFBMEI7U0FDdEQsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQTtBQTVDWSxRQUFBLEdBQUcsT0E0Q2YifQ==