import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm"

import { RedingtonBanner } from "./redington-banner"

@Entity({ name: "redington_banner_slider" })
export class RedingtonBannerSlider {
  @PrimaryColumn({ type: "int" })
  slider_id: number

  @Column({ type: "varchar" })
  name: string

  @Column({ type: "int", default: 0 })
  status: number

  @Column({ type: "varchar" })
  location: string

  @Column({ type: "varchar", nullable: true })
  store_ids: string | null

  @Column({ type: "varchar", nullable: true })
  customer_group_ids: string | null

  @Column({ type: "int", default: 0 })
  priority: number

  @Column({ type: "varchar", default: "slider" })
  effect: string

  @Column({ type: "boolean", nullable: true })
  auto_width: boolean | null

  @Column({ type: "boolean", nullable: true })
  auto_height: boolean | null

  @Column({ type: "int", default: 0 })
  design: number

  @Column({ type: "boolean", nullable: true })
  loop: boolean | null

  @Column({ type: "boolean", nullable: true })
  lazy_load: boolean | null

  @Column({ type: "boolean", nullable: true })
  autoplay: boolean | null

  @Column({ type: "int", default: 0 })
  autoplay_timeout: number

  @Column({ type: "boolean", nullable: true })
  nav: boolean | null

  @Column({ type: "boolean", nullable: true })
  dots: boolean | null

  @Column({ type: "boolean", nullable: true })
  is_responsive: boolean | null

  @Column({ type: "text", default: "[]" })
  responsive_items: string

  @Column({ type: "date", nullable: true })
  from_date: string | null

  @Column({ type: "date", nullable: true })
  to_date: string | null

  @OneToMany(() => RedingtonBanner, (banner) => banner.slider)
  banners?: RedingtonBanner[]

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date
}
