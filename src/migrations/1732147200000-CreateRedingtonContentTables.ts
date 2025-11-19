import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from "typeorm"

export class CreateRedingtonContentTables1732147200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "redington_category",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
          },
          {
            name: "parent_id",
            type: "int",
            isNullable: true,
          },
          {
            name: "name",
            type: "varchar",
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
          },
          {
            name: "position",
            type: "int",
            default: 0,
          },
          {
            name: "level",
            type: "int",
            default: 0,
          },
          {
            name: "product_count",
            type: "int",
            default: 0,
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
        foreignKeys: [
          {
            columnNames: ["parent_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "redington_category",
            onDelete: "SET NULL",
          },
        ],
      })
    )

    await queryRunner.createIndex(
      "redington_category",
      new TableIndex({
        name: "IDX_redington_category_parent_id",
        columnNames: ["parent_id"],
      })
    )

    await queryRunner.createTable(
      new Table({
        name: "redington_banner_slider",
        columns: [
          {
            name: "slider_id",
            type: "int",
            isPrimary: true,
          },
          {
            name: "name",
            type: "varchar",
          },
          {
            name: "status",
            type: "int",
            default: 0,
          },
          {
            name: "location",
            type: "varchar",
          },
          {
            name: "store_ids",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "customer_group_ids",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "priority",
            type: "int",
            default: 0,
          },
          {
            name: "effect",
            type: "varchar",
            default: "'slider'",
          },
          {
            name: "auto_width",
            type: "boolean",
            isNullable: true,
          },
          {
            name: "auto_height",
            type: "boolean",
            isNullable: true,
          },
          {
            name: "design",
            type: "int",
            default: 0,
          },
          {
            name: "loop",
            type: "boolean",
            isNullable: true,
          },
          {
            name: "lazy_load",
            type: "boolean",
            isNullable: true,
          },
          {
            name: "autoplay",
            type: "boolean",
            isNullable: true,
          },
          {
            name: "autoplay_timeout",
            type: "int",
            default: 0,
          },
          {
            name: "nav",
            type: "boolean",
            isNullable: true,
          },
          {
            name: "dots",
            type: "boolean",
            isNullable: true,
          },
          {
            name: "is_responsive",
            type: "boolean",
            isNullable: true,
          },
          {
            name: "responsive_items",
            type: "text",
            default: "'[]'",
          },
          {
            name: "from_date",
            type: "date",
            isNullable: true,
          },
          {
            name: "to_date",
            type: "date",
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

    await queryRunner.createIndex(
      "redington_banner_slider",
      new TableIndex({
        name: "IDX_redington_banner_slider_location",
        columnNames: ["location"],
      })
    )

    await queryRunner.createTable(
      new Table({
        name: "redington_banner",
        columns: [
          {
            name: "banner_id",
            type: "int",
            isPrimary: true,
          },
          {
            name: "slider_id",
            type: "int",
          },
          {
            name: "name",
            type: "varchar",
          },
          {
            name: "status",
            type: "int",
            default: 0,
          },
          {
            name: "type",
            type: "int",
            default: 0,
          },
          {
            name: "content",
            type: "text",
            isNullable: true,
          },
          {
            name: "image_url",
            type: "varchar",
          },
          {
            name: "url_banner",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "title",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "newtab",
            type: "int",
            default: 0,
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
        foreignKeys: [
          {
            columnNames: ["slider_id"],
            referencedTableName: "redington_banner_slider",
            referencedColumnNames: ["slider_id"],
            onDelete: "CASCADE",
          },
        ],
      })
    )

    await queryRunner.createIndex(
      "redington_banner",
      new TableIndex({
        name: "IDX_redington_banner_slider_id",
        columnNames: ["slider_id"],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      "redington_banner",
      "IDX_redington_banner_slider_id"
    )
    await queryRunner.dropTable("redington_banner")

    await queryRunner.dropIndex(
      "redington_banner_slider",
      "IDX_redington_banner_slider_location"
    )
    await queryRunner.dropTable("redington_banner_slider")

    await queryRunner.dropIndex(
      "redington_category",
      "IDX_redington_category_parent_id"
    )
    await queryRunner.dropTable("redington_category")
  }
}
