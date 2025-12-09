"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const { md, assertMedusa } = require("../../scripts/clients");
async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Usage: npm run import:product-descriptions -- <path-to-zip-or-csv> [notes]");
        process.exit(1);
    }
    await assertMedusa();
    const resolvedPath = path_1.default.resolve(filePath);
    const filename = path_1.default.basename(resolvedPath);
    const notes = process.argv[3] || undefined;
    console.log(`Reading ${resolvedPath}...`);
    const buffer = await promises_1.default.readFile(resolvedPath);
    const content = buffer.toString("base64");
    console.log("Uploading descriptions to Medusa...");
    const { data } = await md.post("/redington/product-desc/imports", {
        filename,
        content,
        notes,
    });
    console.log("✅ Import complete.");
    console.log(`   ID: ${data.import_id}`);
    console.log(`   Summary: ${data.summary?.updated ?? 0} updated, ${data.summary?.skipped ?? 0} skipped, ${data.summary?.failed ?? 0} failed`);
}
main().catch((error) => {
    console.error("❌ Failed to import product descriptions:", error.message || error);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LXByb2R1Y3QtZGVzY3JpcHRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjcmlwdHMvaW1wb3J0LXByb2R1Y3QtZGVzY3JpcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEseUJBQXNCO0FBRXRCLDJEQUE0QjtBQUM1QixnREFBdUI7QUFFdkIsTUFBTSxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQTtBQUU3RCxLQUFLLFVBQVUsSUFBSTtJQUNqQixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ2hDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEVBQTRFLENBQUMsQ0FBQTtRQUMzRixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ2pCLENBQUM7SUFFRCxNQUFNLFlBQVksRUFBRSxDQUFBO0lBRXBCLE1BQU0sWUFBWSxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDM0MsTUFBTSxRQUFRLEdBQUcsY0FBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQTtJQUM1QyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQTtJQUUxQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsWUFBWSxLQUFLLENBQUMsQ0FBQTtJQUN6QyxNQUFNLE1BQU0sR0FBRyxNQUFNLGtCQUFFLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFBO0lBQzlDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUE7SUFFekMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFBO0lBQ2xELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUNBQWlDLEVBQUU7UUFDaEUsUUFBUTtRQUNSLE9BQU87UUFDUCxLQUFLO0tBQ04sQ0FBQyxDQUFBO0lBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO0lBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQTtJQUN2QyxPQUFPLENBQUMsR0FBRyxDQUNULGVBQWUsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FDaEksQ0FBQTtBQUNILENBQUM7QUFFRCxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtJQUNyQixPQUFPLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLENBQUE7SUFDakYsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNqQixDQUFDLENBQUMsQ0FBQSJ9