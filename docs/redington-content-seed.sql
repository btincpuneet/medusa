-- Sample seed data for the custom Redington category and banner tables.
-- Run inside psql or any PostgreSQL client connected to your Medusa database.

INSERT INTO redington_category (id, parent_id, name, is_active, position, level, product_count)
VALUES
  (3, NULL, 'Redington', TRUE, 2, 1, 201),
  (16, 3, 'PC and Tabs', TRUE, 1, 2, 199),
  (17, 16, 'Laptop', TRUE, 1, 3, 97),
  (19, 17, 'Ideapad', FALSE, 1, 4, 9),
  (40, 17, 'Lenovo', TRUE, 7, 4, 75),
  (29, 3, 'Monitors & Accessories', FALSE, 2, 2, 25)
ON CONFLICT (id) DO UPDATE
SET
  parent_id = EXCLUDED.parent_id,
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  position = EXCLUDED.position,
  level = EXCLUDED.level,
  product_count = EXCLUDED.product_count;

INSERT INTO redington_banner_slider (
  slider_id,
  name,
  status,
  location,
  store_ids,
  customer_group_ids,
  priority,
  effect,
  autoplay_timeout,
  responsive_items,
  from_date,
  to_date
)
VALUES
  (16, 'SideBannerAfterLogin-Desktop-7', 1, 'custom.snippet-code', '0', '0,1,2,3', 0, 'slider', 5000, '[]', '2024-07-01', NULL),
  (28, 'SideBanner-Mobile', 1, 'custom.snippet-code', '1', '0,1,2,3', 0, 'slider', 5000, '[]', '2024-07-07', NULL)
ON CONFLICT (slider_id) DO UPDATE
SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  location = EXCLUDED.location,
  store_ids = EXCLUDED.store_ids,
  customer_group_ids = EXCLUDED.customer_group_ids,
  priority = EXCLUDED.priority,
  effect = EXCLUDED.effect,
  autoplay_timeout = EXCLUDED.autoplay_timeout,
  responsive_items = EXCLUDED.responsive_items,
  from_date = EXCLUDED.from_date,
  to_date = EXCLUDED.to_date;

INSERT INTO redington_banner (
  banner_id,
  slider_id,
  name,
  status,
  type,
  content,
  image_url,
  url_banner,
  title,
  newtab
)
VALUES
  (19, 16, 'Epson Banner 3', 1, 0, NULL, 'http://local.b2c.com/media/mageplaza/bannerslider/banner/image/b/a/banner_6.jpg', NULL, NULL, 0),
  (55, 28, 'SideBanner-Mobile-Large-1', 1, 0, NULL, 'http://local.b2c.com/media/mageplaza/bannerslider/banner/image/e/p/epp_sidebanner_mobile_large.jpg', NULL, NULL, 0)
ON CONFLICT (banner_id) DO UPDATE
SET
  slider_id = EXCLUDED.slider_id,
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  type = EXCLUDED.type,
  content = EXCLUDED.content,
  image_url = EXCLUDED.image_url,
  url_banner = EXCLUDED.url_banner,
  title = EXCLUDED.title,
  newtab = EXCLUDED.newtab;
