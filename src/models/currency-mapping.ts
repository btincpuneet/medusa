
import { BaseEntity } from "@medusajs/medusa";
import { Column, Entity } from "typeorm";

@Entity()
export class CurrencyMapping extends BaseEntity {
  @Column({ type: "varchar" })
  country_code: string;

  @Column({ type: "varchar" })
  currency_code: string;

  @Column({ type: "varchar" })
  shipment_tracking_url: string;

  @Column({ type: "varchar" })
  payment_method: string;
}
