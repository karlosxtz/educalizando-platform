import type { Product } from './types';
import { homepageProduct } from './homepage-presentation';

/** Store grids need display/search fields, not private delivery or checkout records. */
export function publicStoreProduct(product: Product): Product {
  return {
    ...homepageProduct(product),
    descricao: product.descricao, plr_descricao: product.plr_descricao,
    category_id: product.category_id, category_ids: product.category_ids,
    education_level_id: product.education_level_id, education_level_ids: product.education_level_ids,
    tags: product.tags, seasonal_tags: product.seasonal_tags,
    average_rating: product.average_rating, review_count: product.review_count,
    views_count: product.views_count, sales_count: product.sales_count,
    images: product.images?.slice(0, 6),
    has_original_delivery: product.has_original_delivery,
    format_details: product.format_details, age_range: product.age_range,
    color_mode: product.color_mode, page_count: product.page_count,
  };
}

export function publicProductDetail(product: Product): Product {
  return {
    ...publicStoreProduct(product), images: product.images,
    updated_at: product.updated_at, preview_url: product.preview_url,
    instagram_video_url: product.instagram_video_url,
    order_bump_id: product.order_bump_id,
    order_bump_product: product.order_bump_product ? publicStoreProduct(product.order_bump_product) : null,
  };
}
