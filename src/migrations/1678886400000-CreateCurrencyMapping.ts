
import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateCurrencyMapping1678886400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "currency_mapping",
        columns: [
          {
            name: "id",
            type: "varchar",
            isPrimary: true,
          },
          {
            name: "country_code",
            type: "varchar",
          },
          {
            name: "currency_code",
            type: "varchar",
          },
          {
            name: "shipment_tracking_url",
            type: "varchar",
          },
          {
            name: "payment_method",
            type: "varchar",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("currency_mapping");
  }
}
