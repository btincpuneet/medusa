import { Order as MedusaOrder } from "@medusajs/medusa"
import { Column, Entity } from "typeorm"

@Entity()
export class Order extends MedusaOrder {
  @Column({ type: "varchar", nullable: true })
  magento_order_id?: string | null
}
