"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSapIntegrationTables1733702400000 = void 0;
const typeorm_1 = require("typeorm");
class CreateSapIntegrationTables1733702400000 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await queryRunner.createTable(new typeorm_1.Table({
            name: "redington_sap_config",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()",
                },
                {
                    name: "api_url",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "client_id",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "client_secret",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "invoice_api_url",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "invoice_pdf_api_url",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "invoice_client_id",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "invoice_client_secret",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "domain_url",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "company_codes",
                    type: "text",
                    isArray: true,
                    default: "'{}'",
                },
                {
                    name: "notification_emails",
                    type: "text",
                    isArray: true,
                    default: "'{}'",
                },
                {
                    name: "updated_by",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "created_at",
                    type: "timestamptz",
                    default: "now()",
                },
                {
                    name: "updated_at",
                    type: "timestamptz",
                    default: "now()",
                },
            ],
        }));
        await queryRunner.createTable(new typeorm_1.Table({
            name: "redington_sap_sync_log",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()",
                },
                {
                    name: "run_type",
                    type: "varchar",
                },
                {
                    name: "order_id",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "sap_order_number",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "status",
                    type: "varchar",
                    default: "'pending'",
                },
                {
                    name: "message",
                    type: "text",
                    isNullable: true,
                },
                {
                    name: "payload",
                    type: "jsonb",
                    isNullable: true,
                },
                {
                    name: "actor_id",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "duration_ms",
                    type: "integer",
                    isNullable: true,
                },
                {
                    name: "created_at",
                    type: "timestamptz",
                    default: "now()",
                },
                {
                    name: "updated_at",
                    type: "timestamptz",
                    default: "now()",
                },
            ],
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable("redington_sap_sync_log");
        await queryRunner.dropTable("redington_sap_config");
    }
}
exports.CreateSapIntegrationTables1733702400000 = CreateSapIntegrationTables1733702400000;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMTczMzcwMjQwMDAwMC1DcmVhdGVTYXBJbnRlZ3JhdGlvblRhYmxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9taWdyYXRpb25zLzE3MzM3MDI0MDAwMDAtQ3JlYXRlU2FwSW50ZWdyYXRpb25UYWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBSWdCO0FBRWhCLE1BQWEsdUNBQXVDO0lBRzNDLEtBQUssQ0FBQyxFQUFFLENBQUMsV0FBd0I7UUFDdEMsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDLDZDQUE2QyxDQUFDLENBQUE7UUFFdEUsTUFBTSxXQUFXLENBQUMsV0FBVyxDQUMzQixJQUFJLGVBQUssQ0FBQztZQUNSLElBQUksRUFBRSxzQkFBc0I7WUFDNUIsT0FBTyxFQUFFO2dCQUNQO29CQUNFLElBQUksRUFBRSxJQUFJO29CQUNWLElBQUksRUFBRSxNQUFNO29CQUNaLFNBQVMsRUFBRSxJQUFJO29CQUNmLFdBQVcsRUFBRSxJQUFJO29CQUNqQixrQkFBa0IsRUFBRSxNQUFNO29CQUMxQixPQUFPLEVBQUUsb0JBQW9CO2lCQUM5QjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsU0FBUztvQkFDZixJQUFJLEVBQUUsU0FBUztvQkFDZixVQUFVLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLFdBQVc7b0JBQ2pCLElBQUksRUFBRSxTQUFTO29CQUNmLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsZUFBZTtvQkFDckIsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsVUFBVSxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNFLElBQUksRUFBRSxpQkFBaUI7b0JBQ3ZCLElBQUksRUFBRSxTQUFTO29CQUNmLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUscUJBQXFCO29CQUMzQixJQUFJLEVBQUUsU0FBUztvQkFDZixV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