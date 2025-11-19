import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm"

import { RedingtonBannerSlider } from "./redington-banner-slider"

@Entity({ name: "redington_banner" })
export class RedingtonBanner {
  @PrimaryColumn({ type: "int" })
  banner_id: number

  @Column({ type: "int" })
  slider_id: number

  @ManyToOne(() => RedingtonBannerSlider, (slider) => slider.banners, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "slider_id" })
  slider?: RedingtonBannerSlider

  @Column({ type: "varchar" })
  name: string

  @Column({ type: "int", default: 0 })
  status: number

  @Column({ type: "int", default: 0 })
  type: number

  @Column({ type: "text", nullable: true })
  content: string | null

  @Column({ type: "varchar" })
  image_url: string

  @Column({ type: "varchar", nullable: true })
  url_banner: string | null

  @Column({ type: "varchar", nullable: true })
  title: string | null

  @Column({ type: "int", default: 0 })
  newtab: number

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date
}
