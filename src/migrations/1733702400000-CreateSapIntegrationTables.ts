import {
  MigrationInterface,
  QueryRunner,
  Table,
} from "typeorm"

export class CreateSapIntegrationTables1733702400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)

    await queryRunner.createTable(
      new Table({
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
      })
    )

    await queryRunner.createTable(
      new Table({
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
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("redington_sap_sync_log")
    await queryRunner.dropTable("redington_sap_config")
  }
}
