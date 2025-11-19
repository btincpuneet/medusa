import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from "typeorm"

export class AddMagentoOrderIdToOrder1731619200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn("order", "magento_order_id")
    if (!hasColumn) {
      await queryRunner.addColumn(
        "order",
        new TableColumn({
          name: "magento_order_id",
          type: "varchar",
          length: "191",
          isNullable: true,
        })
      )
    }

    await queryRunner.createIndex(
      "order",
      new TableIndex({
        name: "IDX_order_magento_order_id",
        columnNames: ["magento_order_id"],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasIndex = await queryRunner.hasIndex(
      "order",
      "IDX_order_magento_order_id"
    )
    if (hasIndex) {
      await queryRunner.dropIndex("order", "IDX_order_magento_order_id")
    }

    const hasColumn = await queryRunner.hasColumn("order", "magento_order_id")
    if (hasColumn) {
      await queryRunner.dropColumn("order", "magento_order_id")
    }
  }
}
