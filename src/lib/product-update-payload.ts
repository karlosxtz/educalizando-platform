/** Only creator-editable fields may be written by the privileged API client. */
const editableFields = new Set([
  'titulo', 'descricao', 'tipo', 'preco', 'preco_original', 'is_free', 'is_plr',
  'plr_descricao', 'preco_plr', 'plr_license_url', 'delivery_files', 'plr_delivery_files',
  'allow_affiliates', 'affiliate_commission_rate', 'order_bump_id', 'capa_url',
  'arquivo_url', 'arquivo_nome', 'page_count', 'age_range', 'format_details', 'color_mode',
  'confirm_import_price', 'preview_url', 'instagram_video_url', 'presentation_video_url', 'video_as_cover', 'status', 'store_id',
  'category_id', 'category_ids', 'education_level_id', 'education_level_ids',
  'seasonal_tags', 'tags', 'gallery_urls', 'bncc_skill_ids',
]);

export function editableProductUpdates(value: Record<string, unknown>): Record<string, any> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => editableFields.has(key)));
}

export function validDeliveryInput(value: unknown): boolean {
  return Array.isArray(value) && value.every(item => item && typeof item === 'object'
    && typeof item.url === 'string' && Boolean(item.url.trim())
    && (item.name === undefined || (typeof item.name === 'string' && Boolean(item.name.trim()))));
}
